package main

import (
	"fmt"

	"github.com/google/uuid"
)

func GenerateID(length int) string {
	id := uuid.New().String()
	if length > 32 {
		length = 32
	}
	return id[:length]
}

func main() {
	id := GenerateID(5)
	fmt.Println("Generated UUID:", id)
}
