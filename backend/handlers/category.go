package handlers

import (
	"net/http"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

func GetCategories(c *gin.Context) {
	var categories []models.Category
	config.DB.Where("status = ?", true).Find(&categories)
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func GetCategoryPosts(c *gin.Context) {
	slug := c.Param("slug")
	var category models.Category
	if err := config.DB.Where("slug = ?", slug).First(&category).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Category not found"})
		return
	}

	var posts []models.Post
	config.DB.Preload("User").Preload("Category").Preload("Tags").
		Where("category_id = ? AND status = ?", category.ID, "published").
		Order("published_at DESC").Find(&posts)

	c.JSON(http.StatusOK, gin.H{
		"category": category,
		"data":     posts,
	})
}
