import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, parseISO, isAfter } from "date-fns";
import AppointmentService from "../services/appointment";
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  Divider
} from "@mui/material";

const DoctorSchedule = () => {
  const { doctorId } = useParams();
  const navigate = useNavigate();
  
  const [doctor, setDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [timeSlots, setTimeSlots] = useState([]);
  const [doctorTimeInfo, setDoctorTimeInfo] = useState(null);
  const [expandedHours, setExpandedHours] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({start: null, end: null});
  const [appointmentLimit, setAppointmentLimit] = useState(null);
  const [limitLoading, setLimitLoading] = useState(false);
  
  // Calculate date options based on date range or default to 7 days
  const dateOptions = React.useMemo(() => {
    const today = new Date();
    const maxDays = 30; // Maximum days to show if no range selected
    
    // If we have a date range, use it to determine available dates
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      const dayDiff = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
      
      return Array.from({ length: dayDiff }, (_, i) => {
        const date = addDays(startDate, i);
        return {
          value: format(date, 'yyyy-MM-dd'),
          label: format(date, 'EEEE, d MMMM yyyy')
        };
      });
    }
    
    // Default to showing 7 days starting from today
    return Array.from({ length: 7 }, (_, i) => {
      const date = addDays(today, i);
      return {
        value: format(date, 'yyyy-MM-dd'),
        label: format(date, 'EEEE, d MMMM yyyy')
      };
    });
  }, [dateRange]);
  
  // Check user's appointment limit
  const checkAppointmentLimit = async () => {
    try {
      setLimitLoading(true);
      const userCode = localStorage.getItem('userId');
      if (!userCode) {
        console.warn('No user ID found for appointment limit check');
        return;
      }
      
      const limitInfo = await AppointmentService.checkUserAppointmentLimit(userCode);
      setAppointmentLimit(limitInfo);
      console.log('Appointment limit info:', limitInfo);
    } catch (error) {
      console.error('Error checking appointment limit:', error);
      setAppointmentLimit({ 
        canBook: true, 
        appointmentCount: 0, 
        message: 'Unable to check appointment limit.' 
      });
    } finally {
      setLimitLoading(false);
    }
  };
  
  // Fetch doctor information on component mount
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await AppointmentService.getDoctor(doctorId);
        setDoctor(response.data);
      } catch (err) {
        setError('Error occurred while loading doctor information. Please try again later.');
        console.error('Error fetching doctor:', err);
      } finally {
        setLoading(false);
      }
    };
    
    if (doctorId) {
      fetchDoctor();
      checkAppointmentLimit(); // Check appointment limit when component loads
    }
  }, [doctorId]);
  
  // Fetch time slots when date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate || !doctorId) return;
      
      try {
        setLoading(true);
        setError(''); // Her yeni istek için hata mesajını temizle
        console.log(`Fetching time slots for doctor ${doctorId} on date ${selectedDate}`);
        const response = await AppointmentService.getDoctorTimeSlots(doctorId, selectedDate);
        console.log("Time slots response:", response.data);
        
        // Handle new response format with doctorInfo
        if (response.data && response.data.timeSlots) {
          if (Array.isArray(response.data.timeSlots) && response.data.timeSlots.length === 0) {
            // Eğer dizi boşsa, bu sorun değil - sadece slot yok
            setTimeSlots([]);
          } else {
            setTimeSlots(response.data.timeSlots);
          }
          setDoctorTimeInfo(response.data.doctorInfo);
        } else if (Array.isArray(response.data)) {
          // Handle legacy response format
          setTimeSlots(response.data);
        } else {
          console.error("Invalid response format:", response.data);
          setError("No suitable time slot found. Please select another date.");
          setTimeSlots([]);
        }
        
        // Reset selections when date changes
        setExpandedHours([]);
        setSelectedSlot(null);
      } catch (err) {
        setError('Error occurred while loading time slots. Please try again later.');
        console.error('Error fetching time slots:', err);
        setTimeSlots([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTimeSlots();
  }, [doctorId, selectedDate]);
  
  // Toggle expanded hour
  const toggleHourExpansion = (hour) => {
    if (expandedHours.includes(hour)) {
      setExpandedHours(expandedHours.filter(h => h !== hour));
    } else {
      setExpandedHours([...expandedHours, hour]);
    }
  };
  
  // Handle slot selection
  const handleSlotSelect = (slot) => {
    // If same slot selected, deselect it
    if (selectedSlot && selectedSlot.slotId === slot.slotId) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };
  
  // Handle booking appointment
  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      setError('Please select a time slot to book your appointment.');
      return;
    }
    
    try {
      setLoading(true);
      
      const appointmentData = {
        doctorId: doctorId,
        timeSlot: selectedSlot,
        date: selectedDate
      };
      
      console.log("Sending appointment data:", appointmentData);
      
      const response = await AppointmentService.createAppointment(appointmentData);
      console.log("Appointment creation response:", response);
      
      // Navigate to confirmation page
      navigate('/appointment/confirmation', {
        state: {
          doctor: doctor,
          date: selectedDate,
          timeSlot: selectedSlot
        }
      });
    } catch (err) {
      setError(err.message || 'Failed to book appointment. Please try again later.');
      console.error('Error booking appointment:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Group time slots by hour
  const getHourlySlots = () => {
    const hourlySlots = {};
    
    if (!Array.isArray(timeSlots)) {
      console.error("timeSlots is not an array:", timeSlots);
      return {};
    }
    
    timeSlots.forEach(slot => {
      if (!slot || !slot.startTime) {
        console.error("Invalid slot:", slot);
        return;
      }
      
      const hour = slot.startTime.substring(0, 2);
      if (!hourlySlots[hour]) {
        hourlySlots[hour] = [];
      }
      hourlySlots[hour].push(slot);
    });
    
    return hourlySlots;
  };
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <button 
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center"
        >
          ← Back to Doctor Search
        </button>
        
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Book Appointment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Appointment Limit Info */}
        {appointmentLimit && (
          <div className={`px-4 py-3 rounded mb-4 ${
            appointmentLimit.canBook 
              ? 'bg-blue-50 border border-blue-200 text-blue-700' 
              : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
          }`}>
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <i className={`fas ${appointmentLimit.canBook ? 'fa-info-circle' : 'fa-exclamation-triangle'} ${
                  appointmentLimit.canBook ? 'text-blue-400' : 'text-yellow-400'
                }`}></i>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">{appointmentLimit.message}</p>
                {!appointmentLimit.canBook && (
                  <p className="text-xs mt-1">To be able to book another appointment, wait for 1 week to pass from one of your old appointments.</p>
                )}
              </div>
            </div>
          </div>
        )}
        
        {limitLoading && (
          <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded mb-4">
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
              <span className="text-gray-600 text-sm">Checking appointment limit...</span>
            </div>
          </div>
        )}
        
        {loading && !doctor ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : doctor ? (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
              <div>
                <h2 className="text-xl font-semibold text-gray-800">
                  {doctorTimeInfo && doctorTimeInfo.doctorName 
                    ? `Dr. ${doctorTimeInfo.doctorName}` 
                    : doctor.firstName && doctor.lastName 
                      ? `Dr. ${doctor.firstName} ${doctor.lastName}`
                      : doctor.doctorName 
                        ? `Dr. ${doctor.doctorName}`
                        : "Doktor"}
                </h2>
                <p className="text-gray-600">{doctor.fieldName}</p>
                <p className="text-gray-600">{doctor.hospitalName}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointmentDate">
                  Tarih Seç
                </label>
                <select
                  id="appointmentDate"
                  className="shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline w-full md:w-auto"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  disabled={loading}
                >
                  {dateOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : timeSlots.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-700 text-lg">No available time found for this date.</p>
                <p className="text-gray-600 mt-2">Please select another date or try a different doctor.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Available Times</h3>
                
                <div className="space-y-4">
                  {Object.entries(getHourlySlots()).map(([hour, slots]) => (
                    <div key={hour} className="border rounded-lg overflow-hidden">
                      <button
                        className={`w-full text-left px-4 py-3 font-medium ${expandedHours.includes(hour) ? 'bg-blue-100' : 'bg-gray-100'}`}
                        onClick={() => toggleHourExpansion(hour)}
                      >
                        {formatTime(`${hour}:00`)} - {formatTime(`${parseInt(hour) + 1}:00`)}
                      </button>
                      
                      {expandedHours.includes(hour) && (
                        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-2">
                          {slots.map(slot => (
                            <button
                              key={slot.slotId}
                              className={`py-2 px-3 rounded border ${
                                selectedSlot && selectedSlot.slotId === slot.slotId
                                  ? 'bg-blue-600 text-white border-blue-600'
                                  : slot.available
                                  ? 'bg-blue-500 text-white border-blue-500 hover:bg-blue-600'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-60'
                              }`}
                              onClick={() => slot.available && handleSlotSelect(slot)}
                              disabled={!slot.available || loading}
                            >
                              {formatTime(slot.startTime)}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                
                <div className="mt-6">
                  <button
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${
                      (!selectedSlot || loading || (appointmentLimit && !appointmentLimit.canBook)) ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || loading || (appointmentLimit && !appointmentLimit.canBook)}
                  >
                    {loading ? <span>Booking Appointment...</span> : 
                     (appointmentLimit && !appointmentLimit.canBook) ? <span>Weekly Limit Reached</span> : 
                     <span>Book Appointment</span>}
                  </button>
                  {appointmentLimit && !appointmentLimit.canBook && (
                    <p className="text-sm text-gray-600 mt-2">
                      Your weekly appointment limit is full. Please wait to book a new appointment.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            Doctor not found. Please go back and try again.
          </div>
        )}
      </Paper>
    </Container>
  );
};

export default DoctorSchedule; 