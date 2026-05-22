package main

import (
	"log"
	"os"

	"github.com/enterprise-blog/backend/config"
	"github.com/enterprise-blog/backend/models"
	"github.com/enterprise-blog/backend/routes"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
)

func main() {
	if err := godotenv.Load(); err != nil {
		log.Println("No .env file found, reading from environment")
	}

	config.ConnectDatabase()

	// Đảm bảo deleted_at tồn tại trên các bảng cũ (chạy an toàn với IF NOT EXISTS)
	tables := []string{"users", "categories", "tags", "posts", "comments", "media", "crawled_posts", "roles", "permissions"}
	for _, t := range tables {
		config.DB.Exec("ALTER TABLE " + t + " ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ")
	}

	// Tạo các bảng pivot (many2many) nếu chưa tồn tại
	config.DB.Exec(`CREATE TABLE IF NOT EXISTS post_tags (
		post_id BIGINT NOT NULL,
		tag_id  BIGINT NOT NULL,
		PRIMARY KEY (post_id, tag_id)
	)`)
	config.DB.Exec(`CREATE TABLE IF NOT EXISTS role_users (
		user_id BIGINT NOT NULL,
		role_id BIGINT NOT NULL,
		PRIMARY KEY (user_id, role_id)
	)`)
	config.DB.Exec(`CREATE TABLE IF NOT EXISTS role_permissions (
		role_id       BIGINT NOT NULL,
		permission_id BIGINT NOT NULL,
		PRIMARY KEY (role_id, permission_id)
	)`)

	// Auto-migrate tất cả models
	config.DB.AutoMigrate(
		&models.Role{},
		&models.Permission{},
		&models.User{},
		&models.Category{},
		&models.Tag{},
		&models.Post{},
		&models.Comment{},
		&models.Media{},
		&models.CrawledPost{},
	)

	if os.Getenv("GIN_MODE") == "release" {
		gin.SetMode(gin.ReleaseMode)
	}

	r := gin.Default()

	// CORS cho Next.js frontend
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
		AllowCredentials: true,
	}))

	// Serve uploaded files
	r.Static("/uploads", "./uploads")

	routes.Setup(r)

	port := os.Getenv("APP_PORT")
	if port == "" {
		port = "8000"
	}

	log.Printf("Server running on http://localhost:%s", port)
	r.Run(":" + port)
}
