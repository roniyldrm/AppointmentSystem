package api

import (
	"backend/google"
	"backend/helper"
	"context"
	"errors"
	"log"
	"os"
	"sort"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Appointment struct {
	AppointmentCode string          `bson:"appointmentCode" json:"appointmentCode"`
	AppointmentTime AppointmentTime `bson:"appointmentTime" json:"appointmentTime"`
	DoctorCode      string          `bson:"doctorCode" json:"doctorCode"`
	UserCode        string          `bson:"userCode" json:"userCode"`
	CalendarEventID string          `bson:"calendarEventID,omitempty" json:"calendarEventID,omitempty"`
	CreatedAt       time.Time       `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time       `bson:"updatedAt" json:"updatedAt"`
}

type AppointmentTime struct {
	Date string `bson:"date" json:"date"`
	Time string `bson:"time" json:"time"`
}

type AppointmentDetails struct {
	AppointmentCode string          `json:"appointmentCode"`
	AppointmentTime AppointmentTime `json:"appointmentTime"`
	Doctor          Doctor          `json:"doctor"`
	User            User            `json:"user"`
	Hospital        Hospital        `json:"hospital"`
}

// Enhanced appointment structure for admin dashboard
type EnhancedAppointment struct {
	AppointmentId    string    `json:"appointmentId"`
	AppointmentCode  string    `json:"appointmentCode"`
	Date             string    `json:"date"`
	StartTime        string    `json:"startTime"`
	EndTime          string    `json:"endTime"`
	PatientFirstName string    `json:"patientFirstName"`
	PatientLastName  string    `json:"patientLastName"`
	PatientEmail     string    `json:"patientEmail"`
	DoctorFirstName  string    `json:"doctorFirstName"`
	DoctorLastName   string    `json:"doctorLastName"`
	DoctorName       string    `json:"doctorName"`
	HospitalName     string    `json:"hospitalName"`
	FieldName        string    `json:"fieldName"`
	Status           string    `json:"status"`
	CancelRequested  bool      `json:"cancelRequested"`
	CreatedAt        time.Time `json:"createdAt"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

var calendarService *google.GoogleCalendarService
var useGoogleCalendar = false

func init() {
	// Initialize Google Calendar service if enabled
	if os.Getenv("USE_GOOGLE_CALENDAR") == "true" {
		var err error
		calendarService, err = google.NewGoogleCalendarService()
		if err != nil {
			log.Println("Failed to initialize Google Calendar service:", err)
		} else {
			useGoogleCalendar = true
			log.Println("Google Calendar service initialized successfully")
		}
	}
}

func CreateAppointment(client *mongo.Client, appointment Appointment) error {
	collection := client.Database("healthcare").Collection("appointments")
	appointment.AppointmentCode = helper.GenerateID(8)
	appointment.CreatedAt = time.Now()
	appointment.UpdatedAt = time.Now()

	// Get user and doctor details for email and calendar
	user, err := GetUser(client, appointment.UserCode)
	if err != nil {
		log.Println("Error getting user:", err)
		return err
	}

	doctor, err := GetDoctor(client, appointment.DoctorCode)
	if err != nil {
		log.Println("Error getting doctor:", err)
		return err
	}

	hospital, err := GetHospital(client, doctor.HospitalCode)
	if err != nil {
		log.Println("Error getting hospital:", err)
		return err
	}

	// Add to Google Calendar if enabled
	if useGoogleCalendar {
		// Parse date and time
		dateTime := appointment.AppointmentTime.Date + "T" + appointment.AppointmentTime.Time + ":00"
		startTime, err := time.Parse("2006-01-02T15:04:05", dateTime)
		if err != nil {
			log.Println("Error parsing appointment time:", err)
		} else {
			// Calculate end time (adding 15 minutes to start time)
			endTime := startTime.Add(15 * time.Minute)

			// Create calendar event
			calendarID := os.Getenv("GOOGLE_CALENDAR_ID")
			if calendarID == "" {
				calendarID = "primary"
			}

			summary := "Medical Appointment with Dr. " + doctor.DoctorName
			description := "Patient: " + user.UserCode + "\nDoctor: " + doctor.DoctorName
			location := hospital.HospitalName

			event, err := calendarService.AddAppointmentToCalendar(calendarID, summary, description, location, startTime, endTime)
			if err != nil {
				log.Println("Error adding to Google Calendar:", err)
			} else {
				// Store event ID in appointment
				appointment.CalendarEventID = event.Id
				log.Println("Added appointment to Google Calendar, EventID:", event.Id)
			}
		}
	}

	// Save appointment to database
	_, err = collection.InsertOne(context.TODO(), appointment)
	if err != nil {
		return err
	}

	// Format date for display
	displayDate := appointment.AppointmentTime.Date
	if t, err := time.Parse("2006-01-02", appointment.AppointmentTime.Date); err == nil {
		displayDate = t.Format("02/01/2006") // DD/MM/YYYY format
	}

	// Send email notification using our MailerSend service
	err = helper.SendAppointmentConfirmationEmail(
		user.Email,
		user.UserCode, // Using UserCode since we don't have a separate name field
		doctor.DoctorName,
		hospital.HospitalName,
		displayDate,
		appointment.AppointmentTime.Time,
	)
	if err != nil {
		log.Println("Error sending email notification:", err)
		// Continue despite email error - don't fail the appointment creation
	} else {
		log.Println("Appointment confirmation email sent successfully to:", user.Email)
	}

	return nil
}

func DeleteAppointment(client *mongo.Client, appointmentCode string) error {
	// Get appointment details before deletion
	appointment, err := GetAppointment(client, appointmentCode)
	if err != nil {
		return err
	}

	// Get user and doctor details for email
	user, err := GetUser(client, appointment.UserCode)
	if err != nil {
		log.Println("Error getting user:", err)
		// Continue despite error
	}

	doctor, err := GetDoctor(client, appointment.DoctorCode)
	if err != nil {
		log.Println("Error getting doctor:", err)
		// Continue despite error
	}

	// Remove from Google Calendar if enabled
	if useGoogleCalendar && appointment.CalendarEventID != "" {
		calendarID := os.Getenv("GOOGLE_CALENDAR_ID")
		if calendarID == "" {
			calendarID = "primary"
		}

		err := calendarService.DeleteAppointmentFromCalendar(calendarID, appointment.CalendarEventID)
		if err != nil {
			log.Println("Error removing from Google Calendar:", err)
		} else {
			log.Println("Removed appointment from Google Calendar, EventID:", appointment.CalendarEventID)
		}
	}

	// Now delete the appointment
	collection := client.Database("healthcare").Collection("appointments")
	_, err = collection.DeleteOne(context.TODO(), bson.M{"appointmentCode": appointmentCode})
	if err != nil {
		return err
	}

	// If we have user and doctor, send cancellation emails
	if user != nil && doctor != nil {
		hospital, err := GetHospital(client, doctor.HospitalCode)
		if err != nil {
			log.Println("Error getting hospital:", err)
			// Continue despite error
		}

		if hospital != nil {
			// Format date for display
			displayDate := appointment.AppointmentTime.Date
			if t, err := time.Parse("2006-01-02", appointment.AppointmentTime.Date); err == nil {
				displayDate = t.Format("02/01/2006") // DD/MM/YYYY format
			}

			// Send cancellation email
			err = helper.SendAppointmentCancellationEmail(
				user.Email,
				user.UserCode,
				doctor.DoctorName,
				hospital.HospitalName,
				displayDate,
				appointment.AppointmentTime.Time,
			)
			if err != nil {
				log.Println("Error sending cancellation email:", err)
			} else {
				log.Println("Cancellation email sent successfully to:", user.Email)
			}
		}
	}

	return nil
}

func UpdateAppointment(client *mongo.Client, appointment Appointment) {
	collection := client.Database("healthcare").Collection("appointments")
	appointment.UpdatedAt = time.Now()

	_, err := collection.ReplaceOne(
		context.TODO(),
		bson.M{"appointmentCode": appointment.AppointmentCode},
		appointment,
	)

	if err != nil {
		log.Println("Error updating appointment:", err)
	}
}

func GetAllAppointments(client *mongo.Client) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var appointments []Appointment
	cursor.All(context.TODO(), &appointments)

	return appointments
}

func GetAllAppointmentsEnhanced(client *mongo.Client, limit int) []EnhancedAppointment {
	log.Printf("GetAllAppointmentsEnhanced called with limit: %d", limit)

	appointments := GetAllAppointments(client)
	log.Printf("Found %d appointments", len(appointments))

	// Sort by creation date (newest first) and limit
	sort.Slice(appointments, func(i, j int) bool {
		return appointments[i].CreatedAt.After(appointments[j].CreatedAt)
	})

	if limit > 0 && len(appointments) > limit {
		appointments = appointments[:limit]
		log.Printf("Limited to %d appointments", limit)
	}

	var enhancedAppointments []EnhancedAppointment

	// Field mapping for specialties
	fieldMapping := map[int]string{
		0: "Genel Tıp",
		1: "Kardiyoloji",
		2: "Nöroloji",
		3: "Ortopedi",
		4: "Pediatri",
		5: "Dermatoloji",
		6: "Göz Hastalıkları",
		7: "Kulak Burun Boğaz",
		8: "Üroloji",
		9: "Jinekologi",
	}

	for i, appointment := range appointments {
		log.Printf("Processing appointment %d: %s", i, appointment.AppointmentCode)

		enhanced := EnhancedAppointment{
			AppointmentId:   appointment.AppointmentCode, // Use appointmentCode as ID
			AppointmentCode: appointment.AppointmentCode,
			Date:            appointment.AppointmentTime.Date,
			StartTime:       appointment.AppointmentTime.Time,
			EndTime:         "",          // Will calculate if needed
			Status:          "SCHEDULED", // Default status
			CancelRequested: false,       // Default value
			CreatedAt:       appointment.CreatedAt,
			UpdatedAt:       appointment.UpdatedAt,
		}

		// Calculate end time (15 minutes after start time)
		if startTime, err := time.Parse("15:04", appointment.AppointmentTime.Time); err == nil {
			endTime := startTime.Add(15 * time.Minute)
			enhanced.EndTime = endTime.Format("15:04")
		}

		// Get user details
		if user, err := GetUser(client, appointment.UserCode); err == nil {
			// Split userCode or use email as name fallback
			enhanced.PatientFirstName = user.UserCode // Using userCode as first name for now
			enhanced.PatientLastName = ""
			enhanced.PatientEmail = user.Email
			log.Printf("Found user: %s", user.UserCode)
		} else {
			log.Printf("Error getting user %s: %v", appointment.UserCode, err)
		}

		// Get doctor details
		if doctor, err := GetDoctor(client, appointment.DoctorCode); err == nil {
			enhanced.DoctorName = doctor.DoctorName
			enhanced.DoctorFirstName = doctor.DoctorName // Using full name as first name
			enhanced.DoctorLastName = ""

			// Get field name
			if fieldName, exists := fieldMapping[doctor.FieldCode]; exists {
				enhanced.FieldName = fieldName
			} else {
				enhanced.FieldName = "Unknown"
			}
			log.Printf("Found doctor: %s, field: %s", doctor.DoctorName, enhanced.FieldName)

			// Get hospital details
			if hospital, err := GetHospital(client, doctor.HospitalCode); err == nil {
				enhanced.HospitalName = hospital.HospitalName
				log.Printf("Found hospital: %s", hospital.HospitalName)
			} else {
				log.Printf("Error getting hospital %d: %v", doctor.HospitalCode, err)
			}
		} else {
			log.Printf("Error getting doctor %s: %v", appointment.DoctorCode, err)
		}

		enhancedAppointments = append(enhancedAppointments, enhanced)
	}

	log.Printf("Returning %d enhanced appointments", len(enhancedAppointments))
	return enhancedAppointments
}

func GetAppointment(client *mongo.Client, appointmentCode string) (*Appointment, error) {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "appointmentCode", Value: appointmentCode}}
	var appointment Appointment
	err := collection.FindOne(context.TODO(), filter).Decode(&appointment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("appointment not found")
		}
		return nil, err
	}
	return &appointment, nil
}

func GetAppointmentDetails(client *mongo.Client, appointmentCode string) (*AppointmentDetails, error) {
	appointment, err := GetAppointment(client, appointmentCode)
	if err != nil {
		return nil, err
	}

	user, err := GetUser(client, appointment.UserCode)
	if err != nil {
		return nil, err
	}

	doctor, err := GetDoctor(client, appointment.DoctorCode)
	if err != nil {
		return nil, err
	}

	hospital, err := GetHospital(client, doctor.HospitalCode)
	if err != nil {
		return nil, err
	}

	details := &AppointmentDetails{
		AppointmentCode: appointment.AppointmentCode,
		AppointmentTime: appointment.AppointmentTime,
		Doctor:          *doctor,
		User:            *user,
		Hospital:        *hospital,
	}

	return details, nil
}

func GetAppointmentsByDoctorCode(client *mongo.Client, doctorCode string) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "doctorCode", Value: doctorCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var appointments []Appointment
	cursor.All(context.TODO(), &appointments)
	return appointments
}

func GetAppointmentsByUserCode(client *mongo.Client, userCode string) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "userCode", Value: userCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var appointments []Appointment
	cursor.All(context.TODO(), &appointments)
	return appointments
}

func GetFutureAppointmentsByUserCode(client *mongo.Client, userCode string) []Appointment {
	allAppointments := GetAppointmentsByUserCode(client, userCode)

	var futureAppointments []Appointment
	currentDate := time.Now().Format("2006-01-02")

	for _, appointment := range allAppointments {
		if appointment.AppointmentTime.Date >= currentDate {
			futureAppointments = append(futureAppointments, appointment)
		}
	}

	return futureAppointments
}

func GetPastAppointmentsByUserCode(client *mongo.Client, userCode string) []Appointment {
	allAppointments := GetAppointmentsByUserCode(client, userCode)

	var pastAppointments []Appointment
	currentDate := time.Now().Format("2006-01-02")

	for _, appointment := range allAppointments {
		if appointment.AppointmentTime.Date < currentDate {
			pastAppointments = append(pastAppointments, appointment)
		}
	}

	return pastAppointments
}
