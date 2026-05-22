package admin

import (
	"net/http"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type UserInput struct {
	Name     string `json:"name" binding:"required"`
	Email    string `json:"email" binding:"required,email"`
	Password string `json:"password"`
	Avatar   *string `json:"avatar"`
	Phone    *string `json:"phone"`
	Status   string  `json:"status"`
	RoleIDs  []uint  `json:"role_ids"`
}

type StatusInput struct {
	Status string `json:"status" binding:"required"`
}

func GetUsers(c *gin.Context) {
	var users []models.User
	config.DB.Preload("Roles").Find(&users)
	c.JSON(http.StatusOK, gin.H{"data": users})
}

func GetUser(c *gin.Context) {
	var user models.User
	if err := config.DB.Preload("Roles").First(&user, c.Param("user")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	c.JSON(http.StatusOK, gin.H{"data": user})
}

func CreateUser(c *gin.Context) {
	var input UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	hashed, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to hash password"})
		return
	}

	status := input.Status
	if status == "" {
		status = "active"
	}

	user := models.User{
		Name:     input.Name,
		Email:    input.Email,
		Password: string(hashed),
		Avatar:   input.Avatar,
		Phone:    input.Phone,
		Status:   status,
	}
	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"message": "Failed to create user"})
		return
	}

	if len(input.RoleIDs) > 0 {
		var roles []models.Role
		config.DB.Find(&roles, input.RoleIDs)
		config.DB.Model(&user).Association("Roles").Replace(roles)
	}

	config.DB.Preload("Roles").First(&user, user.ID)
	c.JSON(http.StatusCreated, gin.H{"data": user})
}

func UpdateUser(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("user")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	var input UserInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	updates := map[string]interface{}{
		"name":   input.Name,
		"email":  input.Email,
		"avatar": input.Avatar,
		"phone":  input.Phone,
		"status": input.Status,
	}
	if input.Password != "" {
		hashed, _ := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		updates["password"] = string(hashed)
	}

	config.DB.Model(&user).Updates(updates)

	if input.RoleIDs != nil {
		var roles []models.Role
		config.DB.Find(&roles, input.RoleIDs)
		config.DB.Model(&user).Association("Roles").Replace(roles)
	}

	config.DB.Preload("Roles").First(&user, user.ID)
	c.JSON(http.StatusOK, gin.H{"data": user})
}

func DeleteUser(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("user")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}
	config.DB.Delete(&user)
	c.JSON(http.StatusOK, gin.H{"message": "User deleted"})
}

func UpdateUserStatus(c *gin.Context) {
	var user models.User
	if err := config.DB.First(&user, c.Param("user")).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"message": "User not found"})
		return
	}

	var input StatusInput
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusUnprocessableEntity, gin.H{"message": err.Error()})
		return
	}

	config.DB.Model(&user).Update("status", input.Status)
	c.JSON(http.StatusOK, gin.H{"data": user})
}
