package handlers

import (
	"net/http"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

func GetTags(c *gin.Context) {
	var tags []models.Tag
	config.DB.Find(&tags)
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func GetTagPosts(c *gin.Context) {
	slug := c.Param("slug")
	var tag models.Tag
	if err := config.DB.Where("slug = ?", slug).First(&tag).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Tag not found"})
		return
	}

	var posts []models.Post
	config.DB.Preload("User").Preload("Category").Preload("Tags").
		Joins("JOIN post_tags ON post_tags.post_id = posts.id").
		Where("post_tags.tag_id = ? AND posts.status = ?", tag.ID, "published").
		Order("posts.published_at DESC").Find(&posts)

	c.JSON(http.StatusOK, gin.H{
		"tag":  tag,
		"data": posts,
	})
}
