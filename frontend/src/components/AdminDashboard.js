import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import AppointmentService from '../services/appointment';
import AdminService from '../services/admin';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalAppointments: 0,
    todayAppointments: 0,
    totalDoctors: 0,
    totalHospitals: 0,
    totalPatients: 0,
    cancelRequests: 0
  });
  const [recentAppointments, setRecentAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchDashboardData();
  }, []);
  
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch dashboard stats
      const statsResponse = await AdminService.getDashboardStats();
      setStats(statsResponse.data);
      
      // Fetch recent appointments
      const appointmentsResponse = await AppointmentService.getAllAppointments({ limit: 5 });
      setRecentAppointments(appointmentsResponse.data);
    } catch (err) {
      setError('Failed to load dashboard data. Please try again later.');
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (time) => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Admin Dashboard</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Stats Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Appointments</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalAppointments}</p>
                <p className="text-sm text-gray-500">Total Appointments</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-green-600">{stats.todayAppointments}</p>
                <p className="text-sm text-gray-500">Today</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Doctors & Hospitals</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalDoctors}</p>
                <p className="text-sm text-gray-500">Doctors</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-green-600">{stats.totalHospitals}</p>
                <p className="text-sm text-gray-500">Hospitals</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Patients & Requests</h2>
            <div className="flex justify-between items-end">
              <div>
                <p className="text-3xl font-bold text-blue-600">{stats.totalPatients}</p>
                <p className="text-sm text-gray-500">Registered Patients</p>
              </div>
              <div className="text-right">
                <p className="text-xl font-semibold text-red-600">{stats.cancelRequests}</p>
                <p className="text-sm text-gray-500">Cancel Requests</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Link 
              to="/admin/appointments" 
              className="bg-blue-50 hover:bg-blue-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="font-medium text-gray-800">Manage Appointments</span>
            </Link>
            
            <Link 
              to="/admin/doctors" 
              className="bg-green-50 hover:bg-green-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="font-medium text-gray-800">Manage Doctors</span>
            </Link>
            
            <Link 
              to="/admin/hospitals" 
              className="bg-purple-50 hover:bg-purple-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-purple-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <span className="font-medium text-gray-800">Manage Hospitals</span>
            </Link>
            
            <Link 
              to="/admin/users" 
              className="bg-amber-50 hover:bg-amber-100 p-4 rounded-lg flex flex-col items-center text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-amber-600 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              <span className="font-medium text-gray-800">Manage Users</span>
            </Link>
          </div>
        </div>
        
        {/* Recent Appointments */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-700">Recent Appointments</h2>
            <Link 
              to="/admin/appointments" 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All
            </Link>
          </div>
          
          {recentAppointments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient / Doctor
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hospital
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentAppointments.map((appointment) => (
                    <tr key={appointment.appointmentId}>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {appointment.patientFirstName} {appointment.patientLastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(appointment.date)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.startTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.hospitalName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : appointment.cancelRequested
                            ? 'bg-yellow-100 text-yellow-800'
                            : appointment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.cancelRequested ? 'Cancellation Requested' : appointment.status || 'SCHEDULED'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-500">No recent appointments found.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 