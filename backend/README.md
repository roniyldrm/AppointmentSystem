# Hospital Appointment System - Backend

This is the backend API server for the Hospital Appointment System, providing RESTful endpoints for appointment management, user authentication, hospital data, and more.

## Features

- **User Authentication**: JWT-based authentication with refresh tokens
- **Role-Based Access Control**: Different permissions for patients, doctors, and admins
- **Appointment Management**: Create, view, update, and cancel appointments
- **Doctor Management**: Add, update, and remove doctors
- **Hospital Management**: Add, update, and view hospitals and their specializations
- **Real-time Updates**: WebSocket support for live notifications
- **Email Notifications**: Send email confirmations for appointments
- **Google Calendar Integration**: Sync appointments with Google Calendar

## Tech Stack

- **Go**: Primary programming language
- **MongoDB**: Database for storing application data
- **JWT**: Authentication and authorization
- **WebSockets**: Real-time communication
- **SMTP**: Email notifications
- **Google Calendar API**: Calendar integration

## Getting Started

### Prerequisites

- Go 1.18 or higher
- MongoDB instance (local or Atlas)
- SMTP server for email notifications (optional)
- Google Calendar API credentials (optional)

### Installation

1. Clone the repository:

```bash
git clone https://github.com/yourusername/appointment-system.git
cd appointment-system/backend
```

2. Install dependencies:

```bash
go mod download
```

3. Create a `.env` file with your configuration:

```bash
cp .env.sample .env
# Edit .env with your settings
```

4. Run the server:

```bash
go run main.go
```

The server will start on http://localhost:8080 by default.

## Environment Variables

- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `JWT_REFRESH_SECRET`: Secret key for refresh tokens
- `EMAIL_FROM`: Email address for sending notifications
- `EMAIL_PASSWORD`: Password for the email account
- `SMTP_HOST`: SMTP server host
- `SMTP_PORT`: SMTP server port
- `USE_GOOGLE_CALENDAR`: Enable Google Calendar integration (true/false)
- `GOOGLE_CALENDAR_ID`: Google Calendar ID (default: primary)
- `GOOGLE_CREDENTIALS_FILE`: Path to Google credentials JSON file
- `PORT`: Server port (default: 8080)
- `CORS_ORIGINS`: Allowed CORS origins (default: *)

## API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `POST /api/auth/login`: Login and get access token
- `POST /api/auth/refresh`: Refresh access token

### User

- `GET /api/user/{userCode}`: Get user details
- `DELETE /api/user/{userCode}`: Delete user (admin only)
- `GET /api/users`: Get all users (admin only)

### Appointments

- `POST /api/appointment`: Create a new appointment
- `GET /api/appointment/{appointmentCode}`: Get appointment details
- `DELETE /api/appointment/{appointmentCode}`: Cancel an appointment
- `GET /api/user/{userCode}/appointments`: Get user's appointments
- `GET /api/user/{userCode}/appointments/future`: Get user's future appointments
- `GET /api/user/{userCode}/appointments/past`: Get user's past appointments
- `GET /api/appointments/{doctorCode}`: Get doctor's appointments (doctor only)
- `POST /api/appointment/cancelRequest`: Request appointment cancellation (doctor only)

### Hospitals and Doctors

- `GET /api/hospitals`: Get all hospitals
- `GET /api/hospital/{hospitalCode}`: Get hospital details
- `GET /api/doctors`: Get all doctors
- `GET /api/doctor/{doctorCode}`: Get doctor details
- `GET /api/doctors/{hospitalCode}`: Get doctors by hospital

### WebSocket Connections

- `WS /ws/user/{userCode}`: User notifications
- `WS /ws/doctor/{doctorCode}`: Doctor notifications
- `WS /ws/admin`: Admin notifications

## WebSocket and Notification System

The backend uses WebSocket for real-time notifications and MailerSend for email notifications.

### WebSocket Implementation

The system uses WebSocket to push real-time notifications to clients (patients, doctors, and admins).

#### How to Use WebSocket Notifications:

When an appointment is created, cancelled, or updated, send a notification through WebSocket:

```go
// In your appointment handler
import (
    "encoding/json"
    "backend/websocket"
)

// After successfully creating an appointment
func afterAppointmentCreation(appointment *Appointment, patient *Patient, doctor *Doctor, hospital *Hospital) {
    // Format the data
    date := appointment.Date.Format("02/01/2006") // DD/MM/YYYY
    
    // 1. Send email notification
    helper.SendAppointmentConfirmationEmail(
        patient.Email,
        patient.Name,
        doctor.Name,
        hospital.Name,
        date,
        appointment.Time,
    )
    
    // 2. Send SMS notification
    helper.SendAppointmentConfirmationSMS(
        patient.Phone,
        patient.Name,
        doctor.Name,
        date,
        appointment.Time,
    )
    
    // 3. Send WebSocket notification
    wsManager := websocket.GetManager()
    
    // Create notification data
    notificationData := map[string]interface{}{
        "appointmentId": appointment.ID,
        "doctorName":    doctor.Name,
        "hospitalName":  hospital.Name,
        "date":          date,
        "time":          appointment.Time,
        "status":        "created",
    }
    
    // Create WebSocket message for patient
    patientNotification, _ := json.Marshal(map[string]interface{}{
        "type":    "appointmentCreated",
        "payload": notificationData,
    })
    
    // Create WebSocket message for doctor
    doctorNotification, _ := json.Marshal(map[string]interface{}{
        "type":    "appointmentCreated",
        "payload": notificationData,
    })
    
    // Send to patient
    wsManager.SendToUser(patient.ID, patientNotification)
    
    // Send to doctor
    wsManager.SendToDoctor(doctor.ID, doctorNotification)
}
```

### Email Notifications with MailerSend

The system uses MailerSend for sending email notifications. To use the email service, add the MailerSend API key to your .env file:

```
MAILERSEND_API_KEY=your-api-key
MAILERSEND_FROM_NAME=e-pulse
MAILERSEND_FROM_EMAIL=info@e-pulse.com
```

Make sure to add the MailerSend Go package to your project:

```bash
go get github.com/mailersend/mailersend-go
```

#### How to Use Email Notifications:

```go
// Send an appointment confirmation email
err := helper.SendAppointmentConfirmationEmail(
    "patient@example.com",
    "Patient Name",
    "Doctor Name",
    "Hospital Name",
    "01/01/2023",
    "14:30",
)

if err != nil {
    log.Printf("Failed to send email: %v", err)
}
```

### SMS Notifications

The system logs SMS messages for now. You can implement an actual SMS provider if needed.

#### How to Use SMS Notifications:

```go
// Send an appointment confirmation SMS
err := helper.SendAppointmentConfirmationSMS(
    "+905551234567",
    "Patient Name",
    "Doctor Name",
    "01/01/2023",
    "14:30",
)

if err != nil {
    log.Printf("Failed to send SMS: %v", err)
}
```

## License

This project is licensed under the MIT License. 