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
import AppointmentService from '../services/appointment';
import { format } from 'date-fns';

const AppointmentBooking = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // Form state
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [fields, setFields] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [doctors, setDoctors] = useState([]);
  
  // Selected values
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedField, setSelectedField] = useState("");
  const [selectedHospital, setSelectedHospital] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Enabled states for form fields (as per requirements)
  const [districtEnabled, setDistrictEnabled] = useState(false);
  const [fieldEnabled, setFieldEnabled] = useState(false);
  const [hospitalEnabled, setHospitalEnabled] = useState(false);
  const [doctorEnabled, setDoctorEnabled] = useState(false);
  const [searchEnabled, setSearchEnabled] = useState(false);

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
      const response = await AppointmentService.getCities();
      console.log("Cities response:", response.data);
      setCities(response.data);
    } catch (err) {
      setError("Failed to fetch cities. Please try again.");
      console.error("Error fetching cities:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistricts = async (provinceCode) => {
    try {
      setLoading(true);
      const response = await AppointmentService.getDistricts(provinceCode);
      setDistricts(response.data);
    } catch (err) {
      setError("Failed to fetch districts. Please try again.");
      console.error("Error fetching districts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async (provinceCode) => {
    try {
      setLoading(true);
      const response = await AppointmentService.getFields(provinceCode);
      setFields(response.data);
    } catch (err) {
      setError("Failed to fetch fields. Please try again.");
      console.error("Error fetching fields:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHospitals = async (provinceCode, districtCode, fieldCode) => {
    try {
      setLoading(true);
      const response = await AppointmentService.getHospitals(provinceCode, districtCode, fieldCode);
      setHospitals(response.data);
      setHospitalEnabled(true);
    } catch (err) {
      setError("Failed to fetch hospitals. Please try again.");
      console.error("Error fetching hospitals:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      
      const params = {
        hospitalCode: selectedHospital,
        fieldCode: selectedField
      };
      
      const response = await AppointmentService.getDoctors(params);
      setDoctors(response.data);
    } catch (err) {
      setError("Failed to fetch doctors. Please try again.");
      console.error("Error fetching doctors:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleCityChange = async (e) => {
    const provinceCode = e.target.value;
    setSelectedCity(provinceCode);
    
    // Reset all dependent selections
    setSelectedDistrict("");
    setSelectedField("");
    setSelectedHospital("");
    setSelectedDoctor("");
    setHospitals([]);
    setDoctors([]);
    
    // Enable/disable fields
    setDistrictEnabled(Boolean(provinceCode));
    setFieldEnabled(Boolean(provinceCode));
    setHospitalEnabled(false);
    setDoctorEnabled(false);
    
    if (provinceCode) {
      try {
        setLoading(true);
        // Fetch districts for the selected city
        fetchDistricts(provinceCode);
        // Fetch fields for the selected city
        fetchFields(provinceCode);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setDistricts([]);
      setFields([]);
    }
  };
  
  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
    
    // Reset dependent selections
    setSelectedHospital("");
    setSelectedDoctor("");
    setHospitals([]);
    setDoctors([]);
    
    // Enable/disable fields
    setHospitalEnabled(false);
    setDoctorEnabled(false);
    
    // If field is selected, fetch hospitals
    if (selectedField && selectedCity) {
      fetchHospitals(selectedCity, districtCode, selectedField);
    }
  };
  
  const handleFieldChange = async (e) => {
    const fieldCode = e.target.value;
    setSelectedField(fieldCode);
    
    // Reset dependent selections
    setSelectedHospital("");
    setSelectedDoctor("");
    setHospitals([]);
    setDoctors([]);
    
    // Enable hospital selection if city is selected
    setHospitalEnabled(Boolean(fieldCode && selectedCity));
    setDoctorEnabled(false);
    
    if (fieldCode && selectedCity) {
      fetchHospitals(selectedCity, selectedDistrict, fieldCode);
    }
  };
  
  const handleHospitalChange = (e) => {
    const hospitalCode = e.target.value;
    setSelectedHospital(hospitalCode);
    
    // Reset doctor selection
    setSelectedDoctor("");
    setDoctors([]);
    
    // Enable doctor selection if hospital is selected
    setDoctorEnabled(Boolean(hospitalCode));
    
    // Update search button state
    checkSearchEnabled();
  };
  
  const handleStartDateChange = (e) => {
    setStartDate(e.target.value);
    checkSearchEnabled();
  };
  
  const handleEndDateChange = (e) => {
    setEndDate(e.target.value);
    checkSearchEnabled();
  };
  
  const checkSearchEnabled = () => {
    // Enable search if city and field are selected
    setSearchEnabled(Boolean(selectedCity && selectedField));
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        cityCode: selectedCity,
        districtCode: selectedDistrict,
        fieldCode: selectedField,
        hospitalCode: selectedHospital
      };
      
      if (startDate) params.startDate = format(new Date(startDate), "yyyy-MM-dd");
      if (endDate) params.endDate = format(new Date(endDate), "yyyy-MM-dd");
      
      const response = await AppointmentService.getDoctors(params);
      setDoctors(response.data);
      
      if (response.data.length === 0) {
        setError("No doctors found with the selected criteria. Please try different filters.");
      }
    } catch (err) {
      setError("Failed to search for doctors. Please try again later.");
      console.error("Error searching for doctors:", err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDoctorSelect = (doctorId) => {
    navigate(`/appointment/doctor/${doctorId}`);
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
                    <MenuItem key={city.code} value={city.code}>
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
                  <MenuItem value="">All Districts</MenuItem>
                  {districts.map((district) => (
                    <MenuItem key={district.districtCode} value={district.districtCode}>
                      {district.districtName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedCity}>
                <InputLabel>Field</InputLabel>
                <Select
                  value={selectedField}
                  onChange={handleFieldChange}
                  label="Field"
                >
                  <MenuItem value="">Select Specialty</MenuItem>
                  {fields.map((field) => (
                    <MenuItem key={field.fieldCode} value={field.fieldCode}>
                      {field.fieldName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={!selectedHospital}>
                <InputLabel>Hospital</InputLabel>
                <Select
                  value={selectedHospital}
                  onChange={handleHospitalChange}
                  label="Hospital"
                >
                  <MenuItem value="">All Hospitals</MenuItem>
                  {hospitals.map((hospital) => (
                    <MenuItem key={hospital.hospitalCode} value={hospital.hospitalCode}>
                      {hospital.hospitalName}
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
                  onChange={handleStartDateChange}
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
                  onChange={handleEndDateChange}
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
                disabled={!searchEnabled || loading}
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