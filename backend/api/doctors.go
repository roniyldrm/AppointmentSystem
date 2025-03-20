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
	FieldCode    int       `bson:"field" json:"field"`
	HospitalCode int       `bson:"hospitalCode" json:"hospitalCode"`
	WorkHours    WorkHours `bson:"workHours" json:"workHours"`
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
	DoctorCreationFieldCheck(client, doctor.HospitalCode, doctor.FieldCode)
	collection.InsertOne(context.TODO(), doctor)
}

func DeleteDoctor(client *mongo.Client, doctorCode string) {
	collection := client.Database("healthcare").Collection("doctors")
	doctor, err := GetDoctor(client, doctorCode)
	if err != nil || doctor == nil {
		log.Println("Doctor not found:", err)
		return
	}
	_, err = collection.DeleteOne(context.TODO(), bson.M{"doctorCode": doctorCode})
	if err != nil {
		log.Println("Error deleting doctor:", err)
		return
	}
	DoctorDeletionFieldCheck(client, doctor.HospitalCode, doctor.FieldCode)
}

func UpdateDoctor(client *mongo.Client, updatedDoctor Doctor) {
	collection := client.Database("healthcare").Collection("doctors")
	DoctorUpdateFieldCheck(client, updatedDoctor)
	updatedDoctor.UpdatedAt = time.Now()
	_, err := collection.ReplaceOne(
		context.TODO(),
		bson.M{"doctorCode": updatedDoctor.DoctorCode},
		updatedDoctor,
	)

	if err != nil {
		log.Println("Error updating hospital:", err)
	}
}

func GetAllDoctors(client *mongo.Client) []Doctor {
	collection := client.Database("healthcare").Collection("doctors")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var doctors []Doctor
	cursor.All(context.TODO(), &doctors)

	return doctors
}

func GetDoctor(client *mongo.Client, doctorCode string) (*Doctor, error) {
	collection := client.Database("healthcare").Collection("doctors")

	filter := bson.D{{Key: "doctorCode", Value: doctorCode}}
	var doctor Doctor

	err := collection.FindOne(context.TODO(), filter).Decode(&doctor)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("doctor not found")
		}
		return nil, err
	}

	return &doctor, nil
}

func GetDoctorsByHospitalCode(client *mongo.Client, hospitalCode int) ([]Doctor, error) {
	collection := client.Database("healthcare").Collection("doctors")

	filter := bson.D{{Key: "hospitalCode", Value: hospitalCode}}

	cursor, err := collection.Find(context.TODO(), filter)
	if err != nil {
		return nil, fmt.Errorf("error finding doctors: %v", err)
	}
	defer cursor.Close(context.TODO())

	var doctors []Doctor
	for cursor.Next(context.TODO()) {
		var doctor Doctor
		if err := cursor.Decode(&doctor); err != nil {
			return nil, fmt.Errorf("error decoding doctor: %v", err)
		}
		doctors = append(doctors, doctor)
	}
	return doctors, nil
}

func InsertManyDoctors(client *mongo.Client, doctors []interface{}) error {
	collection := client.Database("healthcare").Collection("doctors")
	_, err := collection.InsertMany(context.TODO(), doctors)
	return err
}

/* func AddAppointmentToDoctor(client *mongo.Client, doctorCode, appointmentCode string) error {
	collection := client.Database("hospitals").Collection("doctors")
	filter := bson.M{"doctorCode": doctorCode}
	update := bson.M{"$push": bson.M{"appointments": appointmentCode}}
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}
	return nil
}

func RemoveAppointmentFromDoctor(client *mongo.Client, doctorCode, appointmentCode string) error {
	collection := client.Database("hospitals").Collection("doctors")
	filter := bson.M{"doctorCode": doctorCode}
	update := bson.M{"$pull": bson.M{"appointments": appointmentCode}}
	_, err := collection.UpdateOne(context.TODO(), filter, update)
	if err != nil {
		return err
	}
	return nil
} */
