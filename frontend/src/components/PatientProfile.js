import React, { useState, useEffect, useMemo } from 'react';
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
  // Move ALL cancelled appointments to past section (appointment history)
  const upcomingAppointments = Array.isArray(appointments) 
    ? appointments.filter(appointment => {
        if (!appointment) return false;
        
        // Don't show cancelled appointments in upcoming - they go to past
        if (appointment.status && appointment.status.toUpperCase() === 'CANCELLED') {
          return false;
        }
        
        const appointmentDate = appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date);
        
        if (!appointmentDate) {
          // If no date available and not cancelled, don't show
          return false;
        }
        
        try {
          const apptDate = new Date(appointmentDate);
          const today = new Date();
          return apptDate >= today;
        } catch (e) {
          // If date parsing fails and not cancelled, don't show
          return false;
        }
      })
    : [];
  
  const pastAppointments = Array.isArray(appointments)
    ? appointments.filter(appointment => {
        if (!appointment) return false;
        
        // Always show cancelled appointments in past section (appointment history)
        if (appointment.status && appointment.status.toUpperCase() === 'CANCELLED') {
          return true;
        }
        
        const appointmentDate = appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date);
        
        if (!appointmentDate) {
          // If no date available and not cancelled, don't show in past
          return false;
        }
        
        try {
          const apptDate = new Date(appointmentDate);
          const today = new Date();
          return apptDate < today;
        } catch (e) {
          // If date parsing fails and not cancelled, don't show in past
          return false;
        }
      })
    : [];
  
  const displayAppointments = activeTab === 'upcoming' ? upcomingAppointments : pastAppointments;
  
  // Get the appointment status with proper class and date awareness
  const getStatusBadge = (appointment) => {
    const status = appointment.status;
    let badgeClass = 'badge-blue';
    let statusText = 'Planlandı';
    
    // If explicitly cancelled, show cancelled regardless of date
    if (status && status.toUpperCase() === 'CANCELLED') {
      badgeClass = 'badge-red';
      statusText = 'İptal Edildi';
      return <span className={`badge ${badgeClass}`}>{statusText}</span>;
    }
    
    // If explicitly completed, show completed
    if (status && status.toUpperCase() === 'COMPLETED') {
      badgeClass = 'badge-green';
      statusText = 'Tamamlandı';
      return <span className={`badge ${badgeClass}`}>{statusText}</span>;
    }
    
    // Check if appointment is in the past (with safe date handling)
    const appointmentDate = appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date);
    
    if (!appointmentDate) {
      // If no date available, default to scheduled
      badgeClass = 'badge-blue';
      statusText = 'Planlandı';
      return <span className={`badge ${badgeClass}`}>{statusText}</span>;
    }
    
    try {
      const apptDate = new Date(appointmentDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      apptDate.setHours(0, 0, 0, 0);
      
      if (apptDate < today) {
        // Past appointment that hasn't been explicitly cancelled should show as completed
        badgeClass = 'badge-green';
        statusText = 'Tamamlandı';
      } else {
        // Future appointment
        badgeClass = 'badge-blue';
        statusText = 'Planlandı';
      }
    } catch (e) {
      // If date parsing fails, default to scheduled
      console.warn('Failed to parse appointment date:', appointmentDate, e);
      badgeClass = 'badge-blue';
      statusText = 'Planlandı';
    }
    
    return <span className={`badge ${badgeClass}`}>{statusText}</span>;
  };
  
  // Helper function to get field name from field code
  const getFieldNameFromCode = (fieldCode) => {
    if (!fieldCode) return null;
    
    const fieldNameMap = {
      1: "Dahiliye",
      2: "Çocuk Sağlığı ve Hastalıkları",
      3: "Kulak Burun Boğaz Hastalıkları",
      4: "Göz Hastalıkları",
      5: "Kadın Hastalıkları ve Doğum",
      6: "Ortopedi ve Travmatoloji",
      7: "Genel Cerrahi",
      8: "Deri ve Zührevi Hastalıkları",
      9: "Nöroloji",
      10: "Kardiyoloji"
    };
    
    return fieldNameMap[fieldCode] || `Field ${fieldCode}`;
  };
  
  return (
    <div className="app-container">
      <div className="card">
        <div className="card-header">
          <h1 className="page-title">Randevularım</h1>
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
                    <th>Hastane / Alan</th>
                    <th>Tarih & Saat</th>
                    <th>Durum</th>
                    {activeTab === 'upcoming' && <th className="text-right">İşlemler</th>}
                  </tr>
                </thead>
                <tbody>
                  {displayAppointments.map((appointment) => (
                    <tr key={appointment.appointmentId || appointment.appointmentCode} className="hover:bg-gray-50">
                      <td>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            <i className="fas fa-user-md text-primary mr-1"></i>
                            {appointment.doctorFirstName || appointment.doctor?.firstName || appointment.doctor?.doctorName || appointment.doctorName ? (
                              <>
                                Dr. {appointment.doctorFirstName || appointment.doctor?.firstName || ''}
                                {' '}
                                {appointment.doctorLastName || appointment.doctor?.lastName || ''}
                              </>
                            ) : (
                              'Doktor bilgisi bulunamadı'
                            )}
                          </div>
                        </div>
                      </td>
                      
                      <td>
                        <div className="flex flex-col">
                          <div className="text-sm font-medium text-gray-900">
                            <i className="fas fa-hospital text-gray-700 mr-1"></i>
                            {appointment.hospitalName || appointment.hospital?.hospitalName || 'Belirtilmemiş'}
                          </div>
                          
                          {(appointment.fieldName || appointment.doctor?.fieldName || appointment.doctor?.field) && (
                            <div className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full inline-block mt-1 font-medium">
                              <i className="fas fa-stethoscope mr-1"></i>
                              {appointment.fieldName || appointment.doctor?.fieldName || getFieldNameFromCode(appointment.doctor?.field) || 'Genel'}
                            </div>
                          )}
                          
                          {(!appointment.fieldName && !appointment.doctor?.fieldName && !appointment.doctor?.field) && (
                            <div className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full inline-block mt-1 font-medium">
                              <i className="fas fa-stethoscope mr-1"></i>
                              Belirtilmemiş
                            </div>
                          )}
                        </div>
                      </td>
                      
                      <td>
                        <div className="text-sm font-medium">
                          <i className="far fa-calendar-alt text-gray-500 mr-1"></i>
                          {formatDate(appointment.date || (appointment.appointmentTime && appointment.appointmentTime.date))}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          <i className="far fa-clock text-gray-400 mr-1"></i>
                          {formatTime(appointment.startTime || (appointment.appointmentTime && appointment.appointmentTime.time))}
                          {appointment.endTime && ` - ${formatTime(appointment.endTime)}`}
                        </div>
                      </td>
                      
                      <td>
                        {getStatusBadge(appointment)}
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