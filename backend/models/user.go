package models

import "time"

type User struct {
	BaseModel
	Name            string     `gorm:"not null" json:"name"`
	Email           string     `gorm:"uniqueIndex;not null" json:"email"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	Password        string     `gorm:"not null" json:"-"`
	Avatar          *string    `json:"avatar"`
	Phone           *string    `json:"phone"`
	Status          string     `gorm:"type:varchar(20);default:'active'" json:"status"`
	Roles           []Role     `gorm:"many2many:role_users;" json:"roles,omitempty"`
	Posts           []Post     `json:"posts,omitempty"`
	Media           []Media    `json:"media,omitempty"`
}
