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
	//defer client.Disconnect(context.TODO())
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Println("Error disconnecting MongoDB:", err)
		}
	}()
	mux := mux.NewRouter()

	// Register your API handlers
	mux.HandleFunc("/api/auth/login", handleLoginUser).Methods("POST")
	mux.HandleFunc("/api/auth/register", handleRegisterUser).Methods("POST")
	mux.HandleFunc("/api/auth/user/{userCode}", handleDeleteUser).Methods("DELETE")
	mux.HandleFunc("/api/provinces", handleGetAllProvinces).Methods("GET")
	mux.HandleFunc("/api/districts/{provinceCode}", handleGetDistrictsByProvince).Methods("GET")
	mux.HandleFunc("/api/hospitals/{provinceCode}", handleGetHospitalsByProvince).Methods("GET")
	mux.HandleFunc("/api/hospitals/district/{districtCode}", handleGetHospitalsByDistrict).Methods("GET")
	mux.HandleFunc("/api/hospital/{hospitalCode}", handleDeleteHospital).Methods("DELETE")
	mux.HandleFunc("/api/hospital", handleCreateHospital).Methods("POST")
	mux.HandleFunc("/api/createDoctor", handleCreateDoctor).Methods("POST")
	mux.HandleFunc("/api/doctors/{hospitalCode}", handleGetDoctorsByHospital).Methods("GET")
	mux.HandleFunc("/api/doctor/{doctorCode}", handleDeleteDoctor).Methods("DELETE")

	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"}, // Change this to your frontend URL for better security
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
	var log map[string]string
	json.NewDecoder(r.Body).Decode(&log)

	api.LoginUser(client, log)
}

func handleRegisterUser(w http.ResponseWriter, r *http.Request) {
	var user api.User
	json.NewDecoder(r.Body).Decode(&user)

	api.RegisterUser(client, user)
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

func handleCreateDoctor(w http.ResponseWriter, r *http.Request) {
	var doctor api.Doctor
	json.NewDecoder(r.Body).Decode(&doctor)
	api.CreateDoctor(client, doctor)
}

func handleGetDoctorsByHospital(w http.ResponseWriter, r *http.Request) {
	hospitalCode, _ := strconv.Atoi(mux.Vars(r)["hospitalCode"])

	doctors := api.GetDoctorsByHospital(client, hospitalCode)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(doctors); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleDeleteDoctor(w http.ResponseWriter, r *http.Request) {
	doctorCode := mux.Vars(r)["doctorCode"]

	api.DeleteDoctor(client, doctorCode)
}

/* func main() {
	client = mongodb.ConnectToDB()
	defer client.Disconnect(context.TODO())
	collection := client.Database("hospitals").Collection("hospitals")
	cursor, _ := collection.Find(context.TODO(), bson.D{})
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var hospital bson.M
		cursor.Decode(&hospital)
		filter := hospital["_id"]
		updatedHospital := hospital
		updatedHospital["_id"] = helper.GenerateID(6)
		collection.UpdateOne(context.TODO(), filter, updatedHospital)
	}

} */

/* func main() {
	client = mongodb.ConnectToDB()
	defer client.Disconnect(context.TODO())

	collection := client.Database("hospitals").Collection("hospitals")
	cursor, _ := collection.Find(context.TODO(), bson.D{})
	defer cursor.Close(context.TODO())

	for cursor.Next(context.TODO()) {
		var hospital bson.M
		cursor.Decode(&hospital)
		oldID := hospital["_id"]
		newID := helper.GenerateID(6)
		hospital["_id"] = newID

		collection.DeleteOne(context.TODO(), bson.M{"_id": oldID})
		collection.InsertOne(context.TODO(), hospital)
	}
} */

/*
collection.UpdateMany(
	context.TODO(),
	bson.D{}, // No filter, affects all documents
	bson.D{
		{"$set", bson.D{{"_id", helper.GenerateID(6)}}}, // Unset the 'id' field
	},
) */

/* func main() {
	client = mongodb.ConnectToDB()
	//defer client.Disconnect(context.TODO())
	defer func() {
		if err := client.Disconnect(context.TODO()); err != nil {
			log.Println("Error disconnecting MongoDB:", err)
		}
	}()
	helper.Tester(client)
} */
