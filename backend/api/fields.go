package api

import (
	"context"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type Field struct {
	FieldCode int    `bson:"fieldCode" json:"fieldCode"`
	FieldName string `bson:"fieldName" json:"fieldName"`
}

func GetFieldsByProvince(client *mongo.Client, provinceCode int) []Field {

	var found [10]bool

	collection := client.Database("healthcare").Collection("hospitals")

	filter := bson.D{{Key: "provinceCode", Value: provinceCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var fields []Field
	for cursor.Next(context.TODO()) {
		var hospital Hospital
		for _, field := range hospital.Fields {
			if !found[field.FieldCode] {
				found[field.FieldCode] = true
				fields = append(fields, field)
			}
		}
	}

	return fields
}

func GetFieldsByDistrict(client *mongo.Client, districtCode int) []Field {

	var found [10]bool

	collection := client.Database("healthcare").Collection("hospitals")

	filter := bson.D{{Key: "districtCode", Value: districtCode}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var fields []Field
	for cursor.Next(context.TODO()) {
		var hospital Hospital
		for _, field := range hospital.Fields {
			if !found[field.FieldCode] {
				found[field.FieldCode] = true
				fields = append(fields, field)
			}
		}
	}

	return fields
}

/* baseFields := []Field{
	{FieldCode: 0, FieldName: "Dahiliye"},
	{FieldCode: 1, FieldName: "Çocuk Sağlığı ve Hastalıkları"},
	{FieldCode: 2, FieldName: "Kulak Burun Boğaz Hastalıkları"},
	{FieldCode: 3, FieldName: "Göz Hastalıkları"},
	{FieldCode: 4, FieldName: "Kadın Hastalıkları ve Doğum"},
	{FieldCode: 5, FieldName: "Ortopedi ve Travmatoloji"},
	{FieldCode: 6, FieldName: "Genel Cerrahi"},
	{FieldCode: 7, FieldName: "Deri ve Zührevi Hastalıkları"},
	{FieldCode: 8, FieldName: "Nöroloji"},
	{FieldCode: 9, FieldName: "Kardiyoloji"},
} */
