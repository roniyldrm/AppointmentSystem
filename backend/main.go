package main

import (
	"backend/api"
	"backend/middleware"
	"backend/mongodb"
	wsManager "backend/websocket"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
	"github.com/joho/godotenv"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
)

var client *mongo.Client
var wsClientManager *wsManager.ClientManager
var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func init() {
	// Load .env file if it exists
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables")
	}
}

func main() {
	client = mongodb.ConnectToDB()
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Println("Error disconnecting MongoDB:", err)
		}
	}()

	// Initialize WebSocket Manager
	wsClientManager = wsManager.NewManager()
	go wsClientManager.Start()

	mux := mux.NewRouter()

	// Public routes (no authentication required)
	mux.HandleFunc("/api/auth/register", handleRegisterUser).Methods("POST")
	mux.HandleFunc("/api/auth/login", handleLoginUser).Methods("POST")
	mux.HandleFunc("/api/auth/refresh", handleRefreshToken).Methods("POST")
	mux.HandleFunc("/api/admin/create", handleCreateAdminUser).Methods("POST")

	// Protected routes
	protected := mux.PathPrefix("/api").Subrouter()
	protected.Use(middleware.JWTMiddleware)

	// User routes (any authenticated user)
	protected.HandleFunc("/user/{userCode}", handleGetUser).Methods("GET")
	protected.HandleFunc("/user/{userCode}/profile", handleGetUserProfile).Methods("GET")
	protected.HandleFunc("/user/{userCode}/profile", handleUpdateUserProfile).Methods("POST", "PUT")
	protected.HandleFunc("/user/{userCode}/password", handleChangePassword).Methods("POST")
	protected.HandleFunc("/location/provinces", handleGetAllProvinces).Methods("GET")
	protected.HandleFunc("/location/districts/{provinceCode}", handleGetDistrictsByProvince).Methods("GET")
	protected.HandleFunc("/hospitals", handleGetAllHospitals).Methods("GET")
	protected.HandleFunc("/hospital/{hospitalCode}", handleGetHospital).Methods("GET")
	protected.HandleFunc("/hospitals/{provinceCode}", handleGetHospitalsByProvince).Methods("GET")
	protected.HandleFunc("/hospitals/district/{districtCode}", handleGetHospitalsByDistrict).Methods("GET")
	protected.HandleFunc("/fields/{provinceCode}", handleGetFieldsByProvince).Methods("GET")
	protected.HandleFunc("/fields/{districtCode}", handleGetFieldsByDistrict).Methods("GET")
	protected.HandleFunc("/doctors", handleGetAllDoctors).Methods("GET")
	protected.HandleFunc("/doctor/{doctorCode}", handleGetDoctor).Methods("GET")
	protected.HandleFunc("/doctors/{hospitalCode}", handleGetDoctorsByHospitalCode).Methods("GET")
	protected.HandleFunc("/doctor/{doctorCode}/timeslots", handleGetDoctorTimeSlots).Methods("GET")
	protected.HandleFunc("/appointment", handleCreateAppointment).Methods("POST")
	protected.HandleFunc("/appointment/{appointmentCode}", handleGetAppointment).Methods("GET")
	protected.HandleFunc("/user/{userCode}/appointments", handleGetAppointmentsByUserCode).Methods("GET")
	protected.HandleFunc("/user/{userCode}/appointments/future", handleGetFutureAppointmentsByUserCode).Methods("GET")
	protected.HandleFunc("/user/{userCode}/appointments/past", handleGetPastAppointmentsByUserCode).Methods("GET")
	protected.HandleFunc("/appointment/{appointmentCode}", handleDeleteAppointment).Methods("DELETE")

	// Doctor routes
	doctorRoutes := mux.PathPrefix("/api").Subrouter()
	doctorRoutes.Use(middleware.JWTMiddleware)
	doctorRoutes.Use(middleware.RoleMiddleware("doctor", "admin"))
	doctorRoutes.HandleFunc("/appointments/{doctorCode}", handleGetAppointmentsByDoctorCode).Methods("GET")
	doctorRoutes.HandleFunc("/appointment/cancelRequest", handleCreateAppointmentCancelRequest).Methods("POST")
	doctorRoutes.HandleFunc("/appointment/cancelRequests/{doctorCode}", handleGetAppointmentCancelRequestsByDoctorCode).Methods("GET")

	// Admin routes
	adminRoutes := mux.PathPrefix("/api").Subrouter()
	adminRoutes.Use(middleware.JWTMiddleware)
	adminRoutes.Use(middleware.RoleMiddleware("admin"))
	adminRoutes.HandleFunc("/admin/stats", handleGetDashboardStats).Methods("GET")
	adminRoutes.HandleFunc("/users", handleGetAllUsers).Methods("GET")
	adminRoutes.HandleFunc("/user/{userCode}", handleDeleteUser).Methods("DELETE")
	adminRoutes.HandleFunc("/hospital", handleCreateHospital).Methods("POST")
	adminRoutes.HandleFunc("/hospital", handleUpdateHospital).Methods("PUT")
	adminRoutes.HandleFunc("/hospital/{hospitalCode}", handleDeleteHospital).Methods("DELETE")
	adminRoutes.HandleFunc("/doctor", handleCreateDoctor).Methods("POST")
	adminRoutes.HandleFunc("/doctor", handleUpdateDoctor).Methods("PUT")
	adminRoutes.HandleFunc("/doctor/{doctorCode}", handleDeleteDoctor).Methods("DELETE")
	adminRoutes.HandleFunc("/appointments/enhanced", handleGetAllAppointmentsEnhanced).Methods("GET")
	adminRoutes.HandleFunc("/appointments/test", func(w http.ResponseWriter, r *http.Request) {
		log.Println("=== TEST ROUTE CALLED ===")
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]string{"message": "test route works"})
	}).Methods("GET")
	adminRoutes.HandleFunc("/appointments", handleGetAllAppointments).Methods("GET")
	adminRoutes.HandleFunc("/appointment", handleUpdateAppointment).Methods("PUT")
	adminRoutes.HandleFunc("/appointment/cancelRequests", handleGetAllAppointmentCancelRequests).Methods("GET")
	adminRoutes.HandleFunc("/appointment/cancelRequests/{requestCode}", handleUpdateCancelRequestStatus).Methods("PATCH")
	adminRoutes.HandleFunc("/appointment/cancelRequest", handleDeleteAppointmentCancelRequest).Methods("DELETE")

	// WebSocket
	mux.HandleFunc("/ws/user/{userCode}", handleUserWebSocket)
	mux.HandleFunc("/ws/doctor/{doctorCode}", handleDoctorWebSocket)
	mux.HandleFunc("/ws/admin", handleAdminWebSocket)

	// Configure CORS
	corsOrigins := os.Getenv("CORS_ORIGINS")
	if corsOrigins == "" {
		corsOrigins = "*"
	}

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{corsOrigins},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "PATCH"},
		AllowedHeaders:   []string{"Content-Type", "Authorization"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	startServer(handler)
}

func startServer(handler http.Handler) {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server started at http://localhost:%s", port)
	if err := http.ListenAndServe(":"+port, handler); err != nil {
		log.Fatal(err)
	}
}

func handleLoginUser(w http.ResponseWriter, r *http.Request) {
	var input api.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	tokenResponse, err := api.LoginUser(client, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}

	// Try to get user profile data to include in response
	if profile, err := api.GetUserAdditionalInfo(client, tokenResponse.UserCode); err == nil && profile != nil {
		// Create an enhanced response that includes both token data and profile data
		type EnhancedResponse struct {
			api.TokenResponse
			User struct {
				FirstName string `json:"firstName,omitempty"`
				LastName  string `json:"lastName,omitempty"`
				Email     string `json:"email,omitempty"`
				Phone     string `json:"phone,omitempty"`
			} `json:"user"`
		}

		enhancedResp := EnhancedResponse{
			TokenResponse: tokenResponse,
		}

		enhancedResp.User.FirstName = profile.FirstName
		enhancedResp.User.LastName = profile.LastName
		enhancedResp.User.Email = profile.Email
		enhancedResp.User.Phone = profile.Phone

		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(enhancedResp)
		return
	}

	// Fallback to the standard response if no profile is found
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokenResponse)
}

func handleRegisterUser(w http.ResponseWriter, r *http.Request) {
	var user api.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	tokenResponse, err := api.RegisterUser(client, user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Create initial profile record with empty values
	initialProfile := api.UserAdditionalInfo{
		UserCode:  tokenResponse.UserCode,
		CreatedAt: time.Now(),
		UpdatedAt: time.Now(),
	}

	// Ignore errors since this is just an initialization
	api.CreateUserAdditionalInfo(client, initialProfile)

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(tokenResponse)
}

func handleRefreshToken(w http.ResponseWriter, r *http.Request) {
	var request struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	tokenResponse, err := api.RefreshToken(request.RefreshToken)
	if err != nil {
		http.Error(w, "Invalid or expired refresh token", http.StatusUnauthorized)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(tokenResponse)
}

func handleDeleteUser(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	api.DeleteUser(client, userCode)
}

func handleGetAllProvinces(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	provinces := api.GetAllProvinces(client)
	if err := json.NewEncoder(w).Encode(provinces); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetAllUsers(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	users := api.GetAllUsers(client)
	if err := json.NewEncoder(w).Encode(users); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetUser(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	user, err := api.GetUser(client, userCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(user); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetUserProfile(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	profile, err := api.GetUserAdditionalInfo(client, userCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(profile); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleUpdateUserProfile(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	var profile api.UserAdditionalInfo
	if err := json.NewDecoder(r.Body).Decode(&profile); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Ensure the userCode in the URL matches the one in the request body
	profile.UserCode = userCode

	err := api.UpdateUserAdditionalInfo(client, profile)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetDistrictsByProvince(w http.ResponseWriter, r *http.Request) {
	provinceCode, _ := strconv.Atoi(mux.Vars(r)["provinceCode"])

	districts := api.GetDistrictsByProvince(client, provinceCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(districts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetHospitalsByProvince(w http.ResponseWriter, r *http.Request) {
	provinceCode, _ := strconv.Atoi(mux.Vars(r)["provinceCode"])

	hospitals := api.GetHospitalsByProvince(client, provinceCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(hospitals); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetHospitalsByDistrict(w http.ResponseWriter, r *http.Request) {
	districtCode, _ := strconv.Atoi(mux.Vars(r)["districtCode"])
	hospitals := api.GetHospitalsByDistrict(client, districtCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(hospitals); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleDeleteHospital(w http.ResponseWriter, r *http.Request) {
	hospitalCode, _ := strconv.Atoi(mux.Vars(r)["hospitalCode"])

	api.DeleteHospital(client, hospitalCode)
}

func handleCreateHospital(w http.ResponseWriter, r *http.Request) {
	var hospital api.Hospital
	json.NewDecoder(r.Body).Decode(&hospital)
	api.CreateHospital(client, hospital)
}

func handleUpdateHospital(w http.ResponseWriter, r *http.Request) {
	var hospital api.Hospital
	json.NewDecoder(r.Body).Decode(&hospital)
	api.UpdateHospital(client, hospital)
}

func handleGetAllHospitals(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	hospitals := api.GetAllHospitals(client)
	if err := json.NewEncoder(w).Encode(hospitals); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetHospital(w http.ResponseWriter, r *http.Request) {
	hospitalCode, _ := strconv.Atoi(mux.Vars(r)["hospitalCode"])

	hospital, err := api.GetHospital(client, hospitalCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(hospital); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetFieldsByProvince(w http.ResponseWriter, r *http.Request) {
	provinceCode, _ := strconv.Atoi(mux.Vars(r)["provinceCode"])

	fields := api.GetFieldsByProvince(client, provinceCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fields); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetFieldsByDistrict(w http.ResponseWriter, r *http.Request) {
	districtCode, _ := strconv.Atoi(mux.Vars(r)["districtCode"])

	fields := api.GetFieldsByProvince(client, districtCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(fields); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleCreateDoctor(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var doctor api.Doctor
	if err := json.NewDecoder(r.Body).Decode(&doctor); err != nil {
		http.Error(w, "Error parsing doctor data: "+err.Error(), http.StatusBadRequest)
		return
	}

	api.CreateDoctor(client, doctor)

	// Return the created doctor
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(doctor)
}

func handleGetAllDoctors(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	doctors := api.GetAllDoctors(client)
	if err := json.NewEncoder(w).Encode(doctors); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetDoctor(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	doctor, err := api.GetDoctor(client, doctorCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(doctor); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetDoctorsByHospitalCode(w http.ResponseWriter, r *http.Request) {
	hospitalCode, _ := strconv.Atoi(mux.Vars(r)["hospitalCode"])

	doctors, _ := api.GetDoctorsByHospitalCode(client, hospitalCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(doctors); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleDeleteDoctor(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	doctorCode := mux.Vars(r)["doctorCode"]

	api.DeleteDoctor(client, doctorCode)

	// Return success message
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Doctor deleted successfully",
	})
}

func handleUpdateDoctor(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var doctor api.Doctor
	if err := json.NewDecoder(r.Body).Decode(&doctor); err != nil {
		http.Error(w, "Error parsing doctor data: "+err.Error(), http.StatusBadRequest)
		return
	}

	api.UpdateDoctor(client, doctor)

	// Return the updated doctor
	json.NewEncoder(w).Encode(doctor)
}

func handleCreateAppointment(w http.ResponseWriter, r *http.Request) {
	// Enable CORS header for the appointment endpoint
	w.Header().Set("Access-Control-Allow-Origin", "*")
	w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")
	w.Header().Set("Content-Type", "application/json")

	// Debug request body
	requestBody, err := ioutil.ReadAll(r.Body)
	if err != nil {
		http.Error(w, "Error reading request body: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Log the raw request for debugging
	log.Println("Appointment creation request body:", string(requestBody))

	// Create a new reader from the request body
	r.Body = ioutil.NopCloser(bytes.NewBuffer(requestBody))

	var appointment api.Appointment
	if err := json.NewDecoder(r.Body).Decode(&appointment); err != nil {
		http.Error(w, "Error parsing appointment data: "+err.Error(), http.StatusBadRequest)
		return
	}

	// Validate required fields
	if appointment.DoctorCode == "" {
		http.Error(w, "Missing doctor code", http.StatusBadRequest)
		return
	}

	if appointment.UserCode == "" {
		http.Error(w, "Missing user code", http.StatusBadRequest)
		return
	}

	if appointment.AppointmentTime.Date == "" || appointment.AppointmentTime.Time == "" {
		http.Error(w, "Missing appointment date or time", http.StatusBadRequest)
		return
	}

	// Debug appointment object after parsing
	log.Printf("Creating appointment: Doctor=%s, User=%s, Date=%s, Time=%s",
		appointment.DoctorCode,
		appointment.UserCode,
		appointment.AppointmentTime.Date,
		appointment.AppointmentTime.Time)

	err = api.CreateAppointment(client, appointment)
	if err != nil {
		log.Println("Error creating appointment:", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Get doctor information for the notification
	doctor, err := api.GetDoctor(client, appointment.DoctorCode)
	if err != nil {
		log.Println("Error getting doctor:", err)
		// Continue despite error
	}

	// Send real-time notification to doctor and patient
	notificationContent := map[string]interface{}{
		"type":            "appointmentCreated",
		"message":         "Yeni randevunuz oluşturuldu",
		"appointmentCode": appointment.AppointmentCode,
		"date":            appointment.AppointmentTime.Date,
		"time":            appointment.AppointmentTime.Time,
		"title":           "Yeni Randevu",
		"timestamp":       time.Now().Format(time.RFC3339),
	}

	// Add doctor name if available
	if doctor != nil {
		notificationContent["doctorName"] = doctor.DoctorName
	}

	// Notify user
	jsonNotification, _ := json.Marshal(notificationContent)
	wsClientManager.SendToUser(appointment.UserCode, jsonNotification)

	// Notify doctor
	notificationContent["message"] = "Yeni randevu oluşturuldu"
	jsonNotification, _ = json.Marshal(notificationContent)
	wsClientManager.SendToDoctor(appointment.DoctorCode, jsonNotification)

	// Notify admin
	notificationContent["message"] = "Yeni randevu oluşturuldu"
	jsonNotification, _ = json.Marshal(notificationContent)
	wsClientManager.SendToAdmin(jsonNotification)

	// Return the created appointment details
	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"appointmentCode": appointment.AppointmentCode,
		"message":         "Appointment created successfully",
	})
}

func handleDeleteAppointment(w http.ResponseWriter, r *http.Request) {
	appointmentCode := mux.Vars(r)["appointmentCode"]

	// Get appointment details before deletion
	appointment, err := api.GetAppointment(client, appointmentCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Get doctor information for the notification
	doctor, err := api.GetDoctor(client, appointment.DoctorCode)
	if err != nil {
		log.Println("Error getting doctor:", err)
		// Continue despite error
	}

	// Delete the appointment
	err = api.DeleteAppointment(client, appointmentCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	// Send real-time notification to doctor and patient
	notificationContent := map[string]interface{}{
		"type":            "appointmentCancelled",
		"message":         "Randevunuz iptal edildi",
		"appointmentCode": appointmentCode,
		"date":            appointment.AppointmentTime.Date,
		"time":            appointment.AppointmentTime.Time,
		"title":           "Randevu İptali",
		"timestamp":       time.Now().Format(time.RFC3339),
	}

	// Add doctor name if available
	if doctor != nil {
		notificationContent["doctorName"] = doctor.DoctorName
	}

	// Notify user
	jsonNotification, _ := json.Marshal(notificationContent)
	wsClientManager.SendToUser(appointment.UserCode, jsonNotification)

	// Notify doctor
	notificationContent["message"] = "Hasta randevuyu iptal etti"
	jsonNotification, _ = json.Marshal(notificationContent)
	wsClientManager.SendToDoctor(appointment.DoctorCode, jsonNotification)

	// Notify admin
	notificationContent["message"] = "Randevu iptal edildi"
	jsonNotification, _ = json.Marshal(notificationContent)
	wsClientManager.SendToAdmin(jsonNotification)

	w.WriteHeader(http.StatusOK)
}

func handleUpdateAppointment(w http.ResponseWriter, r *http.Request) {
	var appointment api.Appointment
	json.NewDecoder(r.Body).Decode(&appointment)
	api.UpdateAppointment(client, appointment)
}

func handleGetAllAppointments(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	appointments := api.GetAllAppointments(client)
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetAllAppointmentsEnhanced(w http.ResponseWriter, r *http.Request) {
	log.Println("=== ENHANCED HANDLER CALLED ===")
	w.Header().Set("Content-Type", "application/json")

	log.Println("handleGetAllAppointmentsEnhanced called")

	// Get limit parameter from query string
	limitStr := r.URL.Query().Get("limit")
	limit := 0
	if limitStr != "" {
		if parsedLimit, err := strconv.Atoi(limitStr); err == nil {
			limit = parsedLimit
		}
	}

	log.Printf("Limit parameter: %s, parsed limit: %d", limitStr, limit)

	// Test response first
	testResponse := []map[string]interface{}{
		{
			"appointmentId":    "test123",
			"patientFirstName": "Test Patient",
			"doctorFirstName":  "Test Doctor",
			"date":             "2025-06-01",
			"startTime":        "10:00",
		},
	}

	log.Printf("Sending test response with %d items", len(testResponse))

	if err := json.NewEncoder(w).Encode(testResponse); err != nil {
		log.Printf("Error encoding test response: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
	} else {
		log.Println("Successfully encoded and sent test response")
	}
}

func handleGetAppointment(w http.ResponseWriter, r *http.Request) {
	appointmentCode := mux.Vars(r)["appointmentCode"]

	appointment, err := api.GetAppointment(client, appointmentCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointment); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetAppointmentsByDoctorCode(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	appointments := api.GetAppointmentsByDoctorCode(client, doctorCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetAppointmentsByUserCode(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	appointments := api.GetAppointmentsByUserCode(client, userCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleCreateAppointmentCancelRequest(w http.ResponseWriter, r *http.Request) {
	var request api.AppointmentDeleteRequest
	json.NewDecoder(r.Body).Decode(&request)
	api.CreateAppointmentCancelRequest(client, request)
}

func handleGetAllAppointmentCancelRequests(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	requests := api.GetAllAppointmentCancelRequests(client)
	if err := json.NewEncoder(w).Encode(requests); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetAppointmentCancelRequestsByDoctorCode(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	appointments := api.GetAppointmentCancelRequestsByDoctorCode(client, userCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleUpdateCancelRequestStatus(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["requestCode"]

	var updateData struct {
		Status string `json:"status"`
	}

	if err := api.UpdateCancelRequestStatus(client, userCode, updateData.Status); err != nil {
		http.Error(w, "Failed to update request status", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleDeleteAppointmentCancelRequest(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	api.DeleteAppointmentCancelRequest(client, doctorCode)
}

func handleUserWebSocket(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]
	token := r.URL.Query().Get("token")

	// Token kontrolü
	if token == "" {
		log.Println("WebSocket bağlantısı için token eksik")
		http.Error(w, "Unauthorized: Token required", http.StatusUnauthorized)
		return
	}

	// Basit bir token doğrulama
	// Gerçek uygulamada middleware.JWTMiddleware kullanın
	// Bu örnek yalnızca websocket bağlantısını test etmek için
	if token == "" || len(token) < 10 {
		log.Println("WebSocket bağlantısı için geçersiz token")
		http.Error(w, "Unauthorized: Invalid token", http.StatusUnauthorized)
		return
	}

	log.Printf("WebSocket bağlantısı: UserCode=%s", userCode)

	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}

	log.Println("WebSocket bağlantısı başarılı: UserCode=", userCode)

	// Create client and register
	client := wsManager.NewClient(conn, wsClientManager, "user", userCode)
	wsClientManager.Register(client)

	// Start read/write pumps
	go client.Read()
	go client.Write()

	// Hoşgeldin mesajı gönder - SendToUser metodunu kullan
	welcomeMessage := map[string]interface{}{
		"type":      "notification",
		"title":     "Bağlantı Başarılı",
		"message":   "WebSocket bağlantısı başarıyla kuruldu.",
		"timestamp": time.Now().Format(time.RFC3339),
	}
	jsonMessage, _ := json.Marshal(welcomeMessage)
	wsClientManager.SendToUser(userCode, jsonMessage)
}

func handleDoctorWebSocket(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}

	// Create client and register
	client := wsManager.NewClient(conn, wsClientManager, "doctor", doctorCode)
	wsClientManager.Register(client)

	// Start read/write pumps
	go client.Read()
	go client.Write()
}

func handleAdminWebSocket(w http.ResponseWriter, r *http.Request) {
	// Upgrade connection to WebSocket
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("Error upgrading to WebSocket:", err)
		return
	}

	// Create client and register
	client := wsManager.NewClient(conn, wsClientManager, "admin", "admin")
	wsClientManager.Register(client)

	// Start read/write pumps
	go client.Read()
	go client.Write()
}

func handleGetFutureAppointmentsByUserCode(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]
	appointments := api.GetFutureAppointmentsByUserCode(client, userCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetPastAppointmentsByUserCode(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]
	appointments := api.GetPastAppointmentsByUserCode(client, userCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetDoctorTimeSlots(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]
	date := r.URL.Query().Get("date")

	// Validate inputs
	if doctorCode == "" || date == "" {
		http.Error(w, "Missing doctorCode or date parameter", http.StatusBadRequest)
		return
	}

	// Get doctor info to get working hours
	doctor, err := api.GetDoctor(client, doctorCode)
	if err != nil {
		http.Error(w, err.Error(), http.StatusNotFound)
		return
	}

	// Get all appointments for this doctor on this date
	appointments := api.GetAppointmentsByDoctorCode(client, doctorCode)

	// Filter appointments for the requested date
	bookedSlots := make(map[string]bool)
	for _, appointment := range appointments {
		if appointment.AppointmentTime.Date == date {
			bookedSlots[appointment.AppointmentTime.Time] = true
		}
	}

	// Generate time slots based on doctor's working hours
	workStart := doctor.WorkHours.Start
	workEnd := doctor.WorkHours.End

	// Default values if not specified - ensure 9:00 AM to 5:00 PM
	if workStart == "" {
		workStart = "09:00"
	}
	if workEnd == "" {
		workEnd = "17:00"
	}

	// Parse start and end times
	startHour, startMin := 9, 0
	endHour, endMin := 17, 0

	fmt.Sscanf(workStart, "%d:%d", &startHour, &startMin)
	fmt.Sscanf(workEnd, "%d:%d", &endHour, &endMin)

	// Ensure working hours are between 9:00-17:00 regardless of what's stored
	if startHour < 9 {
		startHour = 9
		startMin = 0
	}
	if endHour > 17 {
		endHour = 17
		endMin = 0
	}

	// Check if selected date is today
	isToday := false
	today := time.Now().Format("2006-01-02")
	if date == today {
		isToday = true
	}
	currentHour, currentMin := time.Now().Hour(), time.Now().Minute()

	// Generate slots - assuming 15 minute intervals
	var timeSlots []map[string]interface{}
	slotId := 1

	// For the end hour (17:00), we need to include slots up to endMin
	for hour := startHour; hour <= endHour; hour++ {
		for minute := 0; minute < 60; minute += 15 {
			// Skip if we've gone past the end time
			if hour > endHour || (hour == endHour && minute > 0) {
				continue
			}

			// Skip minutes before start time for first hour
			if hour == startHour && minute < startMin {
				continue
			}

			// Skip past time slots if booking for today
			if isToday && (hour < currentHour || (hour == currentHour && minute <= currentMin)) {
				continue
			}

			// Format time as HH:MM
			timeStr := fmt.Sprintf("%02d:%02d", hour, minute)

			// Check if slot is already booked
			_, isBooked := bookedSlots[timeStr]

			// Add slot to response
			timeSlots = append(timeSlots, map[string]interface{}{
				"slotId":     slotId,
				"startTime":  timeStr,
				"endTime":    fmt.Sprintf("%02d:%02d", hour+(minute+15)/60, (minute+15)%60),
				"available":  !isBooked,
				"isBooked":   isBooked,
				"doctorName": doctor.DoctorName,
			})

			slotId++
		}
	}

	// Add doctor info to the response
	response := map[string]interface{}{
		"timeSlots": timeSlots,
		"doctorInfo": map[string]string{
			"doctorName": doctor.DoctorName,
			"workStart":  workStart,
			"workEnd":    workEnd,
		},
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(response); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleChangePassword(w http.ResponseWriter, r *http.Request) {
	userCode := mux.Vars(r)["userCode"]

	var passwordData struct {
		CurrentPassword string `json:"currentPassword"`
		NewPassword     string `json:"newPassword"`
	}

	if err := json.NewDecoder(r.Body).Decode(&passwordData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Get the user to verify current password
	user, err := api.GetUser(client, userCode)
	if err != nil {
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Verify the current password
	if !api.CheckPasswordHash(passwordData.CurrentPassword, user.Password) {
		http.Error(w, "Current password is incorrect", http.StatusUnauthorized)
		return
	}

	// Hash the new password
	newPasswordHash, err := api.HashPassword(passwordData.NewPassword)
	if err != nil {
		http.Error(w, "Error processing new password", http.StatusInternalServerError)
		return
	}

	// Update the password
	err = api.UpdateUserPassword(client, userCode, newPasswordHash)
	if err != nil {
		http.Error(w, "Error updating password", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}

func handleGetDashboardStats(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	stats, err := api.GetDashboardStats(client)
	if err != nil {
		http.Error(w, "Failed to get dashboard stats: "+err.Error(), http.StatusInternalServerError)
		return
	}

	if err := json.NewEncoder(w).Encode(map[string]interface{}{
		"data": stats,
	}); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleCreateAdminUser(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")

	var adminData api.AdminUser
	if err := json.NewDecoder(r.Body).Decode(&adminData); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Validate required fields
	if adminData.Email == "" || adminData.Password == "" {
		http.Error(w, "Email and password are required", http.StatusBadRequest)
		return
	}

	err := api.CreateAdminUser(client, adminData)
	if err != nil {
		http.Error(w, "Failed to create admin user: "+err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Admin user created successfully",
	})
}
