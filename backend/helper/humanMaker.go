package helper

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"sort"

	"go.mongodb.org/mongo-driver/mongo"
)

type Doctor struct {
	DoctorCode   int            `bson:"doctorCode" json:"doctorCode"`
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

func CreateHuman(client *mongo.Client) Doctor {
	collection := client.Database("hospitals").Collection("doctors")
	var doctor Doctor
	doctor.DoctorName = "Cemal"
	collection.InsertOne(context.TODO(), doctor)

	return doctor
}

func Tester() {
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
	ioutil.WriteFile("helper/names/yeniisimler.json", fileContent, 0644)
}

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
