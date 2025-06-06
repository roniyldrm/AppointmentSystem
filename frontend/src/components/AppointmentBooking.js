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

// Field names mapping based on field codes
const fieldNameMap = {
  1: "Internal Medicine",
  2: "Pediatrics",
  3: "Otolaryngology",
  4: "Ophthalmology",
  5: "Gynecology and Obstetrics",
  6: "Orthopedics and Traumatology",
  7: "General Surgery",
  8: "Dermatology",
  9: "Neurology",
  10: "Cardiology"
};

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
  
  // Appointment limit state
  const [appointmentLimit, setAppointmentLimit] = useState(null);
  const [limitLoading, setLimitLoading] = useState(false);

  // Check authentication on load
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found, redirecting to login");
      navigate("/login");
      return;
    }
    
    // Fetch cities when component loads
    fetchCities();
    checkAppointmentLimit();
  }, [navigate]);

  const fetchCities = async () => {
    try {
      console.log("Starting to fetch cities...");
      setLoading(true);
      
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token available for fetching cities");
        setError("Authentication required. Please log in again.");
        navigate("/login");
        return;
      }
      
      console.log("Using token for authentication:", token.substring(0, 10) + "...");
      const response = await AppointmentService.getCities();
      console.log("Cities response:", response);
      
      if (response && response.data) {
        console.log("Cities data:", response.data);
        setCities(response.data);
        
        if (Array.isArray(response.data) && response.data.length === 0) {
          setError("No cities found. The database may be empty.");
        }
      } else {
        console.error("Invalid response format:", response);
        setError("Received invalid data from server");
      }
    } catch (err) {
      console.error("Error fetching cities:", err);
      if (err.response?.status === 401) {
        console.warn("Authentication error (401) - redirecting to login");
        localStorage.removeItem('token'); // Clear invalid token
        navigate("/login"); 
      } else {
        setError(`Failed to fetch cities: ${err.message || 'Unknown error'}`);
      }
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
      console.log("Fields response:", response.data);
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
    // Enable hospital selection as soon as city is selected
    setHospitalEnabled(Boolean(provinceCode));
    setDoctorEnabled(false);
    
    if (provinceCode) {
      try {
        setLoading(true);
        // Fetch districts for the selected city
        fetchDistricts(provinceCode);
        // Fetch fields for the selected city
        fetchFields(provinceCode);
        // Fetch hospitals for the selected city right away
        const response = await AppointmentService.getHospitals(provinceCode);
        setHospitals(response.data);
      } catch (err) {
        setError("Failed to load data. Please try again later.");
        console.error("Error fetching data:", err);
      } finally {
        setLoading(false);
      }
    } else {
      setDistricts([]);
      setFields([]);
      setHospitals([]);
    }
  };
  
  const handleDistrictChange = async (e) => {
    const districtCode = e.target.value;
    setSelectedDistrict(districtCode);
    
    // Reset dependent selections
    setSelectedHospital("");
    setSelectedDoctor("");
    setDoctors([]);
    
    // Keep hospital enabled regardless of district selection
    // Hospital should remain enabled as long as a city is selected
    setHospitalEnabled(Boolean(selectedCity));
    setDoctorEnabled(false);
    
    // If a district is selected, fetch hospitals for that district
    if (districtCode) {
      try {
        setLoading(true);
        const response = await AppointmentService.getHospitals(selectedCity, districtCode);
        setHospitals(response.data);
      } catch (err) {
        setError("Failed to fetch hospitals for district. Please try again.");
        console.error("Error fetching hospitals for district:", err);
      } finally {
        setLoading(false);
      }
    } else {
      // If district is cleared, reload hospitals for the city
      try {
        setLoading(true);
        const response = await AppointmentService.getHospitals(selectedCity);
        setHospitals(response.data);
      } catch (err) {
        setError("Failed to reload hospitals. Please try again.");
        console.error("Error reloading hospitals:", err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  const handleFieldChange = async (e) => {
    const fieldCode = e.target.value;
    setSelectedField(fieldCode);
    
    // Reset dependent selections
    setSelectedHospital("");
    setSelectedDoctor("");
    setDoctors([]);
    
    // Hospital selection should already be enabled from city selection
    setDoctorEnabled(false);
    
    // If both city and field are selected, fetch filtered hospitals
    if (fieldCode && selectedCity) {
      try {
        setLoading(true);
        const response = await AppointmentService.getHospitals(selectedCity, selectedDistrict, fieldCode);
        setHospitals(response.data);
      } catch (err) {
        setError("Failed to fetch hospitals. Please try again.");
        console.error("Error fetching hospitals:", err);
      } finally {
        setLoading(false);
      }
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
    // Enable search if either city and field OR a hospital is selected
    setSearchEnabled(Boolean((selectedCity && selectedField) || selectedHospital));
  };
  
  const handleSearch = async () => {
    try {
      setLoading(true);
      setError("");
      
      const params = {
        provinceCode: selectedCity,
        districtCode: selectedDistrict,
        fieldCode: selectedField,
        hospitalCode: selectedHospital
      };
      
      if (startDate) params.startDate = format(new Date(startDate), "yyyy-MM-dd");
      if (endDate) params.endDate = format(new Date(endDate), "yyyy-MM-dd");
      
      console.log("Search params being sent:", params);
      
      const response = await AppointmentService.getDoctors(params);
      console.log("Doctors search response:", response.data);
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
  
  const handleDoctorSelect = (doctorCode) => {
    // Verify doctorCode exists before navigation
    if (!doctorCode) {
      console.error("Doctor code is undefined or empty");
      setError("Unable to select doctor. Missing doctor ID.");
      return;
    }
    console.log("Navigating to doctor schedule with code:", doctorCode);
    navigate(`/appointment/doctor/${doctorCode}`);
  };

  // Helper function to get field name from field code
  const getFieldName = (fieldCode) => {
    return fieldNameMap[fieldCode] || `Field ${fieldCode}`;
  };

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

  return (
    <div className="app-container">
      <div className="card">
        <div className="card-header">
          <h1 className="page-title">Book Appointment</h1>
          {loading && (
            <span className="inline-block ml-3">
              <i className="fas fa-circle-notch fa-spin text-primary"></i>
            </span>
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
          
          {/* Appointment Limit Info */}
          {appointmentLimit && (
            <div className={`px-4 py-3 rounded-lg mb-4 ${
              appointmentLimit.canBook 
                ? 'bg-blue-50 border border-blue-200 text-blue-700' 
                : 'bg-yellow-50 border border-yellow-200 text-yellow-700'
            }`}>
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className={`fas ${appointmentLimit.canBook ? 'fa-info-circle' : 'fa-exclamation-triangle'} ${
                    appointmentLimit.canBook ? 'text-blue-400' : 'text-yellow-400'
                  }`}></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{appointmentLimit.message}</p>
                  {!appointmentLimit.canBook && (
                    <p className="text-xs mt-1">You cannot continue booking appointments. Please wait for 1 week to pass from one of your old appointments.</p>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {limitLoading && (
            <div className="bg-gray-50 border border-gray-200 px-4 py-3 rounded-lg mb-4">
              <div className="flex">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-3"></div>
                <span className="text-gray-600 text-sm">Checking appointment limit...</span>
              </div>
            </div>
          )}
          
          <form className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* City Selection */}
              <div className="form-group">
                <label htmlFor="city" className="form-label">City <span className="text-red-500">*</span></label>
                <select
                  id="city"
                  value={selectedCity}
                  onChange={handleCityChange}
                  className="form-select"
                  required
                >
                  <option value="">Select City</option>
                  {cities.map((city) => (
                    <option key={city.code} value={city.code}>{city.name}</option>
                  ))}
                </select>
              </div>
              
              {/* District Selection */}
              <div className="form-group">
                <label htmlFor="district" className="form-label">District</label>
                <select
                  id="district"
                  value={selectedDistrict}
                  onChange={handleDistrictChange}
                  className="form-select"
                  disabled={!districtEnabled}
                >
                  <option value="">All Districts</option>
                  {districts.map((district) => (
                    <option key={district.districtCode} value={district.districtCode}>
                      {district.districtName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Field Selection */}
              <div className="form-group">
                <label htmlFor="field" className="form-label">Specialty</label>
                <select
                  id="field"
                  value={selectedField}
                  onChange={handleFieldChange}
                  className="form-select"
                  disabled={!fieldEnabled}
                >
                  <option value="">Select Specialty</option>
                  {Array.isArray(fields) && fields.map((field) => {
                    // If fields are just numbers, fetch the names from the fieldMap
                    if (typeof field === 'number') {
                      return (
                        <option key={field} value={field}>
                          {getFieldName(field)}
                        </option>
                      );
                    }
                    // If fields are objects with fieldCode and fieldName
                    return (
                      <option key={field.fieldCode} value={field.fieldCode}>
                        {field.fieldName}
                      </option>
                    );
                  })}
                </select>
              </div>
              
              {/* Hospital Selection */}
              <div className="form-group">
                <label htmlFor="hospital" className="form-label">Hospital</label>
                <select
                  id="hospital"
                  value={selectedHospital}
                  onChange={handleHospitalChange}
                  className="form-select"
                  disabled={!hospitalEnabled}
                >
                  <option value="">All Hospitals</option>
                  {hospitals.map((hospital) => (
                    <option key={hospital.hospitalCode} value={hospital.hospitalCode}>
                      {hospital.hospitalName}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Date Range */}
              <div className="form-group">
                <label htmlFor="startDate" className="form-label">Start Date</label>
                <input
                  id="startDate"
                  type="date"
                  value={startDate}
                  onChange={handleStartDateChange}
                  className="form-input"
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="endDate" className="form-label">End Date</label>
                <input
                  id="endDate"
                  type="date"
                  value={endDate}
                  onChange={handleEndDateChange}
                  className="form-input"
                  min={startDate || new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
            
            {/* Search Button */}
            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={handleSearch}
                disabled={!searchEnabled || loading}
                className={`btn ${searchEnabled ? 'btn-primary' : 'btn-outline opacity-50 cursor-not-allowed'}`}
              >
                {loading ? (
                  <>
                    <i className="fas fa-circle-notch fa-spin"></i>
                    <span>Searching...</span>
                  </>
                ) : (
                  <>
                    <i className="fas fa-search"></i>
                    <span>Search Doctors</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      {/* Doctors List */}
      {doctors.length > 0 && (
        <div className="mt-8">
          <h2 className="page-subtitle flex items-center mb-6">
            <i className="fas fa-user-md text-primary mr-2"></i>
            <span>Available Doctors</span>
            <span className="ml-2 badge badge-blue">{doctors.length} doctors found</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {doctors.map((doctor) => (
              <div key={doctor.doctorCode || `doctor-${Math.random()}`} className="doctor-card card-hover">
                <div className="doctor-card-header">
                  <div className="doctor-avatar">
                    <i className="fas fa-user-md"></i>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Dr. {doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`}
                  </h3>
                  <p className="text-sm text-primary mt-1">
                    {getFieldName(doctor.fieldCode || doctor.field)}
                  </p>
                </div>
                <div className="doctor-card-body">
                  {doctor.hospitalName && (
                    <div className="flex items-center mb-2 text-sm text-gray-600">
                      <i className="fas fa-hospital mr-2"></i>
                      <span>{doctor.hospitalName}</span>
                    </div>
                  )}
                </div>
                <div className="doctor-card-footer">
                  <button
                    onClick={() => handleDoctorSelect(doctor.doctorCode)}
                    className="btn btn-primary w-full"
                  >
                    <i className="fas fa-calendar-check"></i>
                    <span>Book Appointment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentBooking; 