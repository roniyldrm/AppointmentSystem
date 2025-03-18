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

func RemoveFromSlice(slice []int, value any) []int {
	i := 0
	for _, v := range slice {
		if v != value {
			slice[i] = v
			i++
		}
	}
	return slice[:i]
}
