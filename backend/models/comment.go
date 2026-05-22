package models

type Comment struct {
	BaseModel
	PostID  uint   `gorm:"not null" json:"post_id"`
	UserID  *uint  `json:"user_id"`
	Content string `gorm:"type:text;not null" json:"content"`
	Status  string `gorm:"type:varchar(20);default:'pending'" json:"status"`
	Post    *Post  `gorm:"foreignKey:PostID" json:"post,omitempty"`
	User    *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
