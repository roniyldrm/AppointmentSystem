# Admin Setup Guide

## Overview
This guide explains how to set up and use the admin functionality in the Hospital Appointment System.

## Features Added

### Backend Changes
1. **New Admin API (`api/admin.go`)**:
   - Dashboard statistics endpoint
   - Admin user management functions
   - System health monitoring

2. **Enhanced Routes in `main.go`**:
   - `/api/admin/stats` - Get dashboard statistics
   - `/api/admin/create` - Create admin user (temporary endpoint)

3. **Admin Authentication**:
   - Role-based access control
   - JWT token validation for admin routes

### Frontend Changes
1. **New AdminLogin Component**:
   - Dedicated admin login page with red theme
   - Role validation (ensures only admin users can access)
   - Located at `/admin/login`

2. **Enhanced Login Component**:
   - Added "Admin Girişi" link next to registration link
   - Maintains existing functionality for regular users

3. **Admin Dashboard Integration**:
   - Displays system statistics
   - Quick action buttons for management
   - Recent appointments overview

4. **Navigation Updates**:
   - Admin-specific navigation menu
   - Role-based menu visibility

## Setup Instructions

### 1. Start the Backend
```bash
cd Appointment-System/backend
go run main.go
```

### 2. Create an Admin User
Run the provided script to create an admin user:
```bash
chmod +x create_admin.sh
./create_admin.sh
```

Or manually create using curl:
```bash
curl -X POST http://localhost:8080/api/admin/create \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@hospital.com",
    "password": "admin123",
    "firstName": "System",
    "lastName": "Administrator"
  }'
```

### 3. Start the Frontend
```bash
cd Appointment-System/frontend
npm start
```

### 4. Access Admin Panel
1. Go to `http://localhost:3000/admin/login`
2. Login with:
   - Email: `admin@hospital.com`
   - Password: `admin123`

## Admin Features

### Dashboard
- **Statistics Overview**: Total appointments, doctors, hospitals, patients
- **Today's Appointments**: Real-time count of today's appointments
- **Cancel Requests**: Pending cancellation requests
- **Quick Actions**: Direct links to management pages

### Navigation
When logged in as admin, you'll see:
- **Gösterge Paneli** (Dashboard)
- **Doktorlar** (Doctors Management)
- **Hastaneler** (Hospitals Management)

### Security
- Admin routes are protected by JWT middleware
- Role-based access control ensures only admin users can access admin features
- Separate login flow for admin users

## API Endpoints

### Admin Statistics
```
GET /api/admin/stats
Authorization: Bearer <admin_jwt_token>
```

Response:
```json
{
  "data": {
    "totalAppointments": 150,
    "todayAppointments": 12,
    "totalDoctors": 25,
    "totalHospitals": 8,
    "totalPatients": 200,
    "cancelRequests": 3
  }
}
```

### Create Admin User (Temporary)
```
POST /api/admin/create
Content-Type: application/json

{
  "email": "admin@example.com",
  "password": "password123",
  "firstName": "Admin",
  "lastName": "User"
}
```

## Notes

1. **Security**: The `/api/admin/create` endpoint is temporary for testing. In production, remove this endpoint and create admin users through a secure process.

2. **Database**: Admin users are stored in the same `users` collection with `role: "admin"`.

3. **Frontend Routing**: Admin routes are protected and will redirect unauthorized users to the login page.

4. **Styling**: Admin login page uses a red theme to distinguish it from regular user login.

## Troubleshooting

### Backend Issues
- Ensure MongoDB is running
- Check that port 8080 is available
- Verify JWT secret keys are set

### Frontend Issues
- Ensure backend is running on port 8080
- Check browser console for API errors
- Verify admin user exists in database

### Authentication Issues
- Check that admin user has `role: "admin"` in database
- Verify JWT token is being sent with requests
- Ensure admin routes are properly protected 