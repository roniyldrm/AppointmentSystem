package helper

import (
	"math/rand"
)

var names []string
var surnames []string

type Doctor struct {
	DoctorCode   string         `bson:"doctorCode" json:"doctorCode"`
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

// a function to fill every single empty position
/* func FillHospitals(client *mongo.Client) {
	collection := client.Database("hospitals").Collection("doctors")
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
	provinces := api.GetAllProvinces(client)
	for _, province := range provinces {
		hospitals := api.GetHospitalsByProvince(client, province.Code)
		for _, hospital := range hospitals {
			doctors := api.GetDoctorsByHospital(client, hospital.HospitalCode)
			var fieldCheck [10]bool
			for _, doctor := range doctors {
				fieldCheck[doctor.Field] = true
			}
			for index, value := range fieldCheck {
				if !value {
					fmt.Println("yok abi yap")
					doctor := Doctor{
						DoctorCode:   GenerateID(6),
						DoctorName:   CreateName(),
						Field:        index,
						HospitalCode: hospital.HospitalCode,
						WorkHours:    []WorkHours{{Start: "09:00", End: "17:00"}},
					}
					collection.InsertOne(context.TODO(), doctor)
				}
			}
		}

	}
} */

func CreateName() string {
	prepName := ""
	amountOfNames := len(names)
	amountOfSurnames := len(surnames)

	if rand.Intn(100) > 90 {
		prepName += names[rand.Intn(amountOfNames)] + " "
	}
	prepName += names[rand.Intn(amountOfNames)] + " "
	prepName += surnames[rand.Intn(amountOfSurnames)]
	return prepName
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
