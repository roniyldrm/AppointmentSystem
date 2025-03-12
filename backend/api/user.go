package api

import (
	"context"
	"fmt"
	"log"
	"time"

	"go.mongodb.org/mongo-driver/mongo"
)

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id"`      // Unique ID
	Name      string    `bson:"name" json:"name"`             // Full name
	Email     string    `bson:"email" json:"email"`           // User's email
	Password  string    `bson:"password" json:"-"`            // Hashed password (don't expose in JSON)
	Role      string    `bson:"role" json:"role"`             // Role (e.g., "admin", "user", "business")
	CreatedAt time.Time `bson:"created_at" json:"created_at"` // Account creation time
	UpdatedAt time.Time `bson:"updated_at" json:"updated_at"` // Last profile update
}

func InsertUsers(collection *mongo.Collection, users []interface{}) {
	insertResult, err := collection.InsertMany(context.TODO(), users)
	if err != nil {
		log.Fatal(err)
	}

	fmt.Println("Inserted documents: ", insertResult.InsertedIDs)
}
