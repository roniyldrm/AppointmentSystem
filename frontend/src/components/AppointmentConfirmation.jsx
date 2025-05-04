import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Paper,
  Button,
  Divider,
  Alert
} from "@mui/material";
import { CheckCircleOutline } from "@mui/icons-material";

const AppointmentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { appointmentId, doctorName, appointmentTime } = location.state || {};

  useEffect(() => {
    // If the user navigates directly to this page without an appointment
    // redirect them to the booking page
    if (!appointmentId) {
      navigate("/appointment");
    }
    
    // Check authentication
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
  }, [appointmentId, navigate]);

  if (!appointmentId) {
    return null;
  }

  const formatAppointmentTime = (timeString) => {
    try {
      // If it's an ISO date string
      if (timeString.includes('T')) {
        const date = new Date(timeString);
        return date.toLocaleString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      // If it's just a time string like "14:30"
      return timeString;
    } catch (err) {
      return timeString;
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8, mb: 4 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4, 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center'
        }}
      >
        <CheckCircleOutline 
          color="success" 
          sx={{ fontSize: 60, mb: 2 }} 
        />
        
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Appointment Confirmed!
        </Typography>
        
        <Alert severity="success" sx={{ width: '100%', mb: 3 }}>
          Your appointment has been successfully booked.
        </Alert>
        
        <Box sx={{ width: '100%', mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Appointment Details:
          </Typography>
          
          <Divider sx={{ mb: 2 }} />
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Appointment ID:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {appointmentId}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Doctor:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {doctorName || "Not available"}
            </Typography>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="body1" color="text.secondary">
              Date & Time:
            </Typography>
            <Typography variant="body1" fontWeight="medium">
              {formatAppointmentTime(appointmentTime) || "Not available"}
            </Typography>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
          A confirmation email has been sent to your registered email address.
          You can also find this appointment in your profile.
        </Typography>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', mt: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => navigate("/appointment")}
          >
            Book Another
          </Button>
          
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate("/profile")}
          >
            View My Appointments
          </Button>
        </Box>
      </Paper>
    </Container>
  );
};

export default AppointmentConfirmation; 