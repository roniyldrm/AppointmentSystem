package helper

import (
	"math/big"
	"net/smtp"
	"os"

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

// SendEmail sends an email using SMTP
func SendEmail(to []string, subject, body string) error {
	from := os.Getenv("EMAIL_FROM")
	password := os.Getenv("EMAIL_PASSWORD")
	smtpHost := os.Getenv("SMTP_HOST")
	smtpPort := os.Getenv("SMTP_PORT")

	// Message
	message := []byte("Subject: " + subject + "\r\n" +
		"To: " + to[0] + "\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: text/html; charset=UTF-8\r\n" +
		"\r\n" +
		body)

	// Authentication
	auth := smtp.PlainAuth("", from, password, smtpHost)

	// Send email
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, from, to, message)
	return err
}

// SendAppointmentConfirmation sends an email confirmation for a new appointment
func SendAppointmentConfirmation(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Your Appointment Confirmation"
	body := `
	<html>
	<body>
		<h2>Appointment Confirmation</h2>
		<p>Dear ` + patientName + `,</p>
		<p>Your appointment has been successfully scheduled.</p>
		<p>
			<strong>Doctor:</strong> ` + doctorName + `<br>
			<strong>Hospital:</strong> ` + hospitalName + `<br>
			<strong>Date:</strong> ` + date + `<br>
			<strong>Time:</strong> ` + time + `
		</p>
		<p>Thank you for using our hospital appointment system.</p>
	</body>
	</html>
	`
	return SendEmail([]string{email}, subject, body)
}

// SendAppointmentCancellation sends an email about an appointment cancellation
func SendAppointmentCancellation(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Your Appointment Cancellation"
	body := `
	<html>
	<body>
		<h2>Appointment Cancellation</h2>
		<p>Dear ` + patientName + `,</p>
		<p>Your appointment has been cancelled.</p>
		<p>
			<strong>Doctor:</strong> ` + doctorName + `<br>
			<strong>Hospital:</strong> ` + hospitalName + `<br>
			<strong>Date:</strong> ` + date + `<br>
			<strong>Time:</strong> ` + time + `
		</p>
		<p>Thank you for using our hospital appointment system.</p>
	</body>
	</html>
	`
	return SendEmail([]string{email}, subject, body)
}

// SendDoctorAppointmentNotification notifies the doctor about a new appointment
func SendDoctorAppointmentNotification(email, doctorName, patientName, hospitalName, date, time string) error {
	subject := "New Appointment Scheduled"
	body := `
	<html>
	<body>
		<h2>New Appointment</h2>
		<p>Dear Dr. ` + doctorName + `,</p>
		<p>A new appointment has been scheduled with you.</p>
		<p>
			<strong>Patient:</strong> ` + patientName + `<br>
			<strong>Hospital:</strong> ` + hospitalName + `<br>
			<strong>Date:</strong> ` + date + `<br>
			<strong>Time:</strong> ` + time + `
		</p>
	</body>
	</html>
	`
	return SendEmail([]string{email}, subject, body)
}
