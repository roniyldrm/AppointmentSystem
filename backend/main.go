package main

import (
	"backend/api"
	"backend/mongodb"
	"context"
	"encoding/json"
	"log"
	"net/http"
	"strconv"
	"time"

	"github.com/rs/cors"
	"go.mongodb.org/mongo-driver/mongo"
)

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id"`      // Unique ID
	Name      string    `bson:"name" json:"name"`             // Full name
	Email     string    `bson:"email" json:"email"`           // User's email
	Password  string    `bson:"password" json:"-"`            // Hashed password (don't expose in JSON)
	Role      string    `bson:"role" json:"role"`             // Role (e.g., "admin", "user", "business")
	CreatedAt time.Time `bson:"created_at" json:"created_at"` // Account creation time
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"` // Last profile update
}

var client *mongo.Client

func main() {
	client = mongodb.ConnectToDB()
	defer client.Disconnect(context.TODO())
	mux := http.NewServeMux()

	// Register your API handlers
	mux.HandleFunc("/api/districts", handleGetDistrictsByProvince)

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
	provinceIdStr := r.URL.Query().Get("provinceId")
	provinceId, _ := strconv.Atoi(provinceIdStr)
	districts := api.GetDistrictsByProvince(client, provinceId)
	if len(districts) == 0 {
		http.Error(w, "No districts found for this provinceId", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(districts); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
	}
}
