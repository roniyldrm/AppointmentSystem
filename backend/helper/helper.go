package helper

import (
	"math/big"

	"github.com/google/uuid"
)

func GenerateID(length int) string {
	id := uuid.New().String()
	if length > 32 {
		length = 32
	}
	return id[:length]
}

func GenerateIntID(length int) int {
	id := uuid.New().String()
	if length > 32 {
		length = 32
	}

	intID := new(big.Int)
	intID.SetString(id[:length], 16)
	return int(intID.Int64())
}
