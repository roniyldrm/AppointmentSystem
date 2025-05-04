import apiClient from './api';

const AppointmentService = {
  // Get all cities
  getCities: async () => {
    return await apiClient.get('/cities');
  },
  
  // Get districts by city
  getDistricts: async (cityCode) => {
    return await apiClient.get(`/districts/${cityCode}`);
  },
  
  // Get fields (specialties/clinics)
  getFields: async () => {
    return await apiClient.get('/fields');
  },
  
  // Get hospitals by city, district and field
  getHospitals: async (cityCode, districtCode = null, fieldCode = null) => {
    let url = `/hospitals?cityCode=${cityCode}`;
    if (districtCode) url += `&districtCode=${districtCode}`;
    if (fieldCode) url += `&fieldCode=${fieldCode}`;
    return await apiClient.get(url);
  },
  
  // Get doctors by various parameters
  getDoctors: async (params) => {
    const { cityCode, districtCode, fieldCode, hospitalCode, startDate, endDate } = params;
    let url = '/doctors?';
    if (cityCode) url += `cityCode=${cityCode}&`;
    if (districtCode) url += `districtCode=${districtCode}&`;
    if (fieldCode) url += `fieldCode=${fieldCode}&`;
    if (hospitalCode) url += `hospitalCode=${hospitalCode}&`;
    if (startDate) url += `startDate=${startDate}&`;
    if (endDate) url += `endDate=${endDate}&`;
    
    return await apiClient.get(url.slice(0, -1)); // Remove last &
  },
  
  // Get doctor by ID
  getDoctor: async (doctorId) => {
    return await apiClient.get(`/doctors/${doctorId}`);
  },
  
  // Get doctor's available time slots
  getDoctorTimeSlots: async (doctorId, date) => {
    return await apiClient.get(`/doctors/${doctorId}/timeslots?date=${date}`);
  },
  
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    return await apiClient.post('/appointments', appointmentData);
  },
  
  // Get user's appointments
  getUserAppointments: async () => {
    return await apiClient.get('/appointments/user');
  },
  
  // Get doctor's appointments
  getDoctorAppointments: async () => {
    return await apiClient.get('/appointments/doctor');
  },
  
  // Get all appointments (admin only)
  getAllAppointments: async () => {
    return await apiClient.get('/appointments');
  },
  
  // Cancel an appointment
  cancelAppointment: async (appointmentId) => {
    return await apiClient.delete(`/appointments/${appointmentId}`);
  },
  
  // Request cancellation (for doctors)
  requestCancellation: async (appointmentId, reason) => {
    return await apiClient.post(`/appointments/${appointmentId}/cancel-request`, { reason });
  }
};

export default AppointmentService; 