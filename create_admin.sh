#!/bin/bash

# Create admin user script
echo "Creating admin user..."

curl -X POST http://localhost:8080/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123",
    "firstName": "System",
    "lastName": "Administrator"
  }'

echo ""
echo "Admin user creation completed!"
echo "Login credentials:"
echo "Email: admin@hospital.com"
echo "Password: admin123" 