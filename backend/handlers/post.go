package handlers

import (
	"math"
	"net/http"
	"strconv"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

func GetPosts(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "9"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 9
	}

	base := config.DB.Model(&models.Post{}).Where("posts.status = ?", "published")

	if cat := c.Query("category"); cat != "" {
		base = base.Joins("JOIN categories ON categories.id = posts.category_id").
			Where("categories.slug = ?", cat)
	}
	if tag := c.Query("tag"); tag != "" {
		base = base.Joins("JOIN post_tags ON post_tags.post_id = posts.id").
			Joins("JOIN tags ON tags.id = post_tags.tag_id").
			Where("tags.slug = ?", tag)
	}
	if kw := c.Query("keyword"); kw != "" {
		base = base.Where("posts.title ILIKE ? OR posts.excerpt ILIKE ?", "%"+kw+"%", "%"+kw+"%")
	}

	var total int64
	base.Count(&total)

	var posts []models.Post
	base.Preload("Author").Preload("Category").Preload("Tags").
		Order("posts.published_at DESC").
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
	slug := c.Param("slug")
	var post models.Post
	if err := config.DB.Preload("Author").Preload("Category").Preload("Tags").
		Where("slug = ? AND status = ?", slug, "published").First(&post).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Post not found"})
		return
	}
	config.DB.Model(&post).UpdateColumn("view_count", post.ViewCount+1)
	c.JSON(http.StatusOK, gin.H{"data": post})
}
