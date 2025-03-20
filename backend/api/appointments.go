package api

import (
	"backend/helper"
	"context"
	"errors"
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
}

func DeleteAppointment(client *mongo.Client, appointmentCode string) error {
	collection := client.Database("healthcare").Collection("appointments")
	_, err := collection.DeleteOne(context.TODO(), bson.M{"appointmentCode": appointmentCode})
	return err
}

func UpdateAppointment(client *mongo.Client, appointment Appointment) {
	collection := client.Database("healthcare").Collection("appointments")
	appointment.UpdatedAt = time.Now()

	_, err := collection.ReplaceOne(
		context.TODO(),
		bson.M{"appointmentCode": appointment.AppointmentCode},
		appointment,
	)

	if err != nil {
		log.Println("Error updating appointment:", err)
	}
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

func GetAppointment(client *mongo.Client, appointmentCode string) (*Appointment, error) {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "appointmentCode", Value: appointmentCode}}
	var appointment Appointment
	err := collection.FindOne(context.TODO(), filter).Decode(&appointment)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("appointment not found")
		}
		return nil, err
	}
	return &appointment, nil
}

func GetAppointmentsByDoctorCode(client *mongo.Client, doctorCode string) []Appointment {
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

func GetAppointmentsByUserCode(client *mongo.Client, userCode string) []Appointment {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "userCode", Value: userCode}}

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
