package admin

import (
	"bytes"
	"fmt"
	"io"
	"math"
	nethttp "net/http"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/net/html"
)

// ── Scraper ───────────────────────────────────────────────────────────────────

type scraped struct {
	Title       string
	Description string
	Image       string
	Content     string
}

var skipTags = map[string]bool{
	"script": true, "style": true, "noscript": true,
	"iframe": true, "form": true, "svg": true,
}

func fetchAndScrape(rawURL string) (*scraped, error) {
	client := &nethttp.Client{Timeout: 15 * time.Second}
	req, err := nethttp.NewRequest("GET", rawURL, nil)
	if err != nil {
		return nil, fmt.Errorf("URL không hợp lệ: %w", err)
	}
	req.Header.Set("User-Agent", "Mozilla/5.0 (compatible; BlogCrawler/1.0)")
	req.Header.Set("Accept", "text/html,application/xhtml+xml;q=0.9,*/*;q=0.8")

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("không thể tải trang: %w", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	doc, err := html.Parse(bytes.NewReader(body))
	if err != nil {
		return nil, fmt.Errorf("không thể phân tích HTML: %w", err)
	}

	data := &scraped{}

	var walkMeta func(*html.Node)
	walkMeta = func(n *html.Node) {
		if n.Type == html.ElementNode {
			switch n.Data {
			case "title":
				if data.Title == "" && n.FirstChild != nil {
					data.Title = strings.TrimSpace(n.FirstChild.Data)
				}
			case "meta":
				var name, prop, content string
				for _, a := range n.Attr {
					switch a.Key {
					case "name":
						name = a.Val
					case "property":
						prop = a.Val
					case "content":
						content = a.Val
					}
				}
				switch {
				case prop == "og:title" && content != "":
					data.Title = content
				case (prop == "og:description" || name == "description") && data.Description == "":
					data.Description = content
				case prop == "og:image" && content != "":
					data.Image = content
				}
			}
		}
		for c := n.FirstChild; c != nil; c = c.NextSibling {
			walkMeta(c)
		}
	}
	walkMeta(doc)

	// Extract content: try <article> → <main> → <body>
	for _, tag := range []string{"article", "main", "body"} {
		node := findTag(doc, tag)
		if node != nil {
			data.Content = renderFiltered(node)
			break
		}
	}

	return data, nil
}

func findTag(n *html.Node, tag string) *html.Node {
	if n.Type == html.ElementNode && n.Data == tag {
		return n
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		if found := findTag(c, tag); found != nil {
			return found
		}
	}
	return nil
}

func renderFiltered(n *html.Node) string {
	var buf bytes.Buffer
	var walk func(*html.Node)
	walk = func(node *html.Node) {
		if node.Type == html.ElementNode {
			if skipTags[node.Data] {
				return
			}
			buf.WriteString("<" + node.Data)
			for _, a := range node.Attr {
				switch a.Key {
				case "src", "alt", "href", "width", "height":
					buf.WriteString(fmt.Sprintf(` %s="%s"`, a.Key, a.Val))
				}
			}
			buf.WriteString(">")
			for c := node.FirstChild; c != nil; c = c.NextSibling {
				walk(c)
			}
			buf.WriteString("</" + node.Data + ">")
		} else if node.Type == html.TextNode {
			buf.WriteString(node.Data)
		}
	}
	for c := n.FirstChild; c != nil; c = c.NextSibling {
		walk(c)
	}
	return buf.String()
}

func makeSlug(title string) string {
	var b strings.Builder
	for _, r := range strings.ToLower(title) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
		case unicode.IsSpace(r) || r == '-' || r == '_':
			b.WriteRune('-')
		}
	}
	slug := strings.Trim(b.String(), "-")
	for strings.Contains(slug, "--") {
		slug = strings.ReplaceAll(slug, "--", "-")
	}
	if slug == "" {
		slug = "bai-viet"
	}
	return slug + "-" + strconv.FormatInt(time.Now().UnixMilli(), 36)
}

// ── Handlers ──────────────────────────────────────────────────────────────────

func ListCrawled(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	if page < 1 {
		page = 1
	}
	const perPage = 20

	var total int64
	config.DB.Model(&models.CrawledPost{}).Count(&total)

	var items []models.CrawledPost
	config.DB.Preload("Post").
		Order("created_at DESC").
		Limit(perPage).Offset((page - 1) * perPage).
		Find(&items)

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage < 1 {
		lastPage = 1
	}

	c.JSON(200, gin.H{
		"success": true,
		"data": gin.H{
			"data":         items,
			"current_page": page,
			"last_page":    lastPage,
			"total":        total,
		},
	})
}

func CrawlURL(c *gin.Context) {
	var body struct {
		URL string `json:"url" binding:"required"`
	}
	if err := c.ShouldBindJSON(&body); err != nil || body.URL == "" {
		c.JSON(400, gin.H{"message": "URL không được để trống"})
		return
	}

	// Return existing if URL already crawled
	var existing models.CrawledPost
	if config.DB.Where("source_url = ?", body.URL).First(&existing).Error == nil {
		config.DB.Model(&existing).Update("updated_at", time.Now())
		config.DB.Preload("Post").First(&existing, existing.ID)
		c.JSON(200, gin.H{"success": true, "data": existing, "updated": true})
		return
	}

	data, err := fetchAndScrape(body.URL)
	if err != nil {
		c.JSON(422, gin.H{"message": err.Error()})
		return
	}

	item := models.CrawledPost{
		SourceURL: body.URL,
		Title:     data.Title,
		Content:   data.Content,
		Status:    "pending",
	}
	if data.Description != "" {
		desc := data.Description
		item.Excerpt = &desc
		item.SeoDescription = &desc
	}
	if data.Image != "" {
		img := data.Image
		item.Thumbnail = &img
	}
	if data.Title != "" {
		t := data.Title
		item.SeoTitle = &t
	}

	if err := config.DB.Create(&item).Error; err != nil {
		c.JSON(500, gin.H{"message": "Lưu thất bại"})
		return
	}

	c.JSON(201, gin.H{"success": true, "data": item})
}

func PublishCrawled(c *gin.Context) {
	var item models.CrawledPost
	if err := config.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(404, gin.H{"message": "Không tìm thấy"})
		return
	}

	var body struct {
		Status string `json:"status"`
	}
	c.ShouldBindJSON(&body)
	if body.Status == "" {
		body.Status = "published"
	}

	userID, _ := c.Get("user_id")
	title := item.Title
	if title == "" {
		title = "Bài viết từ crawl"
	}

	post := models.Post{
		UserID:    userID.(uint),
		Title:     title,
		Slug:      makeSlug(title),
		Content:   item.Content,
		Excerpt:   item.Excerpt,
		Thumbnail: item.Thumbnail,
		Status:    body.Status,
	}
	if body.Status == "published" {
		now := time.Now()
		post.PublishedAt = &now
	}

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(500, gin.H{"message": "Tạo bài viết thất bại"})
		return
	}

	config.DB.Model(&item).Updates(map[string]interface{}{
		"status":  "published",
		"post_id": post.ID,
	})

	c.JSON(200, gin.H{"success": true, "data": item, "post": post})
}

func DeleteCrawled(c *gin.Context) {
	var item models.CrawledPost
	if err := config.DB.First(&item, c.Param("id")).Error; err != nil {
		c.JSON(404, gin.H{"message": "Không tìm thấy"})
		return
	}
	config.DB.Delete(&item)
	c.JSON(200, gin.H{"success": true})
}
