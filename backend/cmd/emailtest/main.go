package main

import (
	"fmt"
	"log"

	"backend/helper"
)

func main() {
	fmt.Println("Starting email test...")

	err := helper.SendTestEmail()
	if err != nil {
		log.Fatalf("Test failed: %v", err)
	}

	fmt.Println("Email test completed successfully!")
}
