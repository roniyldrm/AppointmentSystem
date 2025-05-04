import apiClient from './api';

const AdminService = {
  // Location data
  getCities: async () => {
    return await apiClient.get('/location/provinces');
  },
  
  getDistricts: async (provinceCode) => {
    return await apiClient.get(`/location/districts/${provinceCode}`);
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    return await apiClient.get('/admin/stats');
  },
  
  // User Management
  getAllUsers: async (params = {}) => {
    const { page = 1, limit = 10, role, search } = params;
    let url = `/admin/users?page=${page}&limit=${limit}`;
    
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${search}`;
    
    return await apiClient.get(url);
  },
  
  createUser: async (userData) => {
    return await apiClient.post('/admin/users', userData);
  },
  
  updateUser: async (userId, userData) => {
    return await apiClient.put(`/admin/users/${userId}`, userData);
  },
  
  deleteUser: async (userId) => {
    return await apiClient.delete(`/admin/users/${userId}`);
  },
  
  // Doctor Management
  getAllDoctors: async (params = {}) => {
    const { page = 1, limit = 10, fieldCode, hospitalCode, search } = params;
    let url = `/admin/doctors?page=${page}&limit=${limit}`;
    
    if (fieldCode) url += `&fieldCode=${fieldCode}`;
    if (hospitalCode) url += `&hospitalCode=${hospitalCode}`;
    if (search) url += `&search=${search}`;
    
    return await apiClient.get(url);
  },
  
  createDoctor: async (doctorData) => {
    return await apiClient.post('/admin/doctors', doctorData);
  },
  
  updateDoctor: async (doctorId, doctorData) => {
    return await apiClient.put(`/admin/doctors/${doctorId}`, doctorData);
  },
  
  deleteDoctor: async (doctorId) => {
    return await apiClient.delete(`/admin/doctors/${doctorId}`);
  },
  
  // Hospital Management
  getAllHospitals: async (params = {}) => {
    const { page = 1, limit = 10, cityCode, districtCode, search } = params;
    let url = `/admin/hospitals?page=${page}&limit=${limit}`;
    
    if (cityCode) url += `&cityCode=${cityCode}`;
    if (districtCode) url += `&districtCode=${districtCode}`;
    if (search) url += `&search=${search}`;
    
    return await apiClient.get(url);
  },
  
  createHospital: async (hospitalData) => {
    return await apiClient.post('/admin/hospitals', hospitalData);
  },
  
  updateHospital: async (hospitalCode, hospitalData) => {
    return await apiClient.put(`/admin/hospitals/${hospitalCode}`, hospitalData);
  },
  
  deleteHospital: async (hospitalCode) => {
    return await apiClient.delete(`/admin/hospitals/${hospitalCode}`);
  },
  
  // Appointment Management
  getAllAppointments: async (params = {}) => {
    const { page = 1, limit = 20, status, doctorId, patientId, startDate, endDate } = params;
    let url = `/admin/appointments?page=${page}&limit=${limit}`;
    
    if (status) url += `&status=${status}`;
    if (doctorId) url += `&doctorId=${doctorId}`;
    if (patientId) url += `&patientId=${patientId}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    return await apiClient.get(url);
  },
  
  updateAppointment: async (appointmentId, appointmentData) => {
    return await apiClient.put(`/admin/appointments/${appointmentId}`, appointmentData);
  },
  
  deleteAppointment: async (appointmentId) => {
    return await apiClient.delete(`/admin/appointments/${appointmentId}`);
  },
  
  // Cancellation Requests
  getCancellationRequests: async (params = {}) => {
    const { page = 1, limit = 10, status } = params;
    let url = `/admin/cancellation-requests?page=${page}&limit=${limit}`;
    
    if (status) url += `&status=${status}`;
    
    return await apiClient.get(url);
  },
  
  approveCancellation: async (requestId) => {
    return await apiClient.put(`/admin/cancellation-requests/${requestId}/approve`);
  },
  
  rejectCancellation: async (requestId, reason) => {
    return await apiClient.put(`/admin/cancellation-requests/${requestId}/reject`, { reason });
  }
};

export default AdminService; 