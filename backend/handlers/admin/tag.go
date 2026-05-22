package admin

import (
	"net/http"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

type TagInput struct {
	Name string `json:"name" binding:"required"`
	Slug string `json:"slug" binding:"required"`
}

func GetTags(c *gin.Context) {
	var tags []models.Tag
	config.DB.Find(&tags)
	c.JSON(http.StatusOK, gin.H{"data": tags})
}

func CreateTag(c *gin.Context) {
	var input TagInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}
	tag := models.Tag{Name: input.Name, Slug: input.Slug}
	if err := config.DB.Create(&tag).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create tag"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": tag})
}

func UpdateTag(c *gin.Context) {
	var tag models.Tag
	if err := config.DB.First(&tag, c.Param("tag")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Tag not found"})
		return
	}
	var input TagInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}
	config.DB.Model(&tag).Updates(models.Tag{Name: input.Name, Slug: input.Slug})
	c.JSON(http.StatusOK, gin.H{"data": tag})
}

func DeleteTag(c *gin.Context) {
	var tag models.Tag
	if err := config.DB.First(&tag, c.Param("tag")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Tag not found"})
		return
	}
	config.DB.Delete(&tag)
	c.JSON(http.StatusOK, gin.H{"message": "Tag deleted"})
}
