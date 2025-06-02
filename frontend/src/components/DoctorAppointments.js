import React, { useState, useEffect, useMemo } from 'react';
import { format } from 'date-fns';
import AppointmentService from '../services/appointment';

const DoctorAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('upcoming');
  const [cancelRequestingId, setCancelRequestingId] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  
  useEffect(() => {
    fetchAppointments();
  }, []);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await AppointmentService.getDoctorAppointments();
      setAppointments(response.data);
    } catch (err) {
      setError('Failed to load your appointments. Please try again later.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCancelRequest = (appointmentId) => {
    setSelectedAppointmentId(appointmentId);
    setShowCancelModal(true);
  };
  
  const handleCancelModalClose = () => {
    setShowCancelModal(false);
    setCancelReason('');
    setSelectedAppointmentId(null);
  };
  
  const submitCancelRequest = async () => {
    if (!cancelReason.trim()) {
      return;
    }
    
    try {
      setCancelRequestingId(selectedAppointmentId);
      await AppointmentService.requestCancellation(selectedAppointmentId, cancelReason);
      
      // Update the appointment status in the list (or fetch again)
      setAppointments(appointments.map(app => 
        app.appointmentId === selectedAppointmentId 
          ? {...app, cancelRequested: true, cancelReason: cancelReason}
          : app
      ));
      
      handleCancelModalClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to request cancellation. Please try again later.');
      console.error('Error requesting cancellation:', err);
    } finally {
      setCancelRequestingId(null);
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
  
  // Safely calculate today's date once outside render loop
  const today = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now;
  }, []);

  // Helper function to determine appointment display status (memoized)
  const getAppointmentDisplayStatus = useMemo(() => {
    return (appointment) => {
      // If explicitly cancelled, show cancelled
      if (appointment.status === 'CANCELLED') {
        return { text: 'CANCELLED', style: 'bg-red-100 text-red-800' };
      }
      
      // If cancellation requested, show that
      if (appointment.cancelRequested) {
        return { text: 'Cancellation Requested', style: 'bg-yellow-100 text-yellow-800' };
      }
      
      // If explicitly completed, show completed
      if (appointment.status === 'COMPLETED') {
        return { text: 'COMPLETED', style: 'bg-green-100 text-green-800' };
      }
      
      // For past appointments that haven't been explicitly set to completed/cancelled
      const appointmentDate = new Date(appointment.date);
      appointmentDate.setHours(0, 0, 0, 0);
      
      if (appointmentDate < today) {
        return { text: 'COMPLETED', style: 'bg-green-100 text-green-800' };
      }
      
      // For upcoming appointments
      return { text: appointment.status || 'SCHEDULED', style: 'bg-blue-100 text-blue-800' };
    };
  }, [today]);

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
              <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
              <p className="text-gray-600 mt-1">View and manage your patient appointments</p>
            </div>
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
                You have no {activeTab} appointments.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Patient
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
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
                              {appointment.patientFirstName} {appointment.patientLastName}
                            </div>
                            {appointment.patientEmail && (
                              <div className="text-sm text-gray-500">{appointment.patientEmail}</div>
                            )}
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
                        {(() => {
                          const statusInfo = getAppointmentDisplayStatus(appointment);
                          return (
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.style}`}>
                              {statusInfo.text}
                            </span>
                          );
                        })()}
                      </td>
                      {activeTab === 'upcoming' && (
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          {!appointment.cancelRequested && appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelRequest(appointment.appointmentId)}
                              className={`text-red-600 hover:text-red-900 ${
                                cancelRequestingId === appointment.appointmentId ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                              disabled={cancelRequestingId === appointment.appointmentId}
                            >
                              Request Cancellation
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
      
      {/* Cancel Request Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Request Appointment Cancellation</h3>
              <p className="text-sm text-gray-600 mb-4">
                Please provide a reason for requesting the cancellation. This will be reviewed by administrators.
              </p>
              
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="cancelReason">
                  Reason for Cancellation*
                </label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  rows="3"
                  placeholder="Please provide a detailed reason..."
                  required
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                  onClick={handleCancelModalClose}
                >
                  Cancel
                </button>
                <button
                  className={`bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded ${
                    !cancelReason.trim() ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  onClick={submitCancelRequest}
                  disabled={!cancelReason.trim() || cancelRequestingId}
                >
                  {cancelRequestingId ? 'Submitting...' : 'Submit Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DoctorAppointments; 