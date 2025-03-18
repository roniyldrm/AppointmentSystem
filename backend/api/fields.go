package api

import (
	"go.mongodb.org/mongo-driver/mongo"
)

type Field struct {
	FieldCode int    `bson:"fieldCode" json:"fieldCode"`
	FieldName string `bson:"fieldName" json:"fieldName"`
}

func GetFieldsByProvince(client *mongo.Client, provinceCode int) []int {

	var found [10]bool
	var fields []int

	hospitals := GetHospitalsByProvince(client, provinceCode)

	for _, hospital := range hospitals {
		for _, field := range hospital.Fields {
			if !found[field] {
				found[field] = true
				fields = append(fields, field)
			}
		}
	}

	return fields
}

func GetFieldsByDistrict(client *mongo.Client, districtCode int) []int {

	var found [10]bool
	var fields []int

	hospitals := GetHospitalsByDistrict(client, districtCode)

	for _, hospital := range hospitals {
		for _, field := range hospital.Fields {
			if !found[field] {
				found[field] = true
				fields = append(fields, field)
			}
		}
	}

	return fields
}

/* baseFields := []Field{
	{FieldCode: 1, FieldName: "Dahiliye"},
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
