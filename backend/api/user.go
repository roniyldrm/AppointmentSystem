package api

import (
	"backend/helper"
	"context"
	"errors"
	"fmt"
	"os"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"go.mongodb.org/mongo-driver/bson"
	"go.mongodb.org/mongo-driver/mongo"
	"golang.org/x/crypto/bcrypt"
)

type User struct {
	ID        string    `bson:"_id,omitempty" json:"id"`
	UserCode  string    `bson:"userCode" json:"userCode"`
	Email     string    `bson:"email" json:"email"`
	Password  string    `bson:"password" json:"password"`
	Role      string    `bson:"role" json:"role"`
	CreatedAt time.Time `bson:"createdAt" json:"createdAt"`
	UpdatedAt time.Time `bson:"updatedAt" json:"updatedAt"`
}

type LoginRequest struct {
	Email    string ` json:"email"`
	Password string `json:"password"`
}

type TokenResponse struct {
	AccessToken  string `json:"accessToken"`
	RefreshToken string `json:"refreshToken"`
	ExpiresIn    int64  `json:"expiresIn"`
	Role         string `json:"role"`
	UserCode     string `json:"userCode"`
}

type LoginResponse struct {
	Message string `json:"message"`
}

type Claims struct {
	UserCode string `json:"userCode"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// Secret keys for JWT tokens
var secretKey = []byte(getSecretKey("JWT_SECRET", "supersecretkey1234"))
var refreshSecretKey = []byte(getSecretKey("JWT_REFRESH_SECRET", "refreshsupersecretkey1234"))

// getSecretKey gets a secret key from environment variable with fallback
func getSecretKey(envKey, fallback string) string {
	if key := os.Getenv(envKey); key != "" {
		return key
	}
	return fallback
}

func LoginUser(client *mongo.Client, input LoginRequest) (TokenResponse, error) {
	collection := client.Database("users").Collection("users")
	filter := bson.D{{Key: "email", Value: input.Email}}
	var user User
	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		return TokenResponse{}, errors.New("no such user")
	}
	fmt.Println("Stored Hash:", user.Password)
	fmt.Println("Input Password:", input.Password)

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password))
	if err != nil {
		return TokenResponse{}, errors.New("incorrect password")
	}

	accessToken, refreshToken, expiresIn, err := generateTokens(user.UserCode, user.Role)
	if err != nil {
		return TokenResponse{}, errors.New("could not generate token")
	}

	return TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		Role:         user.Role,
		UserCode:     user.UserCode,
	}, nil
}

func RegisterUser(client *mongo.Client, user User) (TokenResponse, error) {
	collection := client.Database("users").Collection("users")
	if err := collection.FindOne(context.TODO(), bson.D{{Key: "email", Value: user.Email}}).Err(); err == nil {
		return TokenResponse{}, errors.New("email already exists")
	}
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		return TokenResponse{}, err
	}
	user.Password = string(hashedPassword)
	user.UserCode = helper.GenerateID(8)
	user.CreatedAt = time.Now()
	user.UpdatedAt = time.Now()

	accessToken, refreshToken, expiresIn, err := generateTokens(user.UserCode, user.Role)
	if err != nil {
		return TokenResponse{}, errors.New("could not generate token")
	}

	_, err = collection.InsertOne(context.TODO(), user)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		Role:         user.Role,
		UserCode:     user.UserCode,
	}, nil
}

func DeleteUser(client *mongo.Client, userCode string) {
	collection := client.Database("users").Collection("users")
	collection.FindOneAndDelete(context.TODO(), bson.D{{Key: "userCode", Value: userCode}})
}

func GetAllUsers(client *mongo.Client) []User {
	collection := client.Database("users").Collection("users")

	filter := bson.D{{}}

	cursor, _ := collection.Find(context.TODO(), filter)
	defer cursor.Close(context.TODO())

	var users []User
	cursor.All(context.TODO(), &users)

	return users
}

func GetUser(client *mongo.Client, userCode string) (*User, error) {
	collection := client.Database("users").Collection("users")

	filter := bson.D{{Key: "userCode", Value: userCode}}
	var user User

	err := collection.FindOne(context.TODO(), filter).Decode(&user)
	if err != nil {
		if err == mongo.ErrNoDocuments {
			return nil, errors.New("no such user")
		}
		return nil, err
	}

	return &user, nil
}

func generateJWT(userCode, userRole string) (string, error) {
	expirationTime := time.Now().Add(15 * time.Minute)
	claims := Claims{
		UserCode: userCode,
		Role:     userRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(secretKey)
}

func generateRefreshToken(userCode, userRole string) (string, error) {
	expirationTime := time.Now().Add(7 * 24 * time.Hour) // 7 days
	claims := Claims{
		UserCode: userCode,
		Role:     userRole,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(expirationTime),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString(refreshSecretKey)
}

func generateTokens(userCode, userRole string) (string, string, int64, error) {
	// Generate access token (short-lived)
	expirationTime := time.Now().Add(15 * time.Minute)
	accessToken, err := generateJWT(userCode, userRole)
	if err != nil {
		return "", "", 0, err
	}

	// Generate refresh token (long-lived)
	refreshToken, err := generateRefreshToken(userCode, userRole)
	if err != nil {
		return "", "", 0, err
	}

	// Calculate expiration in seconds
	expiresIn := expirationTime.Unix() - time.Now().Unix()

	return accessToken, refreshToken, expiresIn, nil
}

func RefreshToken(refreshTokenString string) (TokenResponse, error) {
	token, err := jwt.ParseWithClaims(refreshTokenString, &Claims{}, func(token *jwt.Token) (interface{}, error) {
		return refreshSecretKey, nil
	})

	if err != nil {
		return TokenResponse{}, errors.New("invalid refresh token")
	}

	claims, ok := token.Claims.(*Claims)
	if !ok || !token.Valid {
		return TokenResponse{}, errors.New("invalid refresh token")
	}

	// Generate new tokens
	accessToken, refreshToken, expiresIn, err := generateTokens(claims.UserCode, claims.Role)
	if err != nil {
		return TokenResponse{}, err
	}

	return TokenResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    expiresIn,
		Role:         claims.Role,
		UserCode:     claims.UserCode,
	}, nil
}
