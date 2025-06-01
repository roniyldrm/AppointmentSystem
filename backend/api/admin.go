package api

import (
	"backend/helper"
	"context"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// AdminStats represents dashboard statistics for admin
type AdminStats struct {
	TotalAppointments int `json:"totalAppointments"`
	TodayAppointments int `json:"todayAppointments"`
	TotalDoctors      int `json:"totalDoctors"`
	TotalHospitals    int `json:"totalHospitals"`
	TotalPatients     int `json:"totalPatients"`
	CancelRequests    int `json:"cancelRequests"`
}

// AdminUser represents an admin user
type AdminUser struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	UserCode  string    `bson:"userCode" json:"userCode"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"password"`
	Role      string    `bson:"role" json:"role"`
	FirstName string    `bson:"firstName" json:"firstName"`
	LastName  string    `bson:"lastName" json:"lastName"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}

// GetDashboardStats retrieves statistics for the admin dashboard
func GetDashboardStats(client *mongo.Client) (AdminStats, error) {
	var stats AdminStats

	// Get total appointments
	appointmentsCollection := client.Database("healthcare").Collection("appointments")
	totalAppointments, err := appointmentsCollection.CountDocuments(context.TODO(), bson.D{})
	if err != nil {
		return stats, err
	}
	stats.TotalAppointments = int(totalAppointments)

	// Get today's appointments
	today := time.Now().Format("2006-01-02")
	todayFilter := bson.D{{Key: "appointmentTime.date", Value: today}}
	todayAppointments, err := appointmentsCollection.CountDocuments(context.TODO(), todayFilter)
	if err != nil {
		return stats, err
	}
	stats.TodayAppointments = int(todayAppointments)

	// Get total doctors
	doctorsCollection := client.Database("healthcare").Collection("doctors")
	totalDoctors, err := doctorsCollection.CountDocuments(context.TODO(), bson.D{})
	if err != nil {
		return stats, err
	}
	stats.TotalDoctors = int(totalDoctors)

	// Get total hospitals
	hospitalsCollection := client.Database("healthcare").Collection("hospitals")
	totalHospitals, err := hospitalsCollection.CountDocuments(context.TODO(), bson.D{})
	if err != nil {
		return stats, err
	}
	stats.TotalHospitals = int(totalHospitals)

	// Get total patients (users with role 'patient')
	usersCollection := client.Database("users").Collection("users")
	patientFilter := bson.D{{Key: "role", Value: "patient"}}
	totalPatients, err := usersCollection.CountDocuments(context.TODO(), patientFilter)
	if err != nil {
		return stats, err
	}
	stats.TotalPatients = int(totalPatients)

	// Get cancel requests
	requestsCollection := client.Database("healthcare").Collection("requests")
	pendingFilter := bson.D{{Key: "status", Value: "pending"}}
	cancelRequests, err := requestsCollection.CountDocuments(context.TODO(), pendingFilter)
	if err != nil {
		return stats, err
	}
	stats.CancelRequests = int(cancelRequests)

	return stats, nil
}

// CreateAdminUser creates a new admin user
func CreateAdminUser(client *mongo.Client, adminData AdminUser) error {
	collection := client.Database("users").Collection("users")

	// Hash the password
	hashedPassword, err := HashPassword(adminData.Password)
	if err != nil {
		return err
	}

	// Generate user code
	adminData.UserCode = helper.GenerateID(8)
	adminData.Password = hashedPassword
	adminData.Role = "admin"
	adminData.CreatedAt = time.Now()
	adminData.UpdatedAt = time.Now()

	_, err = collection.InsertOne(context.TODO(), adminData)
	return err
}

// GetAllAdminUsers retrieves all admin users
func GetAllAdminUsers(client *mongo.Client) ([]AdminUser, error) {
	collection := client.Database("users").Collection("users")
	filter := bson.D{{Key: "role", Value: "admin"}}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, err
	}
	defer cursor.Close(context.TODO())

	var admins []AdminUser
	if err = cursor.All(context.TODO(), &admins); err != nil {
		return nil, err
	}

	return admins, nil
}

// UpdateAdminUser updates an admin user
func UpdateAdminUser(client *mongo.Client, userCode string, adminData AdminUser) error {
	collection := client.Database("users").Collection("users")

	filter := bson.D{{Key: "userCode", Value: userCode}}
	update := bson.M{
		"$set": bson.M{
			"email":     adminData.Email,
			"firstName": adminData.FirstName,
			"lastName":  adminData.LastName,
			"updatedAt": time.Now(),
		},
	}

	// Only update password if provided
	if adminData.Password != "" {
		hashedPassword, err := HashPassword(adminData.Password)
		if err != nil {
			return err
		}
		update["$set"].(bson.M)["password"] = hashedPassword
	}

	_, err := collection.UpdateOne(context.TODO(), filter, update)
	return err
}

// DeleteAdminUser deletes an admin user
func DeleteAdminUser(client *mongo.Client, userCode string) error {
	collection := client.Database("users").Collection("users")
	filter := bson.D{
		{Key: "userCode", Value: userCode},
		{Key: "role", Value: "admin"},
	}

	_, err := collection.DeleteOne(context.TODO(), filter)
	return err
}

// GetSystemHealth returns system health information
func GetSystemHealth(client *mongo.Client) (map[string]interface{}, error) {
	health := make(map[string]interface{})

	// Check database connection
	err := client.Ping(context.TODO(), nil)
	if err != nil {
		health["database"] = "disconnected"
		health["status"] = "unhealthy"
		return health, err
	}

	health["database"] = "connected"
	health["status"] = "healthy"
	health["timestamp"] = time.Now()

	// Get database stats
	stats, err := GetDashboardStats(client)
	if err == nil {
		health["stats"] = stats
	}

	return health, nil
}
