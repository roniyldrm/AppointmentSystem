package api

import (
	"context"
	"errors"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

// UserAdditionalInfo represents the additional profile information for a user
type UserAdditionalInfo struct {
	ID                 string    `bson:"_id,omitempty" json:"id"`
	UserCode           string    `bson:"userCode" json:"userCode"`
	FirstName          string    `bson:"firstName" json:"firstName"`
	LastName           string    `bson:"lastName" json:"lastName"`
	Email              string    `bson:"email" json:"email"`
	Phone              string    `bson:"phone" json:"phone"`
	Address            string    `bson:"address" json:"address"`
	BirthDate          string    `bson:"birthDate" json:"birthDate"`
	Gender             string    `bson:"gender" json:"gender"`
	BloodType          string    `bson:"bloodType" json:"bloodType"`
	Height             string    `bson:"height" json:"height"`
	Weight             string    `bson:"weight" json:"weight"`
	Allergies          string    `bson:"allergies" json:"allergies"`
	ChronicDiseases    string    `bson:"chronicDiseases" json:"chronicDiseases"`
	CurrentMedications string    `bson:"currentMedications" json:"currentMedications"`
	CreatedAt          time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt          time.Time `bson:"updatedAt" json:"updatedAt"`
}

// CreateUserAdditionalInfo creates or updates the additional information for a user
func CreateUserAdditionalInfo(client *mongo.Client, info UserAdditionalInfo) error {
	collection := client.Database("users").Collection("userAdditionalInfo")

	// Set timestamps
	info.UpdatedAt = time.Now()

	// Check if a record already exists for this user
	filter := bson.D{{Key: "userCode", Value: info.UserCode}}
	var existingInfo UserAdditionalInfo
	err := collection.FindOne(context.TODO(), filter).Decode(&existingInfo)

	if err == nil {
		// Update existing record
		update := bson.M{
			"$set": bson.M{
				"firstName":          info.FirstName,
				"lastName":           info.LastName,
				"email":              info.Email,
				"phone":              info.Phone,
				"address":            info.Address,
				"birthDate":          info.BirthDate,
				"gender":             info.Gender,
				"bloodType":          info.BloodType,
				"height":             info.Height,
				"weight":             info.Weight,
				"allergies":          info.Allergies,
				"chronicDiseases":    info.ChronicDiseases,
				"currentMedications": info.CurrentMedications,
				"updatedAt":          info.UpdatedAt,
			},
		}
		_, err = collection.UpdateOne(context.TODO(), filter, update)
		return err
	}

	// Create new record
	info.CreatedAt = time.Now()
	_, err = collection.InsertOne(context.TODO(), info)
	return err
}

// GetUserAdditionalInfo retrieves the additional profile information for a user
func GetUserAdditionalInfo(client *mongo.Client, userCode string) (*UserAdditionalInfo, error) {
	collection := client.Database("users").Collection("userAdditionalInfo")

	filter := bson.D{{Key: "userCode", Value: userCode}}
	var info UserAdditionalInfo

	err := collection.FindOne(context.TODO(), filter).Decode(&info)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Return an empty record if not found
			return &UserAdditionalInfo{
				UserCode:  userCode,
				CreatedAt: time.Now(),
				UpdatedAt: time.Now(),
			}, nil
		}
		return nil, err
	}

	return &info, nil
}

// UpdateUserAdditionalInfo updates the additional profile information for a user
func UpdateUserAdditionalInfo(client *mongo.Client, info UserAdditionalInfo) error {
	collection := client.Database("users").Collection("userAdditionalInfo")

	if info.UserCode == "" {
		return errors.New("userCode is required")
	}

	// Set updated timestamp
	info.UpdatedAt = time.Now()

	filter := bson.D{{Key: "userCode", Value: info.UserCode}}

	// Check if record exists
	var existingInfo UserAdditionalInfo
	err := collection.FindOne(context.TODO(), filter).Decode(&existingInfo)

	if err != nil {
		if err == mongo.ErrNoDocuments {
			// Create new record if not found
			info.CreatedAt = time.Now()
			_, err = collection.InsertOne(context.TODO(), info)
			return err
		}
		return err
	}

	// Update existing record
	update := bson.M{
		"$set": bson.M{
			"firstName":          info.FirstName,
			"lastName":           info.LastName,
			"email":              info.Email,
			"phone":              info.Phone,
			"address":            info.Address,
			"birthDate":          info.BirthDate,
			"gender":             info.Gender,
			"bloodType":          info.BloodType,
			"height":             info.Height,
			"weight":             info.Weight,
			"allergies":          info.Allergies,
			"chronicDiseases":    info.ChronicDiseases,
			"currentMedications": info.CurrentMedications,
			"updatedAt":          info.UpdatedAt,
		},
	}

	_, err = collection.UpdateOne(context.TODO(), filter, update)
	return err
}

// DeleteUserAdditionalInfo deletes the additional profile information for a user
func DeleteUserAdditionalInfo(client *mongo.Client, userCode string) error {
	collection := client.Database("users").Collection("userAdditionalInfo")

	filter := bson.D{{Key: "userCode", Value: userCode}}
	_, err := collection.DeleteOne(context.TODO(), filter)
	return err
}
