package main

import (
	"backend/api"
	"backend/mongodb"
	"context"
	"encoding/json"
	"fmt"
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
	defer client.Disconnect(context.TODO())
	mux := mux.NewRouter()

	// Register your API handlers
	mux.HandleFunc("/api/districts/{provinceId}", handleGetDistrictsByProvince).Methods("GET")
	mux.HandleFunc("/api/hospitals/{provinceId}", handleGetHospitalsByProvince).Methods("GET")
	mux.HandleFunc("/api/hospitals/district/{districtId}", handleGetHospitalsByDistrict).Methods("GET")

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

func handleGetDistrictsByProvince(w http.ResponseWriter, r *http.Request) {
	provinceId, _ := strconv.Atoi(mux.Vars(r)["provinceId"])

	districts := api.GetDistrictsByProvince(client, provinceId)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(districts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetHospitalsByProvince(w http.ResponseWriter, r *http.Request) {
	provinceId, _ := strconv.Atoi(mux.Vars(r)["provinceId"])

	hospitals := api.GetHospitalsByProvince(client, provinceId)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(hospitals); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

func handleGetHospitalsByDistrict(w http.ResponseWriter, r *http.Request) {
	districtId, _ := strconv.Atoi(mux.Vars(r)["districtId"])
	fmt.Print(districtId)
	hospitals := api.GetHospitalsByDistrict(client, districtId)

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(hospitals); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}

/* func main() {
	client = mongodb.ConnectToDB()
	defer client.Disconnect(context.TODO())
	collection := client.Database("locations").Collection("provinces")
	cursor, _ := collection.Find(context.TODO(), bson.D{})
	defer cursor.Close(context.TODO())
	for cursor.Next(context.TODO()) {
		var province bson.M
		cursor.Decode(&province)
		updatedProvince := province
		updatedProvince["_id"]

		filter := bson.D{{"_id", province["_id"]}}

		update := bson.D{
			{"$set", bson.D{{"_id", helper.GenerateID(4)}}},
		}
		collection.UpdateOne(context.TODO(), filter, update)
	}

		collection.UpdateMany(
		context.TODO(),
		bson.D{}, // No filter, affects all documents
		bson.D{
			{"$unset", bson.D{{"_id", helper.GenerateID(4)}}}, // Unset the 'id' field
		},
	)
} */
