import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationsProvider } from './contexts/NotificationsContext';
import Notifications from './components/Notifications';
import ProtectedRoute from './components/ProtectedRoute';

// Components for all users
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import Unauthorized from './components/Unauthorized';

// Patient components
import AppointmentBooking from './components/AppointmentBooking';
import DoctorSchedule from './components/DoctorSchedule';
import AppointmentConfirmation from './components/AppointmentConfirmation';
import PatientProfile from './components/PatientProfile';

// Doctor components
import DoctorProfile from './components/DoctorProfile';
import DoctorAppointments from './components/DoctorAppointments';

// Admin components
import AdminDashboard from './components/AdminDashboard';
import ManageDoctors from './components/ManageDoctors';
import ManageHospitals from './components/ManageHospitals';
import ManageAppointments from './components/ManageAppointments';

// Navbar Component
const Navbar = () => {
  const { isAuthenticated, isAdmin, isDoctor, isPatient, logout } = useAuth();
  const location = useLocation();

  return (
    <nav className="bg-blue-600 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold">Hospital Appointment System</Link>
        <div className="flex items-center space-x-4">
          <Link to="/" className={`hover:text-blue-200 ${location.pathname === '/' ? 'text-blue-200' : ''}`}>Home</Link>
          
          {isAuthenticated && isPatient && (
            <>
              <Link to="/appointment" className={`hover:text-blue-200 ${location.pathname.startsWith('/appointment') ? 'text-blue-200' : ''}`}>Book Appointment</Link>
              <Link to="/patient/profile" className={`hover:text-blue-200 ${location.pathname === '/patient/profile' ? 'text-blue-200' : ''}`}>My Profile</Link>
            </>
          )}
          
          {isAuthenticated && isDoctor && (
            <>
              <Link to="/doctor/appointments" className={`hover:text-blue-200 ${location.pathname === '/doctor/appointments' ? 'text-blue-200' : ''}`}>My Appointments</Link>
              <Link to="/doctor/profile" className={`hover:text-blue-200 ${location.pathname === '/doctor/profile' ? 'text-blue-200' : ''}`}>My Profile</Link>
            </>
          )}
          
          {isAuthenticated && isAdmin && (
            <>
              <Link to="/admin/dashboard" className={`hover:text-blue-200 ${location.pathname === '/admin/dashboard' ? 'text-blue-200' : ''}`}>Dashboard</Link>
              <Link to="/admin/doctors" className={`hover:text-blue-200 ${location.pathname === '/admin/doctors' ? 'text-blue-200' : ''}`}>Manage Doctors</Link>
              <Link to="/admin/hospitals" className={`hover:text-blue-200 ${location.pathname === '/admin/hospitals' ? 'text-blue-200' : ''}`}>Manage Hospitals</Link>
              <Link to="/admin/appointments" className={`hover:text-blue-200 ${location.pathname === '/admin/appointments' ? 'text-blue-200' : ''}`}>Manage Appointments</Link>
            </>
          )}
          
          {isAuthenticated && (
            <Notifications />
          )}
          
          {isAuthenticated ? (
            <button 
              onClick={logout} 
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100"
            >
              Logout
            </button>
          ) : (
            <>
              <Link to="/login" className={`hover:text-blue-200 ${location.pathname === '/login' ? 'text-blue-200' : ''}`}>Login</Link>
              <Link to="/register" className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-blue-100">Register</Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
};

// Main App component
const AppContent = () => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow">
        <Routes>
          {/* Public routes */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          {/* Patient routes */}
          <Route path="/appointment" element={
            <ProtectedRoute element={<AppointmentBooking />} allowedRoles={['patient']} />
          } />
          <Route path="/appointment/doctor/:doctorId" element={
            <ProtectedRoute element={<DoctorSchedule />} allowedRoles={['patient']} />
          } />
          <Route path="/appointment/confirmation" element={
            <ProtectedRoute element={<AppointmentConfirmation />} allowedRoles={['patient']} />
          } />
          <Route path="/patient/profile" element={
            <ProtectedRoute element={<PatientProfile />} allowedRoles={['patient']} />
          } />
          
          {/* Doctor routes */}
          <Route path="/doctor/profile" element={
            <ProtectedRoute element={<DoctorProfile />} allowedRoles={['doctor']} />
          } />
          <Route path="/doctor/appointments" element={
            <ProtectedRoute element={<DoctorAppointments />} allowedRoles={['doctor']} />
          } />
          
          {/* Admin routes */}
          <Route path="/admin/dashboard" element={
            <ProtectedRoute element={<AdminDashboard />} allowedRoles={['admin']} />
          } />
          <Route path="/admin/doctors" element={
            <ProtectedRoute element={<ManageDoctors />} allowedRoles={['admin']} />
          } />
          <Route path="/admin/hospitals" element={
            <ProtectedRoute element={<ManageHospitals />} allowedRoles={['admin']} />
          } />
          <Route path="/admin/appointments" element={
            <ProtectedRoute element={<ManageAppointments />} allowedRoles={['admin']} />
          } />
        </Routes>
      </main>
      <footer className="bg-gray-800 text-white p-4 text-center">
        <p>&copy; {new Date().getFullYear()} Hospital Appointment System. All rights reserved.</p>
      </footer>
    </div>
  );
};

// Wrapper App component with AuthProvider
const App = () => {
  return (
    <AuthProvider>
      <NotificationsProvider>
        <AppContent />
      </NotificationsProvider>
    </AuthProvider>
  );
};

export default App;
