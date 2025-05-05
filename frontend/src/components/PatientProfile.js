import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import AppointmentService from '../services/appointment';
import { useAuth } from '../contexts/AuthContext';

const PatientProfile = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
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
      
      // Try multiple possible sources for user ID
      let userIdentifier = null;
      
      // From localStorage directly (most reliable)
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        userIdentifier = storedUserId;
        console.log("Using userId from localStorage:", userIdentifier);
      }
      // From auth context if localStorage failed
      else if (currentUser?.id) {
        userIdentifier = currentUser.id;
        console.log("Using userId from currentUser.id:", userIdentifier);
      }
      // From auth context userCode if available
      else if (currentUser?.userCode) {
        userIdentifier = currentUser.userCode;
        console.log("Using userCode from currentUser:", userIdentifier);
      }
      
      if (!userIdentifier) {
        setError('Kullanıcı kimliği bulunamadı. Lütfen tekrar giriş yapın.');
        console.error('User identifier not found in any source. Current user:', currentUser);
        return;
      }
      
      console.log("Fetching appointments for user:", userIdentifier);
      // Use the enhanced method to get more detailed appointment data
      const response = await AppointmentService.getUserAppointmentsWithDetails(userIdentifier);
      
      if (response && response.data) {
        console.log("Appointments received:", response.data);
        setAppointments(response.data);
      } else {
        console.warn("No appointment data received:", response);
        setAppointments([]);
      }
    } catch (err) {
      setError('Randevularınız yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      console.error('Error fetching appointments:', err);
      console.error('Error details:', err.response || err.message);
      setAppointments([]); // Ensure we have an empty array at minimum
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
  
  // Safely filter appointments by date with null/undefined checking
  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter(appointment => 
        appointment && 
        (appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date)) && 
        new Date(appointment.date || appointment.appointmentTime.date) >= new Date()
      )
    : [];
  
  const pastAppointments = Array.isArray(appointments)
    ? appointments.filter(appointment => 
        appointment && 
        (appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date)) && 
        new Date(appointment.date || appointment.appointmentTime.date) < new Date()
      )
    : [];
  
  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;
  
  // Get the appointment status with proper class
  const getStatusBadge = (status) => {
    let badgeClass = 'badge-blue';
    let statusText = 'Scheduled';
    
    if (!status) {
      return <span className={`badge ${badgeClass}`}>{statusText}</span>;
    }
    
    switch(status.toUpperCase()) {
      case 'CANCELLED':
        badgeClass = 'badge-red';
        statusText = 'İptal Edildi';
        break;
      case 'COMPLETED':
        badgeClass = 'badge-green';
        statusText = 'Tamamlandı';
        break;
      default:
        badgeClass = 'badge-blue';
        statusText = 'Planlandı';
    }
    
    return <span className={`badge ${badgeClass}`}>{statusText}</span>;
  };
  
  return (
    <div className="app-container">
      <div className="card">
        <div className="card-header">
          <h1 className="page-title">Profilim</h1>
          {currentUser && (
            <div className="px-3 py-1 bg-blue-50 rounded-lg text-sm text-gray-700">
              <span className="font-semibold mr-1">Hesap:</span> 
              {currentUser.username || currentUser.id}
            </div>
          )}
        </div>
        
        <div className="card-body">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex -mb-px space-x-4">
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'upcoming'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('upcoming')}
              >
                <i className="fas fa-calendar-day mr-2"></i>
                Yaklaşan Randevular
              </button>
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'past'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('past')}
              >
                <i className="fas fa-history mr-2"></i>
                Geçmiş Randevular
              </button>
            </div>
          </div>
          
          {/* Content */}
          {loading ? (
            <div className="flex justify-center items-center py-16">
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
                <p className="text-gray-500">Randevular yükleniyor...</p>
              </div>
            </div>
          ) : displayAppointments.length === 0 ? (
            <div className="bg-gray-50 rounded-lg py-12 px-4 text-center">
              <div className="mx-auto h-20 w-20 text-gray-400 mb-4">
                <i className="fas fa-calendar-times text-5xl"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">Randevu Bulunamadı</h3>
              <p className="text-gray-500 mb-5">
                {activeTab === 'upcoming'
                  ? 'Yaklaşan randevunuz bulunmuyor. Yeni bir randevu almak ister misiniz?'
                  : 'Geçmiş randevu kaydınız bulunmuyor.'}
              </p>
              {activeTab === 'upcoming' && (
                <button
                  onClick={() => navigate('/appointment')}
                  className="btn btn-primary"
                >
                  <i className="fas fa-calendar-plus mr-2"></i>
                  Randevu Al
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table-modern">
                <thead>
                  <tr>
                    <th>Doktor</th>
                    <th>Tarih & Saat</th>
                    <th>Hastane</th>
                    <th>Durum</th>
                    {activeTab === 'upcoming' && <th className="text-right">İşlemler</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayAppointments.map((appointment) => (
                    <tr key={appointment.appointmentId || appointment.appointmentCode} className="hover:bg-gray-50">
                      <td>
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctorFirstName || appointment.doctor?.firstName || ''}
                            {' '}
                            {appointment.doctorLastName || appointment.doctor?.lastName || ''}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {appointment.fieldName || appointment.doctor?.fieldName || ''}
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="text-sm font-medium">
                          {formatDate(appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date))}
                        </div>
                        <div className="text-xs text-gray-500">
                          {formatTime(appointment.startTime || (appointment.appointmentTime && appointment.appointmentTime.time))}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </div>
                      </td>
                      
                      <td>
                        <div className="text-sm">
                          {appointment.hospitalName || appointment.hospital?.hospitalName || ''}
                        </div>
                      </td>
                      
                      <td>
                        {getStatusBadge(appointment.status)}
                      </td>
                      
                      {activeTab === 'upcoming' && (
                        <td className="text-right">
                          {appointment.status !== 'CANCELLED' && (
                            <button
                              onClick={() => handleCancelAppointment(appointment.appointmentId || appointment.appointmentCode)}
                              disabled={cancellingId === (appointment.appointmentId || appointment.appointmentCode)}
                              className={`text-sm text-red-600 hover:text-red-900 font-medium ${
                                cancellingId === (appointment.appointmentId || appointment.appointmentCode) 
                                  ? 'opacity-50 cursor-not-allowed' 
                                  : ''
                              }`}
                            >
                              {cancellingId === (appointment.appointmentId || appointment.appointmentCode) ? (
                                <span className="flex items-center">
                                  <i className="fas fa-circle-notch fa-spin mr-1"></i>
                                  İptal Ediliyor...
                                </span>
                              ) : (
                                <span className="flex items-center">
                                  <i className="fas fa-times-circle mr-1"></i>
                                  İptal Et
                                </span>
                              )}
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
        
        <div className="card-footer flex justify-between items-center">
          <button 
            onClick={() => navigate('/')} 
            className="btn btn-outline"
          >
            <i className="fas fa-arrow-left mr-1"></i>
            Ana Sayfa
          </button>
          
          {activeTab === 'upcoming' && (
            <button 
              onClick={() => navigate('/appointment')} 
              className="btn btn-primary"
            >
              <i className="fas fa-calendar-plus mr-1"></i>
              Yeni Randevu
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientProfile; 