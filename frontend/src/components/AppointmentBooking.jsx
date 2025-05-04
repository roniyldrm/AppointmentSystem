import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { 
  Container, 
  Typography, 
  Box, 
  FormControl, 
  InputLabel, 
  MenuItem, 
  Select, 
  Button, 
  CircularProgress,
  Alert,
  Paper,
  Grid
} from "@mui/material";

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [clinics, setClinics] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Selected values
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("all");
  const [selectedClinic, setSelectedClinic] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    }
    
    // Fetch cities when component loads
    fetchCities();
  }, [navigate]);

  const fetchCities = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/cities", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setCities(response.data);
    } catch (err) {
      setError("Failed to fetch cities. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (cityId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/districts?cityId=${cityId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setDistricts(response.data);
    } catch (err) {
      setError("Failed to fetch districts. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async (cityId, districtId = null) => {
    try {
      setLoading(true);
      let url = `/api/clinics?cityId=${cityId}`;
      if (districtId && districtId !== "all") {
        url += `&districtId=${districtId}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setClinics(response.data);
    } catch (err) {
      setError("Failed to fetch clinics. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async (cityId, districtId = null, clinicId = null) => {
    try {
      setLoading(true);
      let url = `/api/hospitals?cityId=${cityId}`;
      
      if (districtId && districtId !== "all") {
        url += `&districtId=${districtId}`;
      }
      
      if (clinicId) {
        url += `&clinicId=${clinicId}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setHospitals(response.data);
    } catch (err) {
      setError("Failed to fetch hospitals. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      let url = "/api/doctors?";
      
      if (selectedHospital) {
        url += `hospitalCode=${selectedHospital}`;
      }
      
      if (selectedClinic) {
        url += `&fieldCode=${selectedClinic}`;
      }
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setDoctors(response.data);
    } catch (err) {
      setError("Failed to fetch doctors. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCityChange = (e) => {
    const cityId = e.target.value;
    setSelectedCity(cityId);
    setSelectedDistrict("all");
    setSelectedClinic("");
    setSelectedHospital("");
    setSelectedDoctor("");
    
    // Reset dependent dropdowns
    setDistricts([]);
    setClinics([]);
    setHospitals([]);
    setDoctors([]);
    
    // Fetch districts and clinics based on selected city
    fetchDistricts(cityId);
    fetchClinics(cityId);
  };
  
  const handleDistrictChange = (e) => {
    const districtId = e.target.value;
    setSelectedDistrict(districtId);
    setSelectedClinic("");
    setSelectedHospital("");
    setSelectedDoctor("");
    
    // Reset dependent dropdowns
    setClinics([]);
    setHospitals([]);
    setDoctors([]);
    
    // Fetch clinics based on selected city and district
    fetchClinics(selectedCity, districtId);
  };
  
  const handleClinicChange = (e) => {
    const clinicId = e.target.value;
    setSelectedClinic(clinicId);
    setSelectedHospital("");
    setSelectedDoctor("");
    
    // Reset dependent dropdowns
    setHospitals([]);
    setDoctors([]);
    
    // Fetch hospitals based on selected city, district and clinic
    fetchHospitals(selectedCity, selectedDistrict, clinicId);
  };
  
  const handleHospitalChange = (e) => {
    const hospitalId = e.target.value;
    setSelectedHospital(hospitalId);
    setSelectedDoctor("");
    
    // Reset dependent dropdown
    setDoctors([]);
  };
  
  const handleSearch = () => {
    fetchDoctors();
  };
  
  const handleDoctorSelect = (doctorId) => {
    navigate(`/appointment/doctor/${doctorId}`, { 
      state: { 
        doctorId,
        startDate,
        endDate
      } 
    });
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom align="center">
          Book an Appointment
        </Typography>
        
        {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}
        
        <Box component="form" sx={{ mt: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>City</InputLabel>
                <Select
                  value={selectedCity}
                  onChange={handleCityChange}
                  label="City"
                >
                  {cities.map((city) => (
                    <MenuItem key={city.id} value={city.id}>
                      {city.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedCity}>
                <InputLabel>District</InputLabel>
                <Select
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  label="District"
                >
                  <MenuItem value="all">All Districts</MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district.id} value={district.id}>
                      {district.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedCity}>
                <InputLabel>Clinic</InputLabel>
                <Select
                  value={selectedClinic}
                  onChange={handleClinicChange}
                  label="Clinic"
                >
                  {clinics.map((clinic) => (
                    <MenuItem key={clinic.fieldCode} value={clinic.fieldCode}>
                      {clinic.fieldName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedClinic}>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={selectedHospital}
                  onChange={handleHospitalChange}
                  label="Hospital"
                >
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.code} value={hospital.code}>
                      {hospital.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>Start Date</InputLabel>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  style={{ 
                    padding: '16.5px 14px',
                    marginTop: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px'
                  }}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel shrink>End Date</InputLabel>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  style={{ 
                    padding: '16.5px 14px',
                    marginTop: '16px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px'
                  }}
                />
              </FormControl>
            </Grid>
            
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleSearch}
                disabled={!selectedClinic || !selectedHospital || loading}
                fullWidth
              >
                {loading ? <CircularProgress size={24} /> : "Search for Doctors"}
              </Button>
            </Grid>
          </Grid>
        </Box>
        
        {doctors.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>
              Available Doctors
            </Typography>
            <Grid container spacing={2}>
              {doctors.map((doctor) => (
                <Grid item xs={12} sm={6} md={4} key={doctor.id}>
                  <Paper
                    elevation={2}
                    sx={{
                      p: 2,
                      textAlign: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      '&:hover': {
                        transform: 'translateY(-5px)',
                        boxShadow: 6
                      }
                    }}
                    onClick={() => handleDoctorSelect(doctor.id)}
                  >
                    <Typography variant="h6">{doctor.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {doctor.field}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default AppointmentBooking; 