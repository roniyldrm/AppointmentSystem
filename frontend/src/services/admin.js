import apiClient from './api';

const AdminService = {
  // Location data
  getCities: async () => {
    const response = await apiClient.get('/location/provinces');
    return response.data;
  },
  
  getDistricts: async (provinceCode) => {
    const response = await apiClient.get(`/location/districts/${provinceCode}`);
    return response.data;
  },

  // Get dashboard statistics
  getDashboardStats: async () => {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  },
  
  // User Management
  getAllUsers: async (params = {}) => {
    const { page = 1, limit = 10, role, search } = params;
    let url = `/users?page=${page}&limit=${limit}`;
    
    if (role) url += `&role=${role}`;
    if (search) url += `&search=${search}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },
  
  updateUser: async (userCode, userData) => {
    const response = await apiClient.put(`/user/${userCode}`, userData);
    return response.data;
  },
  
  deleteUser: async (userCode) => {
    const response = await apiClient.delete(`/user/${userCode}`);
    return response.data;
  },

  // Hospital Management
  getHospitals: async (params = {}) => {
    const { page = 1, limit = 50, provinceCode, districtCode, search } = params;
    
    // Priority: districtCode > provinceCode > all hospitals
    if (districtCode) {
      const response = await apiClient.get(`/hospitals/district/${districtCode}`);
      return response.data;
    } else if (provinceCode) {
      const response = await apiClient.get(`/hospitals/${provinceCode}`);
      return response.data;
    } else {
      const response = await apiClient.get('/hospitals');
      return response.data;
    }
  },
  
  createHospital: async (hospitalData) => {
    const response = await apiClient.post('/hospital', hospitalData);
    return response.data;
  },
  
  updateHospital: async (hospitalData) => {
    const response = await apiClient.put('/hospital', hospitalData);
    return response.data;
  },
  
  deleteHospital: async (hospitalCode) => {
    const response = await apiClient.delete(`/hospital/${hospitalCode}`);
    return response.data;
  },

  // Doctor Management
  getDoctors: async (params = {}) => {
    const { page = 1, limit = 50, hospitalCode, field, search } = params;
    
    let doctors;
    if (hospitalCode) {
      const response = await apiClient.get(`/doctors/${hospitalCode}`);
      doctors = response.data;
    } else {
      const response = await apiClient.get('/doctors');
      doctors = response.data;
    }
    
    // Fetch all hospitals once for mapping
    let hospitalsMap = {};
    try {
      const hospitalsResponse = await apiClient.get('/hospitals');
      hospitalsResponse.data.forEach(hospital => {
        hospitalsMap[hospital.hospitalCode] = hospital.hospitalName;
      });
    } catch (error) {
      console.warn('Could not fetch hospitals for mapping:', error);
    }
    
    // Enhance doctors with field names and hospital names
    const enhancedDoctors = doctors.map((doctor) => {
      const enhancedDoctor = { ...doctor };
      
      // Add field name
      const fieldMapping = {
        0: 'Genel Tıp',
        1: 'Kardiyoloji',
        2: 'Nöroloji',
        3: 'Ortopedi',
        4: 'Pediatri',
        5: 'Dermatoloji',
        6: 'Göz Hastalıkları',
        7: 'Kulak Burun Boğaz',
        8: 'Üroloji',
        9: 'Jinekologi'
      };
      
      enhancedDoctor.fieldName = fieldMapping[doctor.field] || fieldMapping[doctor.fieldCode] || 'Unknown';
      
      // Add hospital name from the map
      enhancedDoctor.hospitalName = hospitalsMap[doctor.hospitalCode] || `Hospital ${doctor.hospitalCode}`;
      
      return enhancedDoctor;
    });
    
    return enhancedDoctors;
  },
  
  createDoctor: async (doctorData) => {
    const response = await apiClient.post('/doctor', doctorData);
    return response.data;
  },
  
  updateDoctor: async (doctorCode, doctorData) => {
    // Ensure doctorCode is included in the data
    const dataWithCode = { ...doctorData, doctorCode };
    const response = await apiClient.put('/doctor', dataWithCode);
    return response.data;
  },
  
  deleteDoctor: async (doctorCode) => {
    const response = await apiClient.delete(`/doctor/${doctorCode}`);
    return response.data;
  },

  // Medical Fields - Note: Backend only has province/district specific endpoints
  getFields: async (provinceCode = null, districtCode = null) => {
    // Define field mapping
    const fieldMapping = {
      0: 'Genel Tıp',
      1: 'Kardiyoloji',
      2: 'Nöroloji',
      3: 'Ortopedi',
      4: 'Pediatri',
      5: 'Dermatoloji',
      6: 'Göz Hastalıkları',
      7: 'Kulak Burun Boğaz',
      8: 'Üroloji',
      9: 'Jinekologi'
    };

    if (provinceCode) {
      try {
        const response = await apiClient.get(`/fields/${provinceCode}`);
        // Convert field codes to objects with names
        return response.data.map(fieldCode => ({
          fieldCode: fieldCode,
          fieldName: fieldMapping[fieldCode] || `Field ${fieldCode}`
        }));
      } catch (error) {
        console.error('Error fetching fields for province:', error);
        // Return default fields if API fails
        return Object.entries(fieldMapping).map(([code, name]) => ({
          fieldCode: parseInt(code),
          fieldName: name
        }));
      }
    } else if (districtCode) {
      try {
        const response = await apiClient.get(`/fields/${districtCode}`);
        // Convert field codes to objects with names
        return response.data.map(fieldCode => ({
          fieldCode: fieldCode,
          fieldName: fieldMapping[fieldCode] || `Field ${fieldCode}`
        }));
      } catch (error) {
        console.error('Error fetching fields for district:', error);
        // Return default fields if API fails
        return Object.entries(fieldMapping).map(([code, name]) => ({
          fieldCode: parseInt(code),
          fieldName: name
        }));
      }
    } else {
      // Return all available fields as default
      return Object.entries(fieldMapping).map(([code, name]) => ({
        fieldCode: parseInt(code),
        fieldName: name
      }));
    }
  },

  // Appointment Management
  getAppointments: async (params = {}) => {
    const { page = 1, limit = 10, status, doctorCode, userCode, startDate, endDate } = params;
    let url = `/appointments?page=${page}&limit=${limit}`;
    
    if (status) url += `&status=${status}`;
    if (doctorCode) url += `&doctorCode=${doctorCode}`;
    if (userCode) url += `&userCode=${userCode}`;
    if (startDate) url += `&startDate=${startDate}`;
    if (endDate) url += `&endDate=${endDate}`;
    
    const response = await apiClient.get(url);
    return response.data;
  },
  
  updateAppointment: async (appointmentData) => {
    const response = await apiClient.put('/appointment', appointmentData);
    return response.data;
  },
  
  deleteAppointment: async (appointmentCode) => {
    const response = await apiClient.delete(`/appointment/${appointmentCode}`);
    return response.data;
  },

  // Cancel Request Management
  getCancelRequests: async (params = {}) => {
    const { page = 1, limit = 10, status, doctorCode } = params;
    
    if (doctorCode) {
      const response = await apiClient.get(`/appointment/cancelRequests/${doctorCode}`);
      return response.data;
    } else {
      const response = await apiClient.get('/appointment/cancelRequests');
      return response.data;
    }
  },
  
  updateCancelRequestStatus: async (requestCode, status) => {
    const response = await apiClient.patch(`/appointment/cancelRequests/${requestCode}`, { status });
    return response.data;
  },
  
  deleteCancelRequest: async (requestCode) => {
    const response = await apiClient.delete('/appointment/cancelRequest', { data: { requestCode } });
    return response.data;
  }
};

export default AdminService; 