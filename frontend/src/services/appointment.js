import apiClient from './api';

const AppointmentService = {
  // Get all cities/provinces
  getCities: async () => {
    return await apiClient.get('/location/provinces');
  },
  
  // Get districts by city/province
  getDistricts: async (provinceCode) => {
    return await apiClient.get(`/location/districts/${provinceCode}`);
  },
  
  // Get fields (specialties/clinics)
  getFields: async (provinceCode) => {
    return await apiClient.get(`/fields/${provinceCode}`);
  },
  
  // Get hospitals by province, district and field
  getHospitals: async (provinceCode, districtCode = null, fieldCode = null) => {
    if (districtCode) {
      return await apiClient.get(`/hospitals/district/${districtCode}`);
    } else {
      return await apiClient.get(`/hospitals/${provinceCode}`);
    }
  },
  
  // Get doctors by various parameters
  getDoctors: async (params) => {
    const { hospitalCode } = params;
    
    if (hospitalCode) {
      return await apiClient.get(`/doctors/${hospitalCode}`);
    } else {
      return await apiClient.get('/doctors');
    }
  },
  
  // Get doctor by ID
  getDoctor: async (doctorId) => {
    return await apiClient.get(`/doctor/${doctorId}`);
  },
  
  // Get doctor's available time slots
  getDoctorTimeSlots: async (doctorId, date) => {
    return await apiClient.get(`/doctor/${doctorId}/timeslots?date=${date}`);
  },
  
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    return await apiClient.post('/appointment', appointmentData);
  },
  
  // Get user's appointments
  getUserAppointments: async (userCode) => {
    return await apiClient.get(`/user/${userCode}/appointments`);
  },
  
  // Get user's future appointments
  getUserFutureAppointments: async (userCode) => {
    return await apiClient.get(`/user/${userCode}/appointments/future`);
  },
  
  // Get user's past appointments
  getUserPastAppointments: async (userCode) => {
    return await apiClient.get(`/user/${userCode}/appointments/past`);
  },
  
  // Cancel an appointment
  cancelAppointment: async (appointmentCode) => {
    return await apiClient.delete(`/appointment/${appointmentCode}`);
  },
  
  // Request cancellation (for doctors)
  requestCancellation: async (appointmentId, reason) => {
    return await apiClient.post(`/appointments/${appointmentId}/cancel-request`, { reason });
  }
};

export default AppointmentService; 