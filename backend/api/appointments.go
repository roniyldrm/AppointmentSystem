package api

import (
	"backend/helper"
	"context"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Appointment struct {
	AppointmentCode string          `bson:"appointmentCode" json:"appointmentCode"`
	AppointmentTime AppointmentTime `bson:"appointmentTime" json:"appointmentTime"`
	DoctorCode      string          `bson:"doctorCode" json:"doctorCode"`
	UserCode        string          `bson:"userCode" json:"userCode"`
	CreatedAt       time.Time       `bson:"createdAt" json:"createdAt"`
	UpdatedAt       time.Time       `bson:"updatedAt" json:"updatedAt"`
}

type AppointmentTime struct {
	Date string `bson:"date" json:"date"`
	Time string `bson:"time" json:"time"`
}

func CreateAppointment(client *mongo.Client, appointment Appointment) {
	collection := client.Database("healthcare").Collection("appointments")
	appointment.AppointmentCode = helper.GenerateID(8)
	appointment.CreatedAt = time.Now()
	appointment.UpdatedAt = time.Now()
	collection.InsertOne(context.TODO(), appointment)
	AddAppointmentToDoctor(client, appointment.DoctorCode, appointment.AppointmentCode)
}

func DeleteAppointment(client *mongo.Client, appointmentCode string) {
	collection := client.Database("healthcare").Collection("appointments")
	collection.FindOneAndDelete(context.TODO(), bson.D{{Key: "appointmentCode", Value: appointmentCode}})
}

func UpdateAppointment(client *mongo.Client, appointment Appointment) {
	collection := client.Database("healthcare").Collection("appointments")
	appointment.UpdatedAt = time.Now()
	collection.FindOneAndUpdate(context.TODO(), bson.D{{Key: "appointmentCode", Value: appointment.AppointmentCode}}, appointment)
}

func GetAllAppointments(client *mongo.Client) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var appointments []Appointment
	cursor.All(context.TODO(), &appointments)

	return appointments
}

func GetAppointmentsByDoctorCode(client *mongo.Client, doctorCode int) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "doctorCode", Value: doctorCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var appointments []Appointment
	for cursor.Next(context.TODO()) {
		var appointment Appointment
		if err := cursor.Decode(&appointments); err != nil {
			log.Println("Cursor decoding error:", err)
			return nil
		}
		appointments = append(appointments, appointment)
	}
	return appointments
}
