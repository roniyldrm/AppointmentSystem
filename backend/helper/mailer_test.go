package helper

import (
	"log"
	"testing"
)

func TestSendEmail(t *testing.T) {
	// Test recipient
	recipientEmail := "isotuncel4@gmail.com"

	// Set up test data
	patientName := "İsmail Tunçel"
	doctorName := "Ahmet Yılmaz"
	hospitalName := "e-pulse Hastanesi"
	date := "15.11.2023"
	time := "14:30"

	// Send a test confirmation email
	err := SendAppointmentConfirmationEmail(
		recipientEmail,
		patientName,
		doctorName,
		hospitalName,
		date,
		time,
	)

	if err != nil {
		t.Errorf("Failed to send test email: %v", err)
	} else {
		t.Logf("Test email sent successfully to %s", recipientEmail)
	}
}

// This function can be run directly to test email sending without running a full test
func SendTestEmail() error {
	// Test recipient
	recipientEmail := "isotuncel4@gmail.com"

	// Set up test data
	patientName := "İsmail Tunçel"
	doctorName := "Ahmet Yılmaz"
	hospitalName := "e-pulse Hastanesi"
	date := "15.11.2023"
	time := "14:30"

	log.Printf("Sending test email to %s...", recipientEmail)

	// Send a test confirmation email
	err := SendAppointmentConfirmationEmail(
		recipientEmail,
		patientName,
		doctorName,
		hospitalName,
		date,
		time,
	)

	if err != nil {
		log.Printf("Failed to send test email: %v", err)
		return err
	}

	log.Printf("Test email sent successfully to %s", recipientEmail)
	return nil
}
