package api

import (
	"context"
	"log"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Province struct {
	Code int    `bson:"code" json:"code"`
	Name string `bson:"name" json:"name"`
}

type District struct {
	DistrictCode string `bson:"districtCode" json:"districtCode"`
	DistrictName string `bson:"districtName" json:"districtName"`
	ProvinceCode int    `bson:"provinceCode" json:"provinceCode"`
}

func GetAllProvinces(client *mongo.Client) []Province {
	collection := client.Database("locations").Collection("provinces")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var provinces []Province
	cursor.All(context.TODO(), &provinces)

	return provinces
}

func GetDistrictsByProvince(client *mongo.Client, provinceCode int) []District {
	collection := client.Database("locations").Collection("districts")

	filter := bson.D{{Key: "provinceCode", Value: provinceCode}}

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

/* func PrintProvinces(client *mongo.Client) {
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
} */
