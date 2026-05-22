package routes

import (
	"github.com/enterprise-blog/backend/handlers"
	"github.com/enterprise-blog/backend/handlers/admin"
	"github.com/enterprise-blog/backend/middleware"
	"github.com/gin-gonic/gin"
)

func Setup(r *gin.Engine) {
	v1 := r.Group("/api/v1")

	// ── Auth public ──────────────────────────────────────────
	auth := v1.Group("/auth")
	{
		auth.POST("/register", handlers.Register)
		auth.POST("/login", handlers.Login)
	}

	// ── Public blog ──────────────────────────────────────────
	v1.GET("/posts", handlers.GetPosts)
	v1.GET("/posts/:slug", handlers.GetPost)
	v1.GET("/categories", handlers.GetCategories)
	v1.GET("/categories/:slug/posts", handlers.GetCategoryPosts)
	v1.GET("/tags", handlers.GetTags)
	v1.GET("/tags/:slug/posts", handlers.GetTagPosts)

	// ── Protected ────────────────────────────────────────────
	protected := v1.Group("/")
	protected.Use(middleware.AuthRequired())
	{
		protected.POST("/auth/logout", handlers.Logout)
		protected.GET("/auth/me", handlers.Me)

		// ── Admin ─────────────────────────────────────────────
		adminGroup := protected.Group("/admin")
		adminGroup.Use(middleware.AdminRequired())
		{
			// Posts
			adminGroup.GET("/posts", admin.GetPosts)
			adminGroup.POST("/posts", admin.CreatePost)
			adminGroup.GET("/posts/:post", admin.GetPost)
			adminGroup.PUT("/posts/:post", admin.UpdatePost)
			adminGroup.DELETE("/posts/:post", admin.DeletePost)
			adminGroup.PATCH("/posts/:post/publish", admin.PublishPost)
			adminGroup.PATCH("/posts/:post/archive", admin.ArchivePost)

			// Categories
			adminGroup.GET("/categories", admin.GetCategories)
			adminGroup.POST("/categories", admin.CreateCategory)
			adminGroup.GET("/categories/:category", admin.GetCategory)
			adminGroup.PUT("/categories/:category", admin.UpdateCategory)
			adminGroup.DELETE("/categories/:category", admin.DeleteCategory)

			// Tags
			adminGroup.GET("/tags", admin.GetTags)
			adminGroup.POST("/tags", admin.CreateTag)
			adminGroup.PUT("/tags/:tag", admin.UpdateTag)
			adminGroup.DELETE("/tags/:tag", admin.DeleteTag)

			// Users
			adminGroup.GET("/users", admin.GetUsers)
			adminGroup.POST("/users", admin.CreateUser)
			adminGroup.GET("/users/:user", admin.GetUser)
			adminGroup.PUT("/users/:user", admin.UpdateUser)
			adminGroup.DELETE("/users/:user", admin.DeleteUser)
			adminGroup.PATCH("/users/:user/status", admin.UpdateUserStatus)

			// Media
			adminGroup.POST("/media/upload", admin.UploadMedia)

			// Crawler
			adminGroup.GET("/crawler", admin.ListCrawled)
			adminGroup.POST("/crawler", admin.CrawlURL)
			adminGroup.POST("/crawler/:id/publish", admin.PublishCrawled)
			adminGroup.DELETE("/crawler/:id", admin.DeleteCrawled)
		}
	}
}
