package main

import (
	"backend/api"
	"backend/mongodb"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
)

var client *mongo.Client

func main() {
	client = mongodb.ConnectToDB()
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Println("Error disconnecting MongoDB:", err)
		}
	}()
	mux := mux.NewRouter()

	// Authentication & User
	mux.HandleFunc("/api/auth/login", handleLoginUser).Methods("POST")
	mux.HandleFunc("/api/auth/register", handleRegisterUser).Methods("POST")
	mux.HandleFunc("/api/user/{userCode}", handleDeleteUser).Methods("DELETE")
	mux.HandleFunc("/api/users", handleGetAllUsers).Methods("GET")

	//Location
	mux.HandleFunc("/api/location/provinces", handleGetAllProvinces).Methods("GET")
	mux.HandleFunc("/api/location/districts/{provinceCode}", handleGetDistrictsByProvince).Methods("GET")
	//Hospital
	mux.HandleFunc("/api/hospital", handleCreateHospital).Methods("POST")
	mux.HandleFunc("/api/hospitals", handleGetAllHospitals).Methods("GET")
	mux.HandleFunc("/api/hospitals/{provinceCode}", handleGetHospitalsByProvince).Methods("GET")
	mux.HandleFunc("/api/hospitals/district/{districtCode}", handleGetHospitalsByDistrict).Methods("GET")
	mux.HandleFunc("/api/hospital/{hospitalCode}", handleDeleteHospital).Methods("DELETE")
	mux.HandleFunc("/api/hospital", handleUpdateHospital).Methods("UPDATE")
	//Field
	mux.HandleFunc("/api/fields/{provinceCode}", handleGetFieldsByProvince).Methods("GET")
	mux.HandleFunc("/api/fields/{districtCode}", handleGetFieldsByDistrict).Methods("GET")
	//Doctor
	mux.HandleFunc("/api/doctor", handleCreateDoctor).Methods("POST")
	mux.HandleFunc("/api/doctors/{doctorCode}/appointments", handleAddAppointmentToDoctor).Methods("POST")
	mux.HandleFunc("/api/doctors", handleGetAllDoctors).Methods("GET")
	mux.HandleFunc("/api/doctor/{doctorCode}", handleGetDoctor).Methods("GET")
	mux.HandleFunc("/api/doctors/{hospitalCode}", handleGetDoctorsByHospitalCode).Methods("GET")
	mux.HandleFunc("/api/doctor/{doctorCode}", handleDeleteDoctor).Methods("DELETE")
	mux.HandleFunc("/api/doctor", handleUpdateDoctor).Methods("UPDATE")
	//Appointment
	mux.HandleFunc("/api/appointment/create", handleCreateAppointment).Methods("POST")
	mux.HandleFunc("/api/appointments", handleGetAllAppointments).Methods("GET")
	mux.HandleFunc("/api/appointments/{doctorCode}", handleGetAppointmentsByDoctorCode).Methods("GET")
	mux.HandleFunc("/api/appointment/{appointmentCode}", handleDeleteAppointment).Methods("DELETE")
	mux.HandleFunc("/api/appointment/update", handleUpdateAppointment).Methods("UPDATE")
	//Request
	mux.HandleFunc("/api/appointments/cancelRequest", handleCreateAppointmentCancelRequest).Methods("POST")

	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE"},
		AllowedHeaders:   []string{"Content-Type"},
		AllowCredentials: true,
	})

	handler := c.Handler(mux)

	startServer(handler)
}

func startServer(handler http.Handler) {
	log.Println("Server started at http://localhost:8080")
	if err := http.ListenAndServe(":8080", handler); err != nil {
		log.Fatal(err)
	}
}

func handleLoginUser(w http.ResponseWriter, r *http.Request) {
	var input api.LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	message, err := api.LoginUser(client, input)
	if err != nil {
		http.Error(w, err.Error(), http.StatusUnauthorized)
		return
	}
	json.NewEncoder(w).Encode(api.LoginResponse{Message: message})
}

func handleRegisterUser(w http.ResponseWriter, r *http.Request) {
	var user api.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	jwtToken, err := api.RegisterUser(client, user)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"token": jwtToken,
	})
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
	var doctor api.Doctor
	json.NewDecoder(r.Body).Decode(&doctor)
	api.CreateDoctor(client, doctor)
}

func handleAddAppointmentToDoctor(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]
	var req struct {
		AppointmentCode string `json:"appointmentCode"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}
	err := api.AddAppointmentToDoctor(client, doctorCode, req.AppointmentCode)
	if err != nil {
		http.Error(w, "Failed to add appointment to doctor", http.StatusInternalServerError)
		return
	}
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Appointment added successfully",
	})
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

	doctors := api.GetDoctorsByHospitalCode(client, hospitalCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(doctors); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleDeleteDoctor(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	api.DeleteDoctor(client, doctorCode)
}

func handleUpdateDoctor(w http.ResponseWriter, r *http.Request) {
	var doctor api.Doctor
	json.NewDecoder(r.Body).Decode(&doctor)
	api.UpdateDoctor(client, doctor)
}

func handleCreateAppointment(w http.ResponseWriter, r *http.Request) {
	var appointment api.Appointment
	json.NewDecoder(r.Body).Decode(&appointment)
	api.CreateAppointment(client, appointment)
}

func handleDeleteAppointment(w http.ResponseWriter, r *http.Request) {
	appointmentCode := mux.Vars(r)["appointmentCode"]

	api.DeleteAppointment(client, appointmentCode)
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

func handleGetAppointmentsByDoctorCode(w http.ResponseWriter, r *http.Request) {
	doctorCode, _ := strconv.Atoi(mux.Vars(r)["doctorCode"])

	appointments := api.GetAppointmentsByDoctorCode(client, doctorCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(appointments); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleCreateAppointmentCancelRequest(w http.ResponseWriter, r *http.Request) {
	var doctor api.Doctor
	json.NewDecoder(r.Body).Decode(&doctor)
	api.CreateDoctor(client, doctor)
}
