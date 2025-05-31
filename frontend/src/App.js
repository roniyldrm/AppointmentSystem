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
import UserAccount from './components/UserAccount';

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

  // Bildirim ikonu için stil
  const notificationContainerStyle = {
    marginRight: '16px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  return (
    <nav className="bg-gradient-to-r from-blue-700 to-blue-500 text-white p-4 shadow-lg sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="logo-container flex items-center">
          <span className="logo-text text-2xl">e<span className="text-blue-200">-</span>pulse</span>
        </Link>
        
        <div className="flex items-center space-x-6">
          <Link to="/" className={`nav-link ${location.pathname === '/' ? 'nav-link-active' : ''}`}>
            <i className="fas fa-home mr-1"></i> Ana Sayfa
          </Link>
          
          {isAuthenticated && isPatient && (
            <>
              <Link to="/appointment" className={`nav-link ${location.pathname.startsWith('/appointment') ? 'nav-link-active' : ''}`}>
                <i className="fas fa-calendar-plus mr-1"></i> Randevu Al
              </Link>
              <Link to="/patient/profile" className={`nav-link ${location.pathname === '/patient/profile' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-calendar-check mr-1"></i> Randevularım
              </Link>
              <Link to="/patient/account" className={`nav-link ${location.pathname === '/patient/account' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-user-circle mr-1"></i> Profilim
              </Link>
            </>
          )}
          
          {isAuthenticated && isDoctor && (
            <>
              <Link to="/doctor/appointments" className={`nav-link ${location.pathname === '/doctor/appointments' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-calendar-check mr-1"></i> Randevularım
              </Link>
              <Link to="/doctor/profile" className={`nav-link ${location.pathname === '/doctor/profile' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-user-md mr-1"></i> Profilim
              </Link>
            </>
          )}
          
          {isAuthenticated && isAdmin && (
            <>
              <Link to="/admin/dashboard" className={`nav-link ${location.pathname === '/admin/dashboard' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-tachometer-alt mr-1"></i> Gösterge Paneli
              </Link>
              <Link to="/admin/doctors" className={`nav-link ${location.pathname === '/admin/doctors' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-user-md mr-1"></i> Doktorlar
              </Link>
              <Link to="/admin/hospitals" className={`nav-link ${location.pathname === '/admin/hospitals' ? 'nav-link-active' : ''}`}>
                <i className="fas fa-hospital mr-1"></i> Hastaneler
              </Link>
            </>
          )}
          
          {isAuthenticated && (
            <div className="flex items-center space-x-4">
              <div style={notificationContainerStyle} id="notificationIconContainer">
                <Notifications />
              </div>
              
              <button 
                onClick={logout} 
                className="px-3 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors flex items-center"
              >
                <i className="fas fa-sign-out-alt mr-1"></i> Çıkış
              </button>
            </div>
          )}
          
          {!isAuthenticated && (
            <div className="flex items-center space-x-3">
              <Link to="/login" className="nav-link">
                <i className="fas fa-sign-in-alt mr-1"></i> Giriş
              </Link>
              <Link to="/register" className="px-3 py-2 bg-white text-blue-600 rounded-md hover:bg-blue-50 transition-colors">
                <i className="fas fa-user-plus mr-1"></i> Kayıt Ol
              </Link>
            </div>
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
      <style jsx global>{`
        .nav-link {
          padding: 0.5rem 0.75rem;
          border-radius: 0.375rem;
          transition: all 0.2s;
        }
        .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1);
        }
        .nav-link-active {
          background-color: rgba(255, 255, 255, 0.2);
          font-weight: 500;
        }
        .notification-icon {
          position: relative;
          padding: 0.5rem;
        }
        .notification-icon i {
          font-size: 1.25rem;
          color: white;
        }
      `}</style>
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
          <Route path="/patient/account" element={
            <ProtectedRoute element={<UserAccount />} allowedRoles={['patient']} />
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
        <div className="container mx-auto">
          <div className="flex justify-center items-center mb-3">
            <span className="logo-text text-xl">e<span className="text-blue-400">-</span>pulse</span>
          </div>
          <p className="text-sm text-gray-400">&copy; {new Date().getFullYear()} Hastane Randevu Sistemi. Tüm hakları saklıdır.</p>
        </div>
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
