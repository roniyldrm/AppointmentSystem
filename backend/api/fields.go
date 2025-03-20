package api

import (
	"backend/helper"
	"slices"

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

func DoctorDeletionFieldCheck(client *mongo.Client, hospitalCode int, fieldCode int) {
	hospital, err := GetHospital(client, hospitalCode)
	if err != nil {
		return
	}
	doctors, err := GetDoctorsByHospitalCode(client, hospitalCode)
	if err != nil {
		return
	}
	for _, doctor := range doctors {
		if fieldCode == doctor.FieldCode {
			return
		}
	}
	hospital.Fields = helper.RemoveFromSlice(hospital.Fields, fieldCode)
	UpdateHospital(client, *hospital)
}

func DoctorCreationFieldCheck(client *mongo.Client, hospitalCode int, fieldCode int) {
	hospital, _ := GetHospital(client, hospitalCode)
	if !slices.Contains(hospital.Fields, fieldCode) {
		hospital.Fields = append(hospital.Fields, fieldCode)
		UpdateHospital(client, *hospital)
	}
}

func DoctorUpdateFieldCheck(client *mongo.Client, updatedDoctor Doctor) {
	doctor, _ := GetDoctor(client, updatedDoctor.DoctorCode)
	if doctor.FieldCode != updatedDoctor.FieldCode || doctor.HospitalCode != updatedDoctor.HospitalCode {
		DoctorDeletionFieldCheck(client, doctor.HospitalCode, doctor.FieldCode)
		DoctorCreationFieldCheck(client, updatedDoctor.HospitalCode, updatedDoctor.FieldCode)
	}
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
