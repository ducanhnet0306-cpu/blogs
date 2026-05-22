package models

type CrawledPost struct {
	BaseModel
	SourceURL      string  `gorm:"not null" json:"source_url"`
	Title          string  `json:"title"`
	Excerpt        *string `gorm:"type:text" json:"excerpt"`
	Content        string  `gorm:"type:text" json:"content"`
	Thumbnail      *string `json:"thumbnail"`
	SeoTitle       *string `json:"seo_title"`
	SeoDescription *string `json:"seo_description"`
	Status         string  `gorm:"type:varchar(20);default:'pending'" json:"status"`
	PostID         *uint   `json:"post_id"`
	Post           *Post   `gorm:"foreignKey:PostID" json:"post,omitempty"`
}
