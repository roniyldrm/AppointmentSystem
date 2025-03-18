package api

import (
	"backend/helper"
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type AppointmentDeleteRequest struct {
	RequestCode     string    `bson:"requestCode" json:"requestCode"`
	AppointmentCode string    `bson:"appointmentCode" json:"appointmentCode"`
	DoctorCode      string    `bson:"doctorCode" json:"doctorCode"`
	Reason          string    `bson:"reason" json:"reason"`
	Status          string    `bson:"status" json:"status"`
	CreatedAt       time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time `bson:"updatedAt" json:"updatedAt"`
}

func CreateAppointmentCancelRequest(client *mongo.Client, deleteRequest AppointmentDeleteRequest) {
	collection := client.Database("healthcare").Collection("requests")
	deleteRequest.DoctorCode = helper.GenerateID(5)
	deleteRequest.CreatedAt = time.Now()
	deleteRequest.UpdatedAt = time.Now()
	collection.InsertOne(context.TODO(), deleteRequest)
}

func GetAllAppointmentCancelRequests(client *mongo.Client) []AppointmentDeleteRequest {
	collection := client.Database("healthcare").Collection("requests")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var requests []AppointmentDeleteRequest
	cursor.All(context.TODO(), &requests)

	return requests
}

func GetAppointmentCancelRequestsByDoctorCode(client *mongo.Client, doctorCode string) []AppointmentDeleteRequest {
	collection := client.Database("healthcare").Collection("requests")

	filter := bson.D{{Key: "doctorCode", Value: doctorCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var requests []AppointmentDeleteRequest
	for cursor.Next(context.TODO()) {
		var request AppointmentDeleteRequest
		if err := cursor.Decode(&requests); err != nil {
			log.Println("Cursor decoding error:", err)
			return nil
		}
		requests = append(requests, request)
	}
	return requests
}

func UpdateCancelRequestStatus(client *mongo.Client, requestID, status string) error {
	collection := client.Database("healthcare").Collection("requests")

	filter := bson.M{"_id": requestID}
	update := bson.M{"$set": bson.M{"status": status, "updatedAt": time.Now()}}

	_, err := collection.UpdateOne(context.TODO(), filter, update)
	return err
}

func DeleteAppointmentCancelRequest(client *mongo.Client, requestCode string) {
	collection := client.Database("healthcare").Collection("requests")
	collection.FindOneAndDelete(context.TODO(), bson.D{{Key: "requestCode", Value: requestCode}})
}
