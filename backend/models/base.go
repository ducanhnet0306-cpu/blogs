package models

import (
	"time"

	"gorm.io/gorm"
)

// BaseModel thay thế gorm.Model, thêm json tags chuẩn lowercase
type BaseModel struct {
	ID        uint           `gorm:"primarykey" json:"id"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
