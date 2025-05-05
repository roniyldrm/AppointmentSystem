import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { format, addDays, parseISO } from "date-fns";
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
  const [expandedHours, setExpandedHours] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Calculate a week of dates from today
  const dateOptions = Array.from({ length: 14 }, (_, i) => {
    const date = addDays(new Date(), i);
    return {
      value: format(date, 'yyyy-MM-dd'),
      label: format(date, 'EEEE, MMMM d, yyyy')
    };
  });
  
  // Fetch doctor information on component mount
  useEffect(() => {
    const fetchDoctor = async () => {
      try {
        setLoading(true);
        const response = await AppointmentService.getDoctor(doctorId);
        setDoctor(response.data);
      } catch (err) {
        setError('Failed to load doctor information. Please try again later.');
        console.error('Error fetching doctor:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDoctor();
  }, [doctorId]);
  
  // Fetch time slots when date changes
  useEffect(() => {
    const fetchTimeSlots = async () => {
      if (!selectedDate || !doctorId) return;
      
      try {
        setLoading(true);
        console.log(`Fetching time slots for doctor ${doctorId} on date ${selectedDate}`);
        const response = await AppointmentService.getDoctorTimeSlots(doctorId, selectedDate);
        console.log("Time slots response:", response.data);
        
        if (Array.isArray(response.data)) {
          setTimeSlots(response.data);
        } else {
          console.error("Response is not an array:", response.data);
          setError("Invalid time slots data received");
          setTimeSlots([]);
        }
        
        // Reset selections when date changes
        setExpandedHours([]);
        setSelectedSlot(null);
      } catch (err) {
        setError('Failed to load available time slots. Please try again later.');
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
        
        <h1 className="text-2xl font-bold text-blue-600 mb-6">Schedule an Appointment</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
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
                <h2 className="text-xl font-semibold text-gray-800">Dr. {doctor.firstName} {doctor.lastName}</h2>
                <p className="text-gray-600">{doctor.fieldName}</p>
                <p className="text-gray-600">{doctor.hospitalName}</p>
              </div>
              
              <div className="mt-4 md:mt-0">
                <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="appointmentDate">
                  Select Date
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
                <p className="text-gray-700 text-lg">No available time slots for this date.</p>
                <p className="text-gray-600 mt-2">Please select another date or try a different doctor.</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Available Time Slots</h3>
                
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
                                  ? 'bg-white text-gray-800 border-gray-300 hover:bg-blue-50'
                                  : 'bg-gray-200 text-gray-500 cursor-not-allowed'
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
                    className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline ${(!selectedSlot || loading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                    onClick={handleBookAppointment}
                    disabled={!selectedSlot || loading}
                  >
                    {loading ? 'Booking...' : 'Book Appointment'}
                  </button>
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