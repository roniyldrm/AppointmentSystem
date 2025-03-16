package api

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Hospital struct {
	HospitalCode int    `bson:"hospitalCode" json:"hospitalCode"`
	HospitalName string `bson:"hospitalName" json:"hospitalName"`
	DistrictCode int    `bson:"districtCode" json:"districtCode"`
}

func GetHospitalsByProvince(client *mongo.Client, provinceCode int) []Hospital {
	//client := mongodb.GetClient()

	collection := client.Database("hospitals").Collection("hospitals")

	filter := bson.D{{Key: "provinceCode", Value: provinceCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var hospitals []Hospital
	for cursor.Next(context.TODO()) {
		var hospital Hospital
		if err := cursor.Decode(&hospital); err != nil {
			log.Fatal(err)
		}
		hospitals = append(hospitals, hospital)
	}

	return hospitals
}

func GetHospitalsByDistrict(client *mongo.Client, districtCode int) []Hospital {

	collection := client.Database("hospitals").Collection("hospitals")

	filter := bson.D{{Key: "districtCode", Value: districtCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var hospitals []Hospital
	for cursor.Next(context.TODO()) {
		var hospital Hospital
		if err := cursor.Decode(&hospital); err != nil {
			log.Fatal(err)
		}
		hospitals = append(hospitals, hospital)
	}

	return hospitals
}
