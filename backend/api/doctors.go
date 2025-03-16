package api

import (
	"backend/helper"
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Doctor struct {
	DoctorCode   string         `bson:"doctorCode" json:"doctorCode"`
	DoctorName   string         `bson:"doctorName" json:"doctorName"`
	Field        int            `bson:"field" json:"field"`
	HospitalCode int            `bson:"hospitalCode" json:"hospitalCode"`
	WorkHours    []WorkHours    `bson:"workHours" json:"workHours"`
	Appointments []Appointments `bson:"appointments" json:"appointments"`
}

type WorkHours struct {
	Start string `bson:"start" json:"start"`
	End   string `bson:"end" json:"end"`
}

type Appointments struct {
	Date string `bson:"date" json:"date"`
	Time string `bson:"time" json:"time"`
}

func CreateDoctor(client *mongo.Client, doctor Doctor) {
	collection := client.Database("hospitals").Collection("doctors")
	doctor.DoctorCode = helper.GenerateID(6)
	collection.InsertOne(context.TODO(), doctor)
}

func GetDoctorsByHospital(client *mongo.Client, hospitalCode int) []Doctor {
	collection := client.Database("hospitals").Collection("doctors")

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

func DeleteDoctor(client *mongo.Client, doctorCode string) {
	collection := client.Database("hospital").Collection("hospital")
	collection.FindOneAndDelete(context.TODO(), bson.D{{Key: "doctorCode", Value: doctorCode}})
}
