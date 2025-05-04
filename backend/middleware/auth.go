package middleware

import (
	"context"
	"errors"
	"net/http"
	"os"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

// Secret keys for JWT tokens
var secretKey = []byte(getSecretKey("JWT_SECRET", "supersecretkey1234"))
var refreshSecretKey = []byte(getSecretKey("JWT_REFRESH_SECRET", "refreshsupersecretkey1234"))

type Claims struct {
	UserCode string `json:"userCode"`
	Role     string `json:"role"`
	jwt.RegisteredClaims
}

// getSecretKey gets a secret key from environment variable with fallback
func getSecretKey(envKey, fallback string) string {
	if key := os.Getenv(envKey); key != "" {
		return key
	}
	return fallback
}

// JWTMiddleware checks for a valid JWT token in the Authorization header
func JWTMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		authHeader := r.Header.Get("Authorization")

		// No auth header is provided
		if authHeader == "" {
			http.Error(w, "Authorization header is required", http.StatusUnauthorized)
			return
		}

		// Check for Bearer token format
		tokenParts := strings.Split(authHeader, " ")
		if len(tokenParts) != 2 || tokenParts[0] != "Bearer" {
			http.Error(w, "Authorization header format must be Bearer {token}", http.StatusUnauthorized)
			return
		}

		// Validate JWT token
		claims, err := validateToken(tokenParts[1])
		if err != nil {
			http.Error(w, "Invalid or expired token", http.StatusUnauthorized)
			return
		}

		// Add claims to request context
		ctx := context.WithValue(r.Context(), "userClaims", claims)
		next.ServeHTTP(w, r.WithContext(ctx))
	})
}

// RoleMiddleware checks if the user has the required role
func RoleMiddleware(roles ...string) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			claims, ok := r.Context().Value("userClaims").(*Claims)
			if !ok {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check if user role is in the allowed roles
			allowed := false
			for _, role := range roles {
				if claims.Role == role {
					allowed = true
					break
				}
			}

			if !allowed {
				http.Error(w, "Insufficient permissions", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// GetUserFromContext extracts user claims from the request context
func GetUserFromContext(r *http.Request) (*Claims, error) {
	claims, ok := r.Context().Value("userClaims").(*Claims)
	if !ok {
		return nil, errors.New("no user in context")
	}
	return claims, nil
}

// validateToken validates a JWT token
func validateToken(tokenString string) (*Claims, error) {
	claims := &Claims{}

	token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
		return secretKey, nil
	})

	if err != nil {
		return nil, err
	}

	if !token.Valid {
		return nil, errors.New("invalid token")
	}

	return claims, nil
}
