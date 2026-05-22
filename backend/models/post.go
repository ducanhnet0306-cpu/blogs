package models

import "time"

type Post struct {
	BaseModel
	UserID         uint       `gorm:"not null" json:"user_id"`
	CategoryID     *uint      `json:"category_id"`
	Title          string     `gorm:"not null" json:"title"`
	Slug           string     `gorm:"uniqueIndex;not null" json:"slug"`
	Excerpt        *string    `json:"excerpt"`
	Content        string     `gorm:"type:text;not null" json:"content"`
	Thumbnail      *string    `json:"thumbnail"`
	Status         string     `gorm:"type:varchar(20);default:'draft'" json:"status"`
	IsFeatured     bool       `gorm:"default:false" json:"is_featured"`
	PublishedAt    *time.Time `json:"published_at"`
	SeoTitle       *string    `json:"seo_title"`
	SeoDescription *string    `json:"seo_description"`
	SeoKeywords    *string    `json:"seo_keywords"`
	ViewCount      uint       `gorm:"default:0" json:"view_count"`
	Author         *User      `gorm:"foreignKey:UserID" json:"author,omitempty"`
	Category       *Category  `gorm:"foreignKey:CategoryID" json:"category,omitempty"`
	Tags           []Tag      `gorm:"many2many:post_tags;" json:"tags,omitempty"`
}
