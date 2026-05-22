package models

type Tag struct {
	BaseModel
	Name  string `gorm:"not null" json:"name"`
	Slug  string `gorm:"uniqueIndex;not null" json:"slug"`
	Posts []Post `gorm:"many2many:post_tags;" json:"posts,omitempty"`
}
