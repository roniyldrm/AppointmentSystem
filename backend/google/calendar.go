package google

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/calendar/v3"
	"google.golang.org/api/option"
)

// GoogleCalendarService provides Google Calendar integration
type GoogleCalendarService struct {
	service *calendar.Service
}

// NewGoogleCalendarService creates a new GoogleCalendarService
func NewGoogleCalendarService() (*GoogleCalendarService, error) {
	ctx := context.Background()

	// Load credentials from environment variable or file
	credentialsJSON := os.Getenv("GOOGLE_CREDENTIALS")
	if credentialsJSON == "" {
		// Try to load from file
		credFile := os.Getenv("GOOGLE_CREDENTIALS_FILE")
		if credFile == "" {
			credFile = "credentials.json"
		}

		b, err := os.ReadFile(credFile)
		if err != nil {
			return nil, fmt.Errorf("unable to read credentials file: %v", err)
		}
		credentialsJSON = string(b)
	}

	// Parse credentials
	config, err := google.ConfigFromJSON([]byte(credentialsJSON), calendar.CalendarEventsScope)
	if err != nil {
		return nil, fmt.Errorf("unable to parse client credentials: %v", err)
	}

	// Create HTTP client
	client := getClient(config)

	// Create Calendar service
	srv, err := calendar.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		return nil, fmt.Errorf("unable to create Calendar service: %v", err)
	}

	return &GoogleCalendarService{
		service: srv,
	}, nil
}

// AddAppointmentToCalendar adds an appointment to the Google Calendar
func (g *GoogleCalendarService) AddAppointmentToCalendar(calendarID, summary, description, location string, startTime, endTime time.Time) (*calendar.Event, error) {
	event := &calendar.Event{
		Summary:     summary,
		Description: description,
		Location:    location,
		Start: &calendar.EventDateTime{
			DateTime: startTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		End: &calendar.EventDateTime{
			DateTime: endTime.Format(time.RFC3339),
			TimeZone: "UTC",
		},
		Reminders: &calendar.EventReminders{
			UseDefault: false,
			Overrides: []*calendar.EventReminder{
				{Method: "email", Minutes: 24 * 60},
				{Method: "popup", Minutes: 30},
			},
		},
	}

	event, err := g.service.Events.Insert(calendarID, event).Do()
	if err != nil {
		return nil, fmt.Errorf("unable to create event: %v", err)
	}

	return event, nil
}

// DeleteAppointmentFromCalendar deletes an appointment from the Google Calendar
func (g *GoogleCalendarService) DeleteAppointmentFromCalendar(calendarID, eventID string) error {
	err := g.service.Events.Delete(calendarID, eventID).Do()
	if err != nil {
		return fmt.Errorf("unable to delete event: %v", err)
	}

	return nil
}

// Retrieves a token from web, then returns the retrieved token.
func getTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Printf("Go to the following link in your browser then type the "+
		"authorization code: \n%v\n", authURL)

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Unable to read authorization code: %v", err)
	}

	tok, err := config.Exchange(context.TODO(), authCode)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web: %v", err)
	}
	return tok
}

// Retrieves a token from a local file.
func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

// Saves a token to a file path.
func saveToken(path string, token *oauth2.Token) {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE|os.O_TRUNC, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	json.NewEncoder(f).Encode(token)
}

// Get client with token
func getClient(config *oauth2.Config) *http.Client {
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	tokFile := "token.json"
	tok, err := tokenFromFile(tokFile)
	if err != nil {
		tok = getTokenFromWeb(config)
		saveToken(tokFile, tok)
	}
	return config.Client(context.Background(), tok)
}
