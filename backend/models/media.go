package models

type Media struct {
	BaseModel
	UserID   uint   `gorm:"not null" json:"user_id"`
	FileName string `gorm:"not null" json:"file_name"`
	FilePath string `gorm:"not null" json:"file_path"`
	FileSize int64  `json:"file_size"`
	MimeType string `json:"mime_type"`
	Disk     string `gorm:"default:'local'" json:"disk"`
	User     *User  `gorm:"foreignKey:UserID" json:"user,omitempty"`
}
