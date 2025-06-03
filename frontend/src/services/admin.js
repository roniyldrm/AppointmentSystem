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
    
    try {
      const response = await apiClient.get(url);
      let users = response.data;
      
      // If we don't get an array directly, try to get it from data property
      if (!Array.isArray(users) && users && Array.isArray(users.data)) {
        users = users.data;
      }
      
      // Ensure we have an array
      if (!Array.isArray(users)) {
        users = [];
      }
      
      // Apply client-side filtering if search wasn't handled by backend
      if (search && users.length > 0) {
        const searchLower = search.toLowerCase();
        users = users.filter(user =>
          user.firstName?.toLowerCase().includes(searchLower) ||
          user.lastName?.toLowerCase().includes(searchLower) ||
          user.email?.toLowerCase().includes(searchLower) ||
          user.phone?.toLowerCase().includes(searchLower) ||
          `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase().includes(searchLower)
        );
      }
      
      // Apply role filtering if not handled by backend
      if (role && users.length > 0) {
        users = users.filter(user => user.role === role);
      }
      
      return users;
    } catch (error) {
      console.error('Error fetching users:', error);
      throw error;
    }
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
    
    console.log('=== getHospitals Debug ===');
    console.log('getHospitals called with params:', params);
    console.log('Search term received:', search);
    console.log('Search term type:', typeof search);
    console.log('Search term length:', search ? search.length : 0);
    
    let hospitals;
    
    // Priority: districtCode > provinceCode > all hospitals
    if (districtCode) {
      const response = await apiClient.get(`/hospitals/district/${districtCode}`);
      hospitals = response.data;
      console.log('Fetched hospitals by district:', hospitals.length);
    } else if (provinceCode) {
      const response = await apiClient.get(`/hospitals/${provinceCode}`);
      hospitals = response.data;
      console.log('Fetched hospitals by province:', hospitals.length);
    } else {
      const response = await apiClient.get('/hospitals');
      hospitals = response.data;
      console.log('Fetched all hospitals:', hospitals.length);
    }
    
    // Ensure we have an array
    if (!Array.isArray(hospitals)) {
      console.warn('Hospitals response is not an array:', hospitals);
      hospitals = [];
    }
    
    console.log('Before search filtering:', hospitals.length, 'hospitals');
    
    // Log a sample hospital to see available fields
    if (hospitals.length > 0) {
      console.log('Sample hospital structure:', hospitals[0]);
    }
    
    // Apply client-side search filtering
    if (search && search.trim() !== '' && hospitals.length > 0) {
      const searchLower = search.toLowerCase().trim();
      console.log('Applying search filter with term:', `"${searchLower}"`);
      
      const originalCount = hospitals.length;
      
      hospitals = hospitals.filter(hospital => {
        // Log each hospital being checked
        console.log(`Checking hospital: ${hospital.hospitalName || 'No name'}`);
        
        const matchFields = {
          hospitalName: hospital.hospitalName?.toLowerCase().includes(searchLower),
          hospitalCode: hospital.hospitalCode?.toLowerCase().includes(searchLower),
          address: hospital.address?.toLowerCase().includes(searchLower),
          phone: hospital.phone?.toLowerCase().includes(searchLower),
          cityName: hospital.cityName?.toLowerCase().includes(searchLower),
          districtName: hospital.districtName?.toLowerCase().includes(searchLower)
        };
        
        console.log(`  Match fields for ${hospital.hospitalName}:`, matchFields);
        
        const matches = Object.values(matchFields).some(match => match === true);
        
        if (matches) {
          console.log(`  ✓ Hospital MATCHED: ${hospital.hospitalName}`);
        } else {
          console.log(`  ✗ Hospital did not match: ${hospital.hospitalName}`);
        }
        
        return matches;
      });
      
      console.log(`Search filtering result: ${originalCount} -> ${hospitals.length} hospitals`);
    } else {
      console.log('No search filter applied');
    }
    
    console.log('Final hospital count:', hospitals.length);
    console.log('=== End getHospitals Debug ===');
    return hospitals;
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
    const { page = 1, limit = 50, hospitalCode, field, fieldCode, search } = params;
    
    console.log('=== getDoctors Debug ===');
    console.log('getDoctors called with params:', params);
    console.log('Search term received:', search);
    console.log('Search term type:', typeof search);
    console.log('Search term length:', search ? search.length : 0);
    
    let doctors;
    if (hospitalCode) {
      const response = await apiClient.get(`/doctors/${hospitalCode}`);
      doctors = response.data;
      console.log('Fetched doctors by hospital:', doctors.length);
    } else {
      const response = await apiClient.get('/doctors');
      doctors = response.data;
      console.log('Fetched all doctors:', doctors.length);
    }
    
    // Ensure we have an array
    if (!Array.isArray(doctors)) {
      console.warn('Doctors response is not an array:', doctors);
      doctors = [];
    }
    
    console.log('Before enhancement:', doctors.length, 'doctors');
    
    // Fetch all hospitals once for mapping
    let hospitalsMap = {};
    try {
      const hospitalsResponse = await apiClient.get('/hospitals');
      if (Array.isArray(hospitalsResponse.data)) {
        hospitalsResponse.data.forEach(hospital => {
          hospitalsMap[hospital.hospitalCode] = hospital.hospitalName;
        });
      }
    } catch (error) {
      console.warn('Could not fetch hospitals for mapping:', error);
    }
    
    // Enhance doctors with field names and hospital names
    let enhancedDoctors = doctors.map((doctor) => {
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

    console.log('After enhancement:', enhancedDoctors.length, 'doctors');
    
    // Log a sample doctor to see available fields
    if (enhancedDoctors.length > 0) {
      console.log('Sample doctor structure:', enhancedDoctors[0]);
    }

    // Apply client-side filtering
    if (fieldCode || field) {
      const filterFieldCode = fieldCode || field;
      console.log('Applying field filter:', filterFieldCode);
      const originalCount = enhancedDoctors.length;
      enhancedDoctors = enhancedDoctors.filter(doctor => 
        doctor.field === parseInt(filterFieldCode) || 
        doctor.fieldCode === parseInt(filterFieldCode)
      );
      console.log(`Field filtering: ${originalCount} -> ${enhancedDoctors.length} doctors`);
    }

    if (search && search.trim() !== '' && enhancedDoctors.length > 0) {
      const searchLower = search.toLowerCase().trim();
      console.log('Applying search filter with term:', `"${searchLower}"`);
      
      const originalCount = enhancedDoctors.length;
      
      enhancedDoctors = enhancedDoctors.filter(doctor => {
        // Log each doctor being checked
        console.log(`Checking doctor: ${doctor.doctorName || 'No name'}`);
        
        const matchFields = {
          doctorName: doctor.doctorName?.toLowerCase().includes(searchLower),
          firstName: doctor.firstName?.toLowerCase().includes(searchLower),
          lastName: doctor.lastName?.toLowerCase().includes(searchLower),
          fieldName: doctor.fieldName?.toLowerCase().includes(searchLower),
          hospitalName: doctor.hospitalName?.toLowerCase().includes(searchLower),
          email: doctor.email?.toLowerCase().includes(searchLower),
          phone: doctor.phone?.toLowerCase().includes(searchLower),
          fullName: `${doctor.firstName || ''} ${doctor.lastName || ''}`.toLowerCase().includes(searchLower)
        };
        
        console.log(`  Match fields for ${doctor.doctorName}:`, matchFields);
        
        const matches = Object.values(matchFields).some(match => match === true);
        
        if (matches) {
          console.log(`  ✓ Doctor MATCHED: ${doctor.doctorName}`);
        } else {
          console.log(`  ✗ Doctor did not match: ${doctor.doctorName}`);
        }
        
        return matches;
      });
      
      console.log(`Search filtering result: ${originalCount} -> ${enhancedDoctors.length} doctors`);
    } else {
      console.log('No search filter applied');
    }
    
    console.log('Final doctor count:', enhancedDoctors.length);
    console.log('=== End getDoctors Debug ===');
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
  getAllAppointments: async (limit = 10) => {
    try {
      // Get basic appointments
      const response = await apiClient.get('/appointments');
      let appointments = response.data;

      // Sort by creation date (newest first)
      appointments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      // Apply limit
      if (limit > 0) {
        appointments = appointments.slice(0, limit);
      }

      // Enhance appointments with user and doctor details
      const enhancedAppointments = await Promise.all(
        appointments.map(async (appointment) => {
          try {
            // Get user details
            let patientFirstName = 'Unknown';
            let patientLastName = '';
            let patientEmail = '';
            
            try {
              const userResponse = await apiClient.get(`/user/${appointment.userCode}`);
              const user = userResponse.data;
              patientFirstName = user.userCode; // Using userCode as name for now
              patientEmail = user.email || '';
            } catch (error) {
              console.warn(`Failed to get user details for ${appointment.userCode}:`, error);
            }

            // Get doctor details
            let doctorFirstName = 'Unknown';
            let doctorLastName = '';
            let doctorName = 'Unknown Doctor';
            let hospitalName = 'Unknown Hospital';
            let fieldName = 'Unknown';

            try {
              const doctorResponse = await apiClient.get(`/doctor/${appointment.doctorCode}`);
              const doctor = doctorResponse.data;
              doctorName = doctor.doctorName || 'Unknown Doctor';
              doctorFirstName = doctor.doctorName || 'Unknown';
              
              // Map field codes to names
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
              fieldName = fieldMapping[doctor.fieldCode] || 'Unknown';

              // Get hospital details
              try {
                const hospitalResponse = await apiClient.get(`/hospital/${doctor.hospitalCode}`);
                hospitalName = hospitalResponse.data.hospitalName || 'Unknown Hospital';
              } catch (error) {
                console.warn(`Failed to get hospital details for ${doctor.hospitalCode}:`, error);
              }
            } catch (error) {
              console.warn(`Failed to get doctor details for ${appointment.doctorCode}:`, error);
            }

            // Calculate end time (15 minutes after start time)
            let endTime = '';
            if (appointment.appointmentTime.time) {
              try {
                const [hours, minutes] = appointment.appointmentTime.time.split(':').map(Number);
                const startDate = new Date();
                startDate.setHours(hours, minutes, 0, 0);
                const endDate = new Date(startDate.getTime() + 15 * 60000); // Add 15 minutes
                endTime = endDate.toTimeString().slice(0, 5); // Format as HH:MM
              } catch (error) {
                console.warn('Failed to calculate end time:', error);
              }
            }

            return {
              appointmentId: appointment.appointmentCode,
              appointmentCode: appointment.appointmentCode,
              date: appointment.appointmentTime.date || '',
              startTime: appointment.appointmentTime.time || '',
              endTime: endTime,
              patientFirstName: patientFirstName,
              patientLastName: patientLastName,
              patientEmail: patientEmail,
              doctorFirstName: doctorFirstName,
              doctorLastName: doctorLastName,
              doctorName: doctorName,
              hospitalName: hospitalName,
              fieldName: fieldName,
              status: 'SCHEDULED',
              cancelRequested: false,
              createdAt: appointment.createdAt,
              updatedAt: appointment.updatedAt
            };
          } catch (error) {
            console.error('Error enhancing appointment:', error);
            // Return basic appointment data if enhancement fails
            return {
              appointmentId: appointment.appointmentCode,
              appointmentCode: appointment.appointmentCode,
              date: appointment.appointmentTime.date || '',
              startTime: appointment.appointmentTime.time || '',
              endTime: '',
              patientFirstName: 'Unknown',
              patientLastName: '',
              patientEmail: '',
              doctorFirstName: 'Unknown',
              doctorLastName: '',
              doctorName: 'Unknown Doctor',
              hospitalName: 'Unknown Hospital',
              fieldName: 'Unknown',
              status: 'SCHEDULED',
              cancelRequested: false,
              createdAt: appointment.createdAt,
              updatedAt: appointment.updatedAt
            };
          }
        })
      );

      return enhancedAppointments;
    } catch (error) {
      console.error('Error fetching appointments:', error);
      throw error;
    }
  },

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