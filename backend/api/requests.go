package api

import (
	"backend/helper"
	"context"
	"time"

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
	collection := client.Database("healthcare").Collection("doctors")
	deleteRequest.DoctorCode = helper.GenerateID(5)
	deleteRequest.CreatedAt = time.Now()
	deleteRequest.UpdatedAt = time.Now()
	collection.InsertOne(context.TODO(), deleteRequest)
}
