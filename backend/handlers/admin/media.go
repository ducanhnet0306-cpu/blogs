package admin

import (
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
)

func UploadMedia(c *gin.Context) {
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"message": "No file uploaded"})
		return
	}

	uploadDir := "uploads"
	if err := os.MkdirAll(uploadDir, os.ModePerm); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create upload directory"})
		return
	}

	ext := filepath.Ext(file.Filename)
	fileName := fmt.Sprintf("%d%s", time.Now().UnixNano(), ext)
	filePath := filepath.Join(uploadDir, fileName)

	if err := c.SaveUploadedFile(file, filePath); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to save file"})
		return
	}

	userID, _ := c.Get("user_id")
	media := models.Media{
		UserID:   userID.(uint),
		FileName: file.Filename,
		FilePath: "/" + filePath,
		FileSize: file.Size,
		MimeType: file.Header.Get("Content-Type"),
		Disk:     "local",
	}
	config.DB.Create(&media)

	c.JSON(http.StatusOK, gin.H{
		"data": media,
		"url":  media.FilePath,
	})
}
