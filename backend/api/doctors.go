package api

import (
	"backend/helper"
	"context"
	"errors"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Doctor struct {
	DoctorCode   string    `bson:"doctorCode" json:"doctorCode"`
	DoctorName   string    `bson:"doctorName" json:"doctorName"`
	Field        int       `bson:"field" json:"field"`
	HospitalCode int       `bson:"hospitalCode" json:"hospitalCode"`
	WorkHours    WorkHours `bson:"workHours" json:"workHours"`
	Appointments []string  `bson:"appointments" json:"appointments"`
	CreatedAt    time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt    time.Time `bson:"updatedAt" json:"updatedAt"`
}

type WorkHours struct {
	Start string `bson:"start" json:"start"`
	End   string `bson:"end" json:"end"`
}

func CreateDoctor(client *mongo.Client, doctor Doctor) {
	collection := client.Database("healthcare").Collection("doctors")
	doctor.DoctorCode = helper.GenerateID(6)
	doctor.CreatedAt = time.Now()
	doctor.UpdatedAt = time.Now()
	collection.InsertOne(context.TODO(), doctor)
}

func DeleteDoctor(client *mongo.Client, doctorCode string) {
	collection := client.Database("healthcare").Collection("doctors")
	collection.FindOneAndDelete(context.TODO(), bson.D{{Key: "doctorCode", Value: doctorCode}})
}

func UpdateDoctor(client *mongo.Client, doctor Doctor) {
	collection := client.Database("healthcare").Collection("doctors")
	doctor.UpdatedAt = time.Now()
	collection.FindOneAndUpdate(context.TODO(), bson.D{{Key: "doctorCode", Value: doctor.DoctorCode}}, doctor)
}

func GetAllDoctors(client *mongo.Client) []Doctor {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var doctors []Doctor
	cursor.All(context.TODO(), &doctors)

	return doctors
}

func GetDoctor(client *mongo.Client, doctorCode string) (*Doctor, error) {
	collection := client.Database("healthcare").Collection("appointments")

	filter := bson.D{{Key: "doctorCode", Value: doctorCode}}
	var doctor Doctor

	err := collection.FindOne(context.TODO(), filter).Decode(&doctor)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Handle the case where no doctor is found
			return nil, errors.New("no such doctor")
		}
		return nil, err // return the original error if something went wrong
	}

	return &doctor, nil
}

func GetDoctorsByHospitalCode(client *mongo.Client, hospitalCode int) []Doctor {
	collection := client.Database("healthcare").Collection("doctors")

	filter := bson.D{{Key: "hospitalCode", Value: hospitalCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var doctors []Doctor
	for cursor.Next(context.TODO()) {
		var doctor Doctor
		if err := cursor.Decode(&doctor); err != nil {
			log.Println("Cursor decoding error:", err)
			return nil
		}
		doctors = append(doctors, doctor)
	}
	return doctors
}

func AddAppointmentToDoctor(client *mongo.Client, doctorCode, appointmentCode string) error {
	fmt.Println(doctorCode +" " + appointmentCode)
	collection := client.Database("hospitals").Collection("doctors")
	filter := bson.M{"doctorCode": doctorCode}
	update := bson.M{"$push": bson.M{"appointments": appointmentCode}}
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}
	return nil
}
