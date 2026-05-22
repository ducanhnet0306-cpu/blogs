package models

type Category struct {
	BaseModel
	Name        string     `gorm:"not null" json:"name"`
	Slug        string     `gorm:"uniqueIndex;not null" json:"slug"`
	Description *string    `json:"description"`
	ParentID    *uint      `json:"parent_id"`
	Status      bool       `gorm:"default:true" json:"status"`
	Parent      *Category  `gorm:"foreignKey:ParentID" json:"parent,omitempty"`
	Children    []Category `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	Posts       []Post     `json:"posts,omitempty"`
}
