package helper

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/smtp"
	"os"
	"strings"
	"time"

	"github.com/mailersend/mailersend-go"
)

// MailerSendConfig holds the configuration for MailerSend
type MailerSendConfig struct {
	APIKey    string
	FromName  string
	FromEmail string
}

// GetMailerSendConfig returns the MailerSend configuration from environment variables
func GetMailerSendConfig() MailerSendConfig {
	// For development, hardcode the API key
	apiKey := os.Getenv("MAILERSEND_API_KEY")
	if apiKey == "" {
		// If not set in environment, use the provided key
		apiKey = "mlsn.e8037a22dfb79211b6c58915d958459758b67dd111309d723757ea8043a5df66"
	}

	fromName := os.Getenv("MAILERSEND_FROM_NAME")
	if fromName == "" {
		fromName = "e-pulse"
	}

	fromEmail := os.Getenv("MAILERSEND_FROM_EMAIL")
	if fromEmail == "" {
		// Using the SMTP user from the MailerSend dashboard
		fromEmail = "MS_GvXVNm@test-r83ql3ppdmvgzw1j.mlsender.net"
	}

	return MailerSendConfig{
		APIKey:    apiKey,
		FromName:  fromName,
		FromEmail: fromEmail,
	}
}

// GetSMTPConfig returns SMTP configuration for MailerSend
func GetSMTPConfig() struct {
	Host      string
	Port      string
	Username  string
	Password  string
	FromName  string
	FromEmail string
} {
	// Get password from environment variable, or use the one from MailerSend dashboard
	password := os.Getenv("MAILERSEND_SMTP_PASSWORD")
	if password == "" {
		// Use the password from your MailerSend SMTP configuration
		password = "mssp.u07tr2q.0p7kx4xn9eeg9yjr.9pmDH3B"
	}

	return struct {
		Host      string
		Port      string
		Username  string
		Password  string
		FromName  string
		FromEmail string
	}{
		Host:      "smtp.mailersend.net",
		Port:      "587",
		Username:  "MS_GvXVNm@test-r83ql3ppdmvgzw1j.mlsender.net", // From your screenshot
		Password:  password,
		FromName:  "e-pulse Randevu Sistemi",
		FromEmail: "MS_GvXVNm@test-r83ql3ppdmvgzw1j.mlsender.net",
	}
}

// SendMailerSendEmail sends an email using MailerSend API
func SendMailerSendEmail(recipients []string, subject, htmlContent, textContent string, templateVariables map[string]interface{}) error {
	config := GetMailerSendConfig()
	if config.APIKey == "" {
		return fmt.Errorf("MAILERSEND_API_KEY environment variable is not set")
	}

	// Enhanced logging for debugging
	log.Printf("=== EMAIL DEBUG START ===")
	log.Printf("Attempting to send email to: %v", recipients)
	log.Printf("From email: %s", config.FromEmail)
	log.Printf("Subject: %s", subject)
	log.Printf("API Key (first 10 chars): %s...", config.APIKey[:10])

	ms := mailersend.NewMailersend(config.APIKey)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	from := mailersend.From{
		Name:  config.FromName,
		Email: config.FromEmail,
	}

	// Convert recipients to MailerSend format
	recipientsList := make([]mailersend.Recipient, 0, len(recipients))
	for _, email := range recipients {
		// Validate email format
		if email == "" {
			log.Printf("Warning: Empty email address provided")
			continue
		}

		log.Printf("Adding recipient: %s", email)
		recipientsList = append(recipientsList, mailersend.Recipient{
			Email: email,
		})
	}

	if len(recipientsList) == 0 {
		return fmt.Errorf("no valid recipients provided")
	}

	// Create message
	message := ms.Email.NewMessage()
	message.SetFrom(from)
	message.SetRecipients(recipientsList)
	message.SetSubject(subject)
	message.SetHTML(htmlContent)
	message.SetText(textContent)

	// Add template variables if provided
	if len(templateVariables) > 0 {
		// Convert variables to MailerSend format
		variables := make([]mailersend.Variables, 0, len(recipients))
		for _, email := range recipients {
			substitutions := make([]mailersend.Substitution, 0, len(templateVariables))
			for key, value := range templateVariables {
				// Convert value to string
				var strValue string
				switch v := value.(type) {
				case string:
					strValue = v
				default:
					jsonBytes, err := json.Marshal(v)
					if err != nil {
						strValue = fmt.Sprintf("%v", v)
					} else {
						strValue = string(jsonBytes)
					}
				}

				substitutions = append(substitutions, mailersend.Substitution{
					Var:   key,
					Value: strValue,
				})
			}

			variables = append(variables, mailersend.Variables{
				Email:         email,
				Substitutions: substitutions,
			})
		}

		message.SetSubstitutions(variables)
	}

	// Send email
	log.Printf("Sending email via MailerSend API...")
	res, err := ms.Email.Send(ctx, message)
	if err != nil {
		log.Printf("MailerSend API error: %v", err)

		// Check if it's a specific MailerSend error that might indicate account restrictions
		errorStr := err.Error()
		if contains(errorStr, "unauthorized") || contains(errorStr, "domain") || contains(errorStr, "verification") {
			log.Printf("Possible domain/account restriction detected. Error: %s", errorStr)

			// For debugging: try to identify why the email is being rejected
			for _, recipient := range recipients {
				log.Printf("Recipient details - Email: %s, Domain: %s", recipient, extractDomain(recipient))
			}
		}

		return fmt.Errorf("failed to send email via MailerSend: %w", err)
	}

	messageID := res.Header.Get("X-Message-Id")
	log.Printf("Email sent successfully via MailerSend! Message ID: %s", messageID)
	log.Printf("Recipients: %v", recipients)
	log.Printf("=== EMAIL DEBUG END ===")
	return nil
}

// Helper function to extract domain from email
func extractDomain(email string) string {
	parts := strings.Split(email, "@")
	if len(parts) == 2 {
		return parts[1]
	}
	return ""
}

// Helper function to check if string contains substring (case insensitive)
func contains(s, substr string) bool {
	return strings.Contains(strings.ToLower(s), strings.ToLower(substr))
}

// SendSMTPEmail sends an email using SMTP (more reliable than MailerSend API for test accounts)
func SendSMTPEmail(recipients []string, subject, htmlContent string) error {
	config := GetSMTPConfig()

	// Enhanced logging for debugging
	log.Printf("=== SMTP EMAIL DEBUG START ===")
	log.Printf("Attempting to send email via SMTP to: %v", recipients)
	log.Printf("SMTP Host: %s:%s", config.Host, config.Port)
	log.Printf("SMTP Username: %s", config.Username)
	log.Printf("From email: %s", config.FromEmail)
	log.Printf("From name: %s", config.FromName)
	log.Printf("Subject: %s", subject)
	log.Printf("Password length: %d characters", len(config.Password))

	// Validate SMTP password
	if config.Password == "" {
		log.Printf("ERROR: MAILERSEND_SMTP_PASSWORD environment variable not set and fallback password is empty")
		return fmt.Errorf("SMTP password not configured. Please set MAILERSEND_SMTP_PASSWORD environment variable")
	}

	// Check if we have valid recipients
	if len(recipients) == 0 {
		log.Printf("ERROR: No recipients provided")
		return fmt.Errorf("no recipients provided")
	}

	// Prepare email message
	for _, recipient := range recipients {
		if recipient == "" {
			log.Printf("Skipping empty recipient")
			continue
		}

		log.Printf("Processing recipient: %s", recipient)

		// Create email message
		message := fmt.Sprintf("From: %s <%s>\r\n", config.FromName, config.FromEmail)
		message += fmt.Sprintf("To: %s\r\n", recipient)
		message += fmt.Sprintf("Subject: %s\r\n", subject)
		message += "MIME-Version: 1.0\r\n"
		message += "Content-Type: text/html; charset=UTF-8\r\n"
		message += "\r\n"
		message += htmlContent

		log.Printf("Email message length: %d characters", len(message))
		log.Printf("Connecting to SMTP server: %s:%s", config.Host, config.Port)

		// SMTP authentication
		auth := smtp.PlainAuth("", config.Username, config.Password, config.Host)
		log.Printf("SMTP Auth created successfully")

		// Send email
		log.Printf("Attempting to send email to %s...", recipient)
		err := smtp.SendMail(
			config.Host+":"+config.Port,
			auth,
			config.FromEmail,
			[]string{recipient},
			[]byte(message),
		)

		if err != nil {
			log.Printf("❌ SMTP Error sending to %s: %v", recipient, err)
			log.Printf("   Host: %s:%s", config.Host, config.Port)
			log.Printf("   Username: %s", config.Username)
			log.Printf("   From: %s", config.FromEmail)
			return fmt.Errorf("failed to send email via SMTP to %s: %w", recipient, err)
		}

		log.Printf("✅ Email sent successfully via SMTP to: %s", recipient)
	}

	log.Printf("=== SMTP EMAIL DEBUG END ===")
	return nil
}

// TestSMTPConnection - Test function to verify SMTP configuration
func TestSMTPConnection() error {
	log.Printf("=== TESTING SMTP CONNECTION ===")

	testRecipient := "test@example.com"
	testSubject := "Test Email from e-pulse"
	testHTML := `
	<html>
	<body>
		<h2>Test Email</h2>
		<p>This is a test email to verify SMTP configuration.</p>
		<p>If you receive this, SMTP is working correctly!</p>
	</body>
	</html>
	`

	return SendSMTPEmail([]string{testRecipient}, testSubject, testHTML)
}

// SendAppointmentConfirmationEmail sends an appointment confirmation email using SMTP
func SendAppointmentConfirmationEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu Onayı - e-pulse"

	htmlContent := `
	<html>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
		<div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
			<h1 style="margin: 0;">Randevu Onayı</h1>
		</div>
		<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
			<p>Sayın ` + patientName + `,</p>
			<p>Randevunuz başarıyla oluşturulmuştur. İşte detaylar:</p>
			
			<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
				<p style="margin: 5px 0;"><strong>Doktor:</strong> Dr. ` + doctorName + `</p>
				<p style="margin: 5px 0;"><strong>Hastane:</strong> ` + hospitalName + `</p>
				<p style="margin: 5px 0;"><strong>Tarih:</strong> ` + date + `</p>
				<p style="margin: 5px 0;"><strong>Saat:</strong> ` + time + `</p>
			</div>
			
			<p>Randevunuzdan 24 saat öncesine kadar iptal edebilirsiniz.</p>
			<p>Sorularınız için lütfen <a href="mailto:info@e-pulse.com">info@e-pulse.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>e-pulse Randevu Sistemi</p>
		</div>
		<div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
			<p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
		</div>
	</body>
	</html>
	`

	// Use SMTP instead of MailerSend API
	return SendSMTPEmail([]string{email}, subject, htmlContent)
}

// SendAppointmentCancellationEmail sends an appointment cancellation email using SMTP
func SendAppointmentCancellationEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu İptali - e-pulse"

	htmlContent := `
	<html>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
		<div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
			<h1 style="margin: 0;">Randevu İptali</h1>
		</div>
		<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
			<p>Sayın ` + patientName + `,</p>
			<p>Aşağıdaki randevunuz iptal edilmiştir:</p>
			
			<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
				<p style="margin: 5px 0;"><strong>Doktor:</strong> Dr. ` + doctorName + `</p>
				<p style="margin: 5px 0;"><strong>Hastane:</strong> ` + hospitalName + `</p>
				<p style="margin: 5px 0;"><strong>Tarih:</strong> ` + date + `</p>
				<p style="margin: 5px 0;"><strong>Saat:</strong> ` + time + `</p>
			</div>
			
			<p>Yeni bir randevu oluşturmak için lütfen uygulamamızı veya web sitemizi ziyaret edin.</p>
			<p>Sorularınız için lütfen <a href="mailto:info@e-pulse.com">info@e-pulse.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>e-pulse Randevu Sistemi</p>
		</div>
		<div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
			<p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
		</div>
	</body>
	</html>
	`

	// Use SMTP instead of MailerSend API
	return SendSMTPEmail([]string{email}, subject, htmlContent)
}

// SendAppointmentReminderEmail sends an appointment reminder email
func SendAppointmentReminderEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu Hatırlatması - e-pulse"

	variables := map[string]interface{}{
		"patient_name":  patientName,
		"doctor_name":   doctorName,
		"hospital_name": hospitalName,
		"date":          date,
		"time":          time,
	}

	htmlContent := `
	<html>
	<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto;">
		<div style="background-color: #10b981; padding: 20px; text-align: center; color: white;">
			<h1 style="margin: 0;">Randevu Hatırlatması</h1>
		</div>
		<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
			<p>Sayın {{patient_name}},</p>
			<p>Yaklaşan randevunuzu hatırlatmak isteriz:</p>
			
			<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
				<p style="margin: 5px 0;"><strong>Doktor:</strong> Dr. {{doctor_name}}</p>
				<p style="margin: 5px 0;"><strong>Hastane:</strong> {{hospital_name}}</p>
				<p style="margin: 5px 0;"><strong>Tarih:</strong> {{date}}</p>
				<p style="margin: 5px 0;"><strong>Saat:</strong> {{time}}</p>
			</div>
			
			<p>Lütfen randevunuzdan 15 dakika önce hastanede olunuz.</p>
			<p>İptal etmek için lütfen en az 24 saat öncesinden bildiriniz.</p>
			<p>Sorularınız için lütfen <a href="mailto:info@e-pulse.com">info@e-pulse.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>e-pulse Randevu Sistemi</p>
		</div>
		<div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
			<p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
		</div>
	</body>
	</html>
	`

	textContent := fmt.Sprintf(`
	Randevu Hatırlatması
	
	Sayın %s,
	
	Yaklaşan randevunuzu hatırlatmak isteriz:
	
	Doktor: Dr. %s
	Hastane: %s
	Tarih: %s
	Saat: %s
	
	Lütfen randevunuzdan 15 dakika önce hastanede olunuz.
	İptal etmek için lütfen en az 24 saat öncesinden bildiriniz.
	
	Sorularınız için lütfen info@e-pulse.com adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.
	
	e-pulse Randevu Sistemi
	`, patientName, doctorName, hospitalName, date, time)

	return SendMailerSendEmail([]string{email}, subject, htmlContent, textContent, variables)
}

// SendSMS sends an SMS using MailerSend API (if they have SMS capabilities)
// Note: MailerSend might not have direct SMS capabilities, you might need to use a different provider
// This is a placeholder function for now
func SendSMS(phone, message string) error {
	// Log the SMS that would be sent
	log.Printf("Would send SMS to %s: %s", phone, message)
	return nil
}

// SendAppointmentConfirmationSMS sends an SMS about a new appointment
func SendAppointmentConfirmationSMS(phone, patientName, doctorName, date, time string) error {
	message := fmt.Sprintf("Sayın %s, Dr. %s ile %s tarihinde saat %s için randevunuz onaylanmıştır. İyi günler dileriz. - e-pulse",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}

// SendAppointmentCancellationSMS sends an SMS about a cancelled appointment
func SendAppointmentCancellationSMS(phone, patientName, doctorName, date, time string) error {
	message := fmt.Sprintf("Sayın %s, Dr. %s ile %s tarihinde saat %s için olan randevunuz iptal edilmiştir. İyi günler dileriz. - e-pulse",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}

// SendAppointmentReminderSMS sends a reminder SMS about an upcoming appointment
func SendAppointmentReminderSMS(phone, patientName, doctorName, date, time string) error {
	message := fmt.Sprintf("Sayın %s, yarın Dr. %s ile %s tarihinde saat %s için randevunuz bulunmaktadır. Lütfen 15 dakika önce hastanede olunuz. - e-pulse",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}
