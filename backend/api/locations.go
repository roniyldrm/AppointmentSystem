package api

import (
	"context"
	"fmt"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type District struct {
	IDa        int    `bson:"ida" json:"ida"`
	Name       string `bson:"name" json:"name"`
	ProvinceId int    `bson:"provinceId" json:"provinceId"`
}

func GetDistrictsByProvince(client *mongo.Client, provinceId int) []District {
	collection := client.Database("locations").Collection("districts")

	filter := bson.D{{Key: "provinceId", Value: provinceId}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var districts []District
	for cursor.Next(context.TODO()) {
		var district District
		if err := cursor.Decode(&district); err != nil {
			log.Println("Cursor decoding error:", err)
			return nil
		}
		districts = append(districts, district)
	}
	return districts
}

func PrintProvinces(client *mongo.Client) {
	collection := client.Database("locations").Collection("provinces")

	cursor, err := collection.Find(context.TODO(), bson.M{})
	if err != nil {
		log.Fatal(err)
	}
	defer cursor.Close(context.TODO())

	fmt.Println("Provinces in the database:")
	for cursor.Next(context.TODO()) {
		var result struct {
			Name string `bson:"name"`
		}
		if err := cursor.Decode(&result); err != nil {
			log.Fatal(err)
		}
		fmt.Println(result.Name)
	}
}
