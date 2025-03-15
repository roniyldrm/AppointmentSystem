package api

import (
	"backend/helper"
	"context"
	"fmt"
	"time"

	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
)

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	UserCode  string    `bson:"userCode" json:"userCode"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"password"`
	Role      string    `bson:"role" json:"role"`
	CreatedAt time.Time `bson:"created_at" json:"created_at"`
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"`
}

func Login(client *mongo.Client, info map[string]string) {
	collection := client.Database("users").Collection("users")
	filter := bson.D{{Key: "email", Value: info["email"]}}
	var user User
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		fmt.Println("baba siz kimsiniz")
	} else {
		if user.Password != info["password"] {
			fmt.Println("sie")
		} else {
			fmt.Println("buyur kardesim")
		}
	}
}

func Register(client *mongo.Client, user User) {
	collection := client.Database("users").Collection("users")
	user.UserCode = helper.GenerateID(8)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()
	fmt.Print(user)
	collection.InsertOne(context.TODO(), user)
}
