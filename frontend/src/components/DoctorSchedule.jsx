import React, { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import axios from "axios";
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
  const location = useLocation();
  const navigate = useNavigate();
  const { startDate, endDate } = location.state || {};

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [doctor, setDoctor] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedHour, setSelectedHour] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchDoctorInfo();
    fetchAvailableSlots();
  }, [doctorId, navigate]);

  const fetchDoctorInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/doctors/${doctorId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setDoctor(response.data);
    } catch (err) {
      setError("Failed to fetch doctor information.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableSlots = async () => {
    try {
      setLoading(true);
      let url = `/api/doctors/${doctorId}/availability`;
      
      if (startDate) {
        url += `?startDate=${startDate}`;
      }
      
      if (endDate) {
        url += `${startDate ? '&' : '?'}endDate=${endDate}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Format the slots data
      const formattedSlots = formatAvailabilityData(response.data);
      setAvailableSlots(formattedSlots);
    } catch (err) {
      setError("Failed to fetch available time slots.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatAvailabilityData = (data) => {
    // This function would transform the API response into a format
    // that's easier to work with in the UI
    // Example output:
    // [
    //   { date: '2023-05-20', hours: [ { hour: '09:00', slots: ['09:00', '09:15', '09:30', '09:45'] } ] },
    //   { date: '2023-05-21', hours: [ { hour: '10:00', slots: ['10:00', '10:15', '10:30', '10:45'] } ] }
    // ]
    
    // For now, let's assume a sample structure
    return data || [];
  };

  const toggleHourSelection = (hourIndex) => {
    if (selectedHour === hourIndex) {
      setSelectedHour(null);
    } else {
      setSelectedHour(hourIndex);
      setSelectedSlot(null);
    }
  };

  const handleSlotSelect = (slot) => {
    if (selectedSlot === slot) {
      setSelectedSlot(null);
    } else {
      setSelectedSlot(slot);
    }
  };

  const handleBookAppointment = async () => {
    if (!selectedSlot) {
      setError("Please select a time slot first.");
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(
        "/api/appointments",
        {
          doctorId: doctorId,
          time: selectedSlot
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      // Navigate to confirmation page
      navigate("/appointment/confirmation", {
        state: {
          appointmentId: response.data.id,
          doctorName: doctor?.name,
          appointmentTime: selectedSlot
        }
      });
    } catch (err) {
      setError(
        err.response?.data?.message || "Failed to book appointment. Please try again."
      );
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !doctor) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {doctor && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              Dr. {doctor.name}
            </Typography>
            <Typography variant="subtitle1" color="text.secondary" gutterBottom>
              {doctor.field} - {doctor.hospital}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}

        <Typography variant="h5" gutterBottom>
          Available Time Slots
        </Typography>

        {availableSlots.length === 0 ? (
          <Alert severity="info">
            No available time slots were found for the selected period.
          </Alert>
        ) : (
          <Box>
            {availableSlots.map((daySlot, dayIndex) => (
              <Box key={dayIndex} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {new Date(daySlot.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Typography>

                <Grid container spacing={2} sx={{ mb: 2 }}>
                  {daySlot.hours.map((hourData, hourIndex) => (
                    <Grid item xs={4} sm={3} md={2} key={hourIndex}>
                      <Button
                        variant={selectedHour === `${dayIndex}-${hourIndex}` ? "contained" : "outlined"}
                        fullWidth
                        onClick={() => toggleHourSelection(`${dayIndex}-${hourIndex}`)}
                        sx={{ mb: 1 }}
                      >
                        {hourData.hour}
                      </Button>
                    </Grid>
                  ))}
                </Grid>

                {selectedHour && selectedHour.startsWith(`${dayIndex}-`) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle1" sx={{ mb: 1 }}>
                      Select time:
                    </Typography>
                    <Grid container spacing={1}>
                      {daySlot.hours[parseInt(selectedHour.split('-')[1])].slots.map(
                        (slot, slotIndex) => (
                          <Grid item xs={3} sm={2} key={slotIndex}>
                            <Card 
                              sx={{ 
                                cursor: 'pointer',
                                bgcolor: selectedSlot === slot ? 'primary.main' : 'background.paper',
                                color: selectedSlot === slot ? 'white' : 'text.primary',
                                '&:hover': {
                                  bgcolor: selectedSlot === slot ? 'primary.dark' : 'action.hover'
                                }
                              }}
                              onClick={() => handleSlotSelect(slot)}
                            >
                              <CardContent sx={{ textAlign: 'center', p: 1, '&:last-child': { pb: 1 } }}>
                                <Typography variant="body2">
                                  {slot.split(':')[1] === '00' ? slot : slot.split(':')[1]}
                                </Typography>
                              </CardContent>
                            </Card>
                          </Grid>
                        )
                      )}
                    </Grid>
                  </Box>
                )}
              </Box>
            ))}

            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                onClick={() => navigate(-1)}
              >
                Back to Doctors
              </Button>
              
              <Button
                variant="contained"
                color="primary"
                disabled={!selectedSlot || loading}
                onClick={handleBookAppointment}
              >
                {loading ? <CircularProgress size={24} /> : "Book Appointment"}
              </Button>
            </Box>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DoctorSchedule; 