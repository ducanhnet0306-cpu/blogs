package admin

import (
	"math"
	"net/http"
	"strconv"
	"strings"
	"time"
	"unicode"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

type PostInput struct {
	CategoryID     *uint   `json:"category_id"`
	Title          string  `json:"title" binding:"required"`
	Slug           string  `json:"slug"`
	Excerpt        *string `json:"excerpt"`
	Content        string  `json:"content" binding:"required"`
	Thumbnail      *string `json:"thumbnail"`
	Status         string  `json:"status"`
	IsFeatured     bool    `json:"is_featured"`
	SeoTitle       *string `json:"seo_title"`
	SeoDescription *string `json:"seo_description"`
	SeoKeywords    *string `json:"seo_keywords"`
	TagIDs         []uint  `json:"tag_ids"`
}

func slugifyTitle(title string) string {
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

func GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "15"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 15
	}

	base := config.DB.Model(&models.Post{})

	if status := c.Query("status"); status != "" {
		base = base.Where("status = ?", status)
	}
	if kw := c.Query("keyword"); kw != "" {
		base = base.Where("title ILIKE ? OR excerpt ILIKE ?", "%"+kw+"%", "%"+kw+"%")
	}

	var total int64
	base.Count(&total)

	var posts []models.Post
	base.Preload("Author").Preload("Category").Preload("Tags").
		Order("created_at DESC").
		Limit(perPage).Offset((page - 1) * perPage).
		Find(&posts)

	lastPage := int(math.Ceil(float64(total) / float64(perPage)))
	if lastPage < 1 {
		lastPage = 1
	}

	c.JSON(http.StatusOK, gin.H{
		"data": posts,
		"meta": gin.H{
			"current_page": page,
			"per_page":     perPage,
			"total":        total,
			"last_page":    lastPage,
		},
	})
}

func GetPost(c *gin.Context) {
	var post models.Post
	if err := config.DB.Preload("Author").Preload("Category").Preload("Tags").
		First(&post, c.Param("post")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": post})
}

func CreatePost(c *gin.Context) {
	var input PostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	userID, _ := c.Get("user_id")
	status := input.Status
	if status == "" {
		status = "draft"
	}
	slug := input.Slug
	if slug == "" {
		slug = slugifyTitle(input.Title)
	}

	post := models.Post{
		UserID:         userID.(uint),
		CategoryID:     input.CategoryID,
		Title:          input.Title,
		Slug:           slug,
		Excerpt:        input.Excerpt,
		Content:        input.Content,
		Thumbnail:      input.Thumbnail,
		Status:         status,
		IsFeatured:     input.IsFeatured,
		SeoTitle:       input.SeoTitle,
		SeoDescription: input.SeoDescription,
		SeoKeywords:    input.SeoKeywords,
	}

	if err := config.DB.Create(&post).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create post"})
		return
	}

	if len(input.TagIDs) > 0 {
		var tags []models.Tag
		config.DB.Find(&tags, input.TagIDs)
		config.DB.Model(&post).Association("Tags").Replace(tags)
	}

	config.DB.Preload("Author").Preload("Category").Preload("Tags").First(&post, post.ID)
	c.JSON(http.StatusCreated, gin.H{"data": post})
}

func UpdatePost(c *gin.Context) {
	var post models.Post
	if err := config.DB.First(&post, c.Param("post")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}

	var input PostInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	// Keep existing slug if not provided (changing slug breaks URLs of published posts)
	slug := input.Slug
	if slug == "" {
		slug = post.Slug
	}

	config.DB.Model(&post).Updates(models.Post{
		CategoryID:     input.CategoryID,
		Title:          input.Title,
		Slug:           slug,
		Excerpt:        input.Excerpt,
		Content:        input.Content,
		Thumbnail:      input.Thumbnail,
		Status:         input.Status,
		IsFeatured:     input.IsFeatured,
		SeoTitle:       input.SeoTitle,
		SeoDescription: input.SeoDescription,
		SeoKeywords:    input.SeoKeywords,
	})

	if input.TagIDs != nil {
		var tags []models.Tag
		config.DB.Find(&tags, input.TagIDs)
		config.DB.Model(&post).Association("Tags").Replace(tags)
	}

	config.DB.Preload("Author").Preload("Category").Preload("Tags").First(&post, post.ID)
	c.JSON(http.StatusOK, gin.H{"data": post})
}

func DeletePost(c *gin.Context) {
	var post models.Post
	if err := config.DB.First(&post, c.Param("post")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}
	config.DB.Delete(&post)
	c.JSON(http.StatusOK, gin.H{"message": "Post deleted"})
}

func PublishPost(c *gin.Context) {
	var post models.Post
	if err := config.DB.First(&post, c.Param("post")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}
	now := time.Now()
	config.DB.Model(&post).Updates(map[string]interface{}{
		"status":       "published",
		"published_at": now,
	})
	c.JSON(http.StatusOK, gin.H{"data": post})
}

func ArchivePost(c *gin.Context) {
	var post models.Post
	if err := config.DB.First(&post, c.Param("post")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}
	config.DB.Model(&post).Update("status", "archived")
	c.JSON(http.StatusOK, gin.H{"data": post})
}
