package admin

import (
	"net/http"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

type CategoryInput struct {
	Name        string  `json:"name" binding:"required"`
	Slug        string  `json:"slug" binding:"required"`
	Description *string `json:"description"`
	ParentID    *uint   `json:"parent_id"`
	Status      bool    `json:"status"`
}

func GetCategories(c *gin.Context) {
	var categories []models.Category
	config.DB.Preload("Children").Find(&categories)
	c.JSON(http.StatusOK, gin.H{"data": categories})
}

func GetCategory(c *gin.Context) {
	var category models.Category
	if err := config.DB.Preload("Children").First(&category, c.Param("category")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Category not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": category})
}

func CreateCategory(c *gin.Context) {
	var input CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	category := models.Category{
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		ParentID:    input.ParentID,
		Status:      input.Status,
	}
	if err := config.DB.Create(&category).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create category"})
		return
	}
	c.JSON(http.StatusCreated, gin.H{"data": category})
}

func UpdateCategory(c *gin.Context) {
	var category models.Category
	if err := config.DB.First(&category, c.Param("category")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Category not found"})
		return
	}

	var input CategoryInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	config.DB.Model(&category).Updates(models.Category{
		Name:        input.Name,
		Slug:        input.Slug,
		Description: input.Description,
		ParentID:    input.ParentID,
		Status:      input.Status,
	})
	c.JSON(http.StatusOK, gin.H{"data": category})
}

func DeleteCategory(c *gin.Context) {
	var category models.Category
	if err := config.DB.First(&category, c.Param("category")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "Category not found"})
		return
	}
	config.DB.Delete(&category)
	c.JSON(http.StatusOK, gin.H{"message": "Category deleted"})
}
