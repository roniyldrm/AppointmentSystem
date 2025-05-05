package helper

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
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
		fromName = "Horasan Hospital"
	}

	fromEmail := os.Getenv("MAILERSEND_FROM_EMAIL")
	if fromEmail == "" {
		// Using the verified domain from user's MailerSend account
		fromEmail = "no-reply@test-r83ql3ppdmvgzw1j.mlsender.net"
	}

	return MailerSendConfig{
		APIKey:    apiKey,
		FromName:  fromName,
		FromEmail: fromEmail,
	}
}

// SendMailerSendEmail sends an email using MailerSend API
func SendMailerSendEmail(recipients []string, subject, htmlContent, textContent string, templateVariables map[string]interface{}) error {
	config := GetMailerSendConfig()
	if config.APIKey == "" {
		return fmt.Errorf("MAILERSEND_API_KEY environment variable is not set")
	}

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
		recipientsList = append(recipientsList, mailersend.Recipient{
			Email: email,
		})
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
	res, err := ms.Email.Send(ctx, message)
	if err != nil {
		return fmt.Errorf("failed to send email: %w", err)
	}

	messageID := res.Header.Get("X-Message-Id")
	log.Printf("Email sent successfully, message ID: %s", messageID)
	return nil
}

// SendAppointmentConfirmationEmail sends an appointment confirmation email
func SendAppointmentConfirmationEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu Onayı - Horasan Hospital"

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
		<div style="background-color: #3b82f6; padding: 20px; text-align: center; color: white;">
			<h1 style="margin: 0;">Randevu Onayı</h1>
		</div>
		<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
			<p>Sayın {{patient_name}},</p>
			<p>Randevunuz başarıyla oluşturulmuştur. İşte detaylar:</p>
			
			<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
				<p style="margin: 5px 0;"><strong>Doktor:</strong> Dr. {{doctor_name}}</p>
				<p style="margin: 5px 0;"><strong>Hastane:</strong> {{hospital_name}}</p>
				<p style="margin: 5px 0;"><strong>Tarih:</strong> {{date}}</p>
				<p style="margin: 5px 0;"><strong>Saat:</strong> {{time}}</p>
			</div>
			
			<p>Randevunuzdan 24 saat öncesine kadar iptal edebilirsiniz.</p>
			<p>Sorularınız için lütfen <a href="mailto:info@horasan.com">info@horasan.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>Horasan Hospital Randevu Sistemi</p>
		</div>
		<div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
			<p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
		</div>
	</body>
	</html>
	`

	textContent := fmt.Sprintf(`
	Randevu Onayı
	
	Sayın %s,
	
	Randevunuz başarıyla oluşturulmuştur. İşte detaylar:
	
	Doktor: Dr. %s
	Hastane: %s
	Tarih: %s
	Saat: %s
	
	Randevunuzdan 24 saat öncesine kadar iptal edebilirsiniz.
	
	Sorularınız için lütfen info@horasan.com adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.
	
	Horasan Hospital Randevu Sistemi
	`, patientName, doctorName, hospitalName, date, time)

	return SendMailerSendEmail([]string{email}, subject, htmlContent, textContent, variables)
}

// SendAppointmentCancellationEmail sends an appointment cancellation email
func SendAppointmentCancellationEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu İptali - Horasan Hospital"

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
		<div style="background-color: #ef4444; padding: 20px; text-align: center; color: white;">
			<h1 style="margin: 0;">Randevu İptali</h1>
		</div>
		<div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
			<p>Sayın {{patient_name}},</p>
			<p>Aşağıdaki randevunuz iptal edilmiştir:</p>
			
			<div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 15px 0;">
				<p style="margin: 5px 0;"><strong>Doktor:</strong> Dr. {{doctor_name}}</p>
				<p style="margin: 5px 0;"><strong>Hastane:</strong> {{hospital_name}}</p>
				<p style="margin: 5px 0;"><strong>Tarih:</strong> {{date}}</p>
				<p style="margin: 5px 0;"><strong>Saat:</strong> {{time}}</p>
			</div>
			
			<p>Yeni bir randevu oluşturmak için lütfen uygulamamızı veya web sitemizi ziyaret edin.</p>
			<p>Sorularınız için lütfen <a href="mailto:info@horasan.com">info@horasan.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>Horasan Hospital Randevu Sistemi</p>
		</div>
		<div style="background-color: #f3f4f6; padding: 10px; text-align: center; font-size: 12px; color: #6b7280;">
			<p>Bu e-posta otomatik olarak gönderilmiştir, lütfen yanıtlamayınız.</p>
		</div>
	</body>
	</html>
	`

	textContent := fmt.Sprintf(`
	Randevu İptali
	
	Sayın %s,
	
	Aşağıdaki randevunuz iptal edilmiştir:
	
	Doktor: Dr. %s
	Hastane: %s
	Tarih: %s
	Saat: %s
	
	Yeni bir randevu oluşturmak için lütfen uygulamamızı veya web sitemizi ziyaret edin.
	
	Sorularınız için lütfen info@horasan.com adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.
	
	Horasan Hospital Randevu Sistemi
	`, patientName, doctorName, hospitalName, date, time)

	return SendMailerSendEmail([]string{email}, subject, htmlContent, textContent, variables)
}

// SendAppointmentReminderEmail sends an appointment reminder email
func SendAppointmentReminderEmail(email, patientName, doctorName, hospitalName, date, time string) error {
	subject := "Randevu Hatırlatması - Horasan Hospital"

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
			<p>Sorularınız için lütfen <a href="mailto:info@horasan.com">info@horasan.com</a> adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.</p>
			
			<p>Horasan Hospital Randevu Sistemi</p>
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
	
	Sorularınız için lütfen info@horasan.com adresine e-posta gönderin veya 0850 123 4567 numaralı telefondan bizi arayın.
	
	Horasan Hospital Randevu Sistemi
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
	message := fmt.Sprintf("Sayın %s, Dr. %s ile %s tarihinde saat %s için randevunuz onaylanmıştır. İyi günler dileriz. - Horasan Hospital",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}

// SendAppointmentCancellationSMS sends an SMS about a cancelled appointment
func SendAppointmentCancellationSMS(phone, patientName, doctorName, date, time string) error {
	message := fmt.Sprintf("Sayın %s, Dr. %s ile %s tarihinde saat %s için olan randevunuz iptal edilmiştir. İyi günler dileriz. - Horasan Hospital",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}

// SendAppointmentReminderSMS sends a reminder SMS about an upcoming appointment
func SendAppointmentReminderSMS(phone, patientName, doctorName, date, time string) error {
	message := fmt.Sprintf("Sayın %s, yarın Dr. %s ile %s tarihinde saat %s için randevunuz bulunmaktadır. Lütfen 15 dakika önce hastanede olunuz. - Horasan Hospital",
		patientName, doctorName, date, time)

	return SendSMS(phone, message)
}
