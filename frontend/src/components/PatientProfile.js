import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppointmentService from '../services/appointment';
import { useAuth } from '../contexts/AuthContext';

const PatientProfile = () => {
  const { currentUser } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await AppointmentService.getUserAppointments();
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load your appointments. Please try again later.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelAppointment = async (appointmentId) => {
    try {
      setCancellingId(appointmentId);
      await AppointmentService.cancelAppointment(appointmentId);
      
      // Update the appointments list
      fetchAppointments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to cancel appointment. Please try again later.');
      console.error('Error cancelling appointment:', err);
    } finally {
      setCancellingId(null);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'EEEE, MMMM d, yyyy');
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
  
  // Filter appointments by date
  const upcomingAppointments = appointments.filter(
    appointment => new Date(appointment.date) >= new Date()
  );
  
  const pastAppointments = appointments.filter(
    appointment => new Date(appointment.date) < new Date()
  );
  
  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
              <p className="text-gray-600 mt-1">Manage your appointments and personal information</p>
            </div>
            
            {currentUser && (
              <div className="mt-4 sm:mt-0 px-4 py-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Logged in as:</span> {currentUser.username || currentUser.id}
                </p>
              </div>
            )}
          </div>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          <div className="mb-6">
            <div className="border-b border-gray-200">
              <div className="flex -mb-px">
                <button
                  className={`mr-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'upcoming'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('upcoming')}
                >
                  Upcoming Appointments
                </button>
                <button
                  className={`ml-1 py-2 px-4 text-sm font-medium ${
                    activeTab === 'past'
                      ? 'text-blue-600 border-b-2 border-blue-500'
                      : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                  onClick={() => setActiveTab('past')}
                >
                  Past Appointments
                </button>
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : displayAppointments.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {activeTab === 'upcoming'
                  ? 'You have no upcoming appointments. Would you like to book one?'
                  : 'You have no past appointments.'}
              </p>
              {activeTab === 'upcoming' && (
                <div className="mt-6">
                  <a
                    href="/appointment"
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Book Appointment
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
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
                    {activeTab === 'upcoming' && (
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    )}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {displayAppointments.map((appointment) => (
                    <tr key={appointment.appointmentId}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                            </div>
                            <div className="text-sm text-gray-500">{appointment.fieldName}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{formatDate(appointment.date)}</div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{appointment.hospitalName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          appointment.status === 'CANCELLED'
                            ? 'bg-red-100 text-red-800'
                            : appointment.status === 'COMPLETED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {appointment.status || 'SCHEDULED'}
                        </span>
                      </td>
                      {activeTab === 'upcoming' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.appointmentId)}
                              className={`text-red-600 hover:text-red-900 ${
                                cancellingId === appointment.appointmentId ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={cancellingId === appointment.appointmentId}
                            >
                              {cancellingId === appointment.appointmentId ? 'Cancelling...' : 'Cancel'}
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile; 