package helper

import (
	"github.com/google/uuid"
)

func GenerateID(length int) string {
	id := uuid.New().String()
	if length > 32 {
		length = 32
	}
	return id[:length]
}
