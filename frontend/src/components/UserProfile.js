import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  Tabs,
  Tab,
  Divider,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions
} from "@mui/material";
import { CalendarMonth, Person, Cancel } from "@mui/icons-material";

// Custom TabPanel component
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const UserProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [userInfo, setUserInfo] = useState(null);
  const [appointments, setAppointments] = useState([]);
  
  // For confirmation dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [appointmentToCancel, setAppointmentToCancel] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    fetchUserInfo();
    fetchAppointments();
  }, [navigate]);

  const fetchUserInfo = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/profile", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUserInfo(response.data);
    } catch (err) {
      setError("Failed to fetch user information.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/user/appointments", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setAppointments(response.data);
    } catch (err) {
      setError("Failed to fetch appointments.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleCancelAppointment = (appointment) => {
    setAppointmentToCancel(appointment);
    setOpenDialog(true);
  };

  const confirmCancelAppointment = async () => {
    try {
      setLoading(true);
      await axios.delete(`/api/appointments/${appointmentToCancel.id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      
      // Update the appointments list
      setAppointments(appointments.filter(app => app.id !== appointmentToCancel.id));
      setOpenDialog(false);
      setAppointmentToCancel(null);
    } catch (err) {
      setError("Failed to cancel appointment. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
      setOpenDialog(false);
    }
  };

  const filterAppointments = (type) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (type === 'upcoming') {
      return appointments.filter(appointment => {
        const appDate = new Date(appointment.time);
        return appDate >= today;
      }).sort((a, b) => new Date(a.time) - new Date(b.time));
    } else {
      return appointments.filter(appointment => {
        const appDate = new Date(appointment.time);
        return appDate < today;
      }).sort((a, b) => new Date(b.time) - new Date(a.time)); // Past appointments are sorted from most recent
    }
  };

  const formatAppointmentTime = (timeString) => {
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (err) {
      return timeString;
    }
  };

  if (loading && !userInfo) {
    return (
      <Container sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper elevation={3} sx={{ p: 3 }}>
        {userInfo && (
          <Box sx={{ mb: 3 }}>
            <Typography variant="h4" gutterBottom>
              My Profile
            </Typography>
            
            <Grid container spacing={2} sx={{ mt: 2 }}>
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Username:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userInfo.username}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Email:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userInfo.email}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  Full Name:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userInfo.fullName || "Not provided"}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Typography variant="body1" color="text.secondary">
                  User Role:
                </Typography>
                <Typography variant="body1" fontWeight="medium">
                  {userInfo.role === "admin" ? "Administrator" : 
                   userInfo.role === "doctor" ? "Doctor" : "Patient"}
                </Typography>
              </Grid>
            </Grid>
            
            <Button 
              variant="outlined" 
              sx={{ mt: 2 }}
              onClick={() => navigate("/profile/edit")}
            >
              Edit Profile
            </Button>
          </Box>
        )}
        
        <Divider sx={{ my: 3 }} />
        
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange} 
              aria-label="appointment tabs"
              centered
            >
              <Tab icon={<CalendarMonth />} label="Upcoming Appointments" />
              <Tab icon={<Person />} label="Past Appointments" />
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Upcoming Appointments
            </Typography>
            
            {filterAppointments('upcoming').length === 0 ? (
              <Alert severity="info">
                You don't have any upcoming appointments. 
                <Button 
                  color="primary" 
                  size="small" 
                  onClick={() => navigate("/appointment")}
                  sx={{ ml: 1 }}
                >
                  Book Now
                </Button>
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filterAppointments('upcoming').map((appointment) => (
                  <Grid item xs={12} sm={6} key={appointment.id}>
                    <Card elevation={2}>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Dr. {appointment.doctorName}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {appointment.clinic} - {appointment.hospital}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          <strong>Date & Time:</strong> {formatAppointmentTime(appointment.time)}
                        </Typography>
                      </CardContent>
                      <CardActions>
                        <Button 
                          size="small" 
                          color="error" 
                          startIcon={<Cancel />}
                          onClick={() => handleCancelAppointment(appointment)}
                        >
                          Cancel Appointment
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Past Appointments
            </Typography>
            
            {filterAppointments('past').length === 0 ? (
              <Alert severity="info">
                You don't have any past appointments.
              </Alert>
            ) : (
              <Grid container spacing={3}>
                {filterAppointments('past').map((appointment) => (
                  <Grid item xs={12} sm={6} key={appointment.id}>
                    <Card elevation={1} sx={{ opacity: 0.8 }}>
                      <CardContent>
                        <Typography variant="h6" component="div">
                          Dr. {appointment.doctorName}
                        </Typography>
                        <Typography color="text.secondary" gutterBottom>
                          {appointment.clinic} - {appointment.hospital}
                        </Typography>
                        <Typography variant="body2" sx={{ mt: 2 }}>
                          <strong>Date & Time:</strong> {formatAppointmentTime(appointment.time)}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </TabPanel>
        </Box>
      </Paper>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
      >
        <DialogTitle>Cancel Appointment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </DialogContentText>
          {appointmentToCancel && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2">
                <strong>Doctor:</strong> Dr. {appointmentToCancel.doctorName}
              </Typography>
              <Typography variant="body2">
                <strong>Date & Time:</strong> {formatAppointmentTime(appointmentToCancel.time)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>No, Keep It</Button>
          <Button 
            onClick={confirmCancelAppointment} 
            color="error" 
            autoFocus
            disabled={loading}
          >
            {loading ? <CircularProgress size={24} /> : "Yes, Cancel Appointment"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UserProfile; 