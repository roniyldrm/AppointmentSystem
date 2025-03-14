package api

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Hospital struct {
	ID         int    `bson:"id" json:"id"`
	Name       string `bson:"name" json:"name"`
	ProvinceId int    `bson:"provinceId" json:"provinceId"`
	DistrictId int    `bson:"districtId" json:"districtId"`
	Address    string `bson:"address" json:"address"`
}

func GetHospitalsByProvince(client *mongo.Client, provinceId int) []Hospital {
	//client := mongodb.GetClient()

	collection := client.Database("hospitals").Collection("hospitals")

	filter := bson.D{{Key: "provinceId", Value: provinceId}}

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

func GetHospitalsByDistrict(client *mongo.Client, districtId int) []Hospital {

	collection := client.Database("hospitals").Collection("hospitals")

	filter := bson.D{{Key: "districtId", Value: districtId}}

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
