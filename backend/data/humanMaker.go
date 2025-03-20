package data

import (
	"backend/api"
	"backend/helper"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"math/rand"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

var names []string
var surnames []string

type WorkHours struct {
	Start string `bson:"start" json:"start"`
	End   string `bson:"end" json:"end"`
}

type AppointmentTime struct {
	Date string `bson:"date" json:"date"`
	Time string `bson:"time" json:"time"`
}

type Appointment struct {
	AppointmentCode string          `bson:"appointmentCode" json:"appointmentCode"`
	AppointmentTime AppointmentTime `bson:"appointmentTime" json:"appointmentTime"`
	DoctorCode      string          `bson:"doctorCode" json:"doctorCode"`
	UserCode        string          `bson:"userCode" json:"userCode"`
}

// a function to fill every single empty position
/* func FillHospitals(client *mongo.Client) {
	namesFile, err := ioutil.ReadFile("helper/names/isimler.json")
	if err != nil {
		fmt.Println(err)
	}
	surnamesFile, err := ioutil.ReadFile("helper/names/soyisimler.json")
	if err != nil {
		fmt.Println(err)
	}
	json.Unmarshal(namesFile, &names)
	json.Unmarshal(surnamesFile, &surnames)

	hospitals := api.GetHospitalsByProvince(client, 34)
	for _, hospital := range hospitals {
		doctors, _ := api.GetDoctorsByHospitalCode(client, hospital.HospitalCode)
		var fieldCheck [10]bool
		for _, doctor := range doctors {
			fieldCheck[doctor.FieldCode] = true
		}
		for index, value := range fieldCheck {
			if !value {
				doctor := api.Doctor{
					DoctorName:   CreateName(),
					FieldCode:    index,
					HospitalCode: hospital.HospitalCode,
					WorkHours:    api.WorkHours{Start: "09:00", End: "17:00"},
				}

				api.CreateDoctor(client, doctor)
			}
		}
	}
} */

func FillHospitals(client *mongo.Client) {
	namesFile, err := ioutil.ReadFile("helper/names/isimler.json")
	if err != nil {
		log.Fatalf("Failed to read isimler.json: %v", err)
	}
	surnamesFile, err := ioutil.ReadFile("helper/names/soyisimler.json")
	if err != nil {
		log.Fatalf("Failed to read soyisimler.json: %v", err)
	}
	json.Unmarshal(namesFile, &names)
	json.Unmarshal(surnamesFile, &surnames)

	var allDoctors []interface{}

	hospitals := api.GetAllHospitals(client)
	for _, hospital := range hospitals {
		doctors, _ := api.GetDoctorsByHospitalCode(client, hospital.HospitalCode)
		var fieldCheck [10]bool
		for _, doctor := range doctors {
			fieldCheck[doctor.FieldCode] = true
		}
		for index, value := range fieldCheck {
			if !value {
				allDoctors = append(allDoctors, api.Doctor{
					DoctorCode:   helper.GenerateID(6),
					DoctorName:   CreateName(),
					FieldCode:    index,
					HospitalCode: hospital.HospitalCode,
					WorkHours:    api.WorkHours{Start: "09:00", End: "17:00"},
					CreatedAt:    time.Now(),
					UpdatedAt:    time.Now(),
				})
				//allDoctors = append(allDoctors, doctor)
				//api.CreateDoctor(client, doctor)
			}
		}
	}

	api.InsertManyDoctors(client, allDoctors)
}

func CreateName() string {
	prepName := ""
	amountOfNames := len(names)
	amountOfSurnames := len(surnames)

	if rand.Intn(100) > 90 {
		prepName += names[rand.Intn(amountOfNames)] + " "
	}
	prepName += names[rand.Intn(amountOfNames)] + " "
	prepName += surnames[rand.Intn(amountOfSurnames)]
	fmt.Println(prepName)
	return prepName
}
func RemoveAllDoctorsInProvince(client *mongo.Client, provinceCode int) {
	hospitals := api.GetHospitalsByProvince(client, provinceCode)
	for _, hospital := range hospitals {
		fmt.Println(hospital.HospitalName)
		doctors, _ := api.GetDoctorsByHospitalCode(client, hospital.HospitalCode)
		for _, doctor := range doctors {
			fmt.Println(client, doctor.DoctorName)
			api.DeleteDoctor(client, doctor.DoctorCode)
		}
	}
}

/* func Tester() {
	fileContent, err := ioutil.ReadFile("helper/names/isimler.json")
	if err != nil {
		fmt.Println(err)
	}

	var names []string
	var nameContainer []string
	var dupedNames []string
	json.Unmarshal(fileContent, &names)
	var found bool = false
	for _, name := range names {
		found = false
		for _, checkingName := range nameContainer {
			if checkingName == name {
				found = true
				dupedNames = append(dupedNames, name)
			}
		}
		if !found {
			nameContainer = append(nameContainer, name)
		}
	}

	fileContent = []byte("[\n")
	for i, name := range nameContainer {
		if i > 0 {
			fileContent = append(fileContent, []byte(",\n")...)
		}
		fileContent = append(fileContent, []byte(`"`+name+`"`)...)
	}
	fileContent = append(fileContent, []byte("\n]")...)

	sort.Strings(dupedNames)
	fmt.Println(dupedNames)
	fmt.Println(len(names))
	fmt.Println(len(nameContainer))
	fmt.Println(len(dupedNames))
	ioutil.WriteFile("helper/names/yenisoyisimler.json", fileContent, 0644)
} */

/* {
	"doctorCode": "foobar"
	"doctorName": "Dr. John Doe",
	"field": "Dahiliye"
	"hospitalCode": 1231,
	"workHours": { "start": "09:00", "end": "17:00" },
	"appointments": [
	  { "date": "2025-03-16", "time": "09:15" },
	  { "date": "2025-03-16", "time": "10:45" }
	]
} */
