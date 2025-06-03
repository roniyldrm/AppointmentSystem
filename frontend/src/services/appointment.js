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
  
  // Get all fields for a district code  
  getFieldsByDistrict: async (districtCode) => {
    return await apiClient.get(`/fields/district/${districtCode}`);
  },
  
  // Get hospitals by province, district and field
  getHospitals: async (provinceCode, districtCode = null, fieldCode = null) => {
    let url = `/hospitals/${provinceCode}`;
    
    // Add district if provided
    if (districtCode) {
      url = `/hospitals/district/${districtCode}`;
    }
    
    const params = new URLSearchParams();
    if (fieldCode) params.append('field', fieldCode);
    
    if (params.toString()) {
      url += `?${params.toString()}`;
    }
    
    return await apiClient.get(url);
  },
  
  // Get all hospitals
  getAllHospitals: async () => {
    return await apiClient.get('/hospitals');
  },
  
  // Get doctors by various parameters
  getDoctors: async (params = {}) => {
    console.log("Getting doctors with params:", params);
    const { hospitalCode, fieldCode, provinceCode, districtCode, startDate, endDate } = params;
    
    try {
      let url = '/doctors';
      
      // If hospitalCode is provided, get doctors for that hospital
      if (hospitalCode) {
        url = `/doctors/${hospitalCode}`;
      }
      
      // Add query parameters for filtering if needed
      const queryParams = new URLSearchParams();
      if (provinceCode) queryParams.append('provinceCode', provinceCode);
      if (districtCode) queryParams.append('districtCode', districtCode);
      if (fieldCode) queryParams.append('fieldCode', fieldCode);
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      
      // Convert field filtering from server-side to client-side if needed
      // since the server endpoint may not support field filtering directly
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
      
      console.log("Making API request to:", url);
      const response = await apiClient.get(url);
      
      // If fieldCode is provided but server doesn't handle filtering,
      // filter the results on the client side
      if (fieldCode && response.data && Array.isArray(response.data)) {
        console.log("Filtering doctors by field code:", fieldCode);
        const filtered = response.data.filter(doctor => 
          doctor.fieldCode === parseInt(fieldCode) || 
          doctor.field === parseInt(fieldCode)
        );
        console.log(`Found ${filtered.length} doctors with field ${fieldCode} out of ${response.data.length} total`);
        return { ...response, data: filtered };
      }
      
      return response;
    } catch (error) {
      console.error("Error fetching doctors:", error);
      throw error;
    }
  },
  
  // Get all doctors  
  getAllDoctors: async () => {
    return await apiClient.get('/doctors');
  },
  
  // Get doctor by ID
  getDoctor: async (doctorId) => {
    return await apiClient.get(`/doctor/${doctorId}`);
  },
  
  // Get doctor's available time slots
  getDoctorTimeSlots: async (doctorId, date) => {
    return await apiClient.get(`/doctor/${doctorId}/timeslots?date=${date}`);
  },
  
  // Check if user can make a new appointment (weekly limit validation)
  checkUserAppointmentLimit: async (userCode) => {
    try {
      console.log(`Checking appointment limit for user ${userCode}`);
      
      if (!userCode) {
        throw new Error('User ID not found. Please login again.');
      }
      
      // Get user's appointments from the last 7 days
      const response = await apiClient.get(`/user/${userCode}/appointments`);
      
      if (!Array.isArray(response.data)) {
        console.log('No appointments found or invalid response format');
        return { canBook: true, appointmentCount: 0, message: '' };
      }
      
      // Filter appointments from the last 7 days
      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
      
      const recentAppointments = response.data.filter(appointment => {
        if (!appointment.createdAt) return false;
        const createdDate = new Date(appointment.createdAt);
        return createdDate >= oneWeekAgo;
      });
      
      const appointmentCount = recentAppointments.length;
      console.log(`User has ${appointmentCount} appointments in the last 7 days`);
      
      if (appointmentCount >= 3) {
        return { 
          canBook: false, 
          appointmentCount, 
          message: 'Haftalık randevu sınırına ulaştınız (3 randevu). Yeni randevu alabilmek için bir hafta beklemeniz gerekmektedir.' 
        };
      }
      
      return { 
        canBook: true, 
        appointmentCount, 
        message: `Bu hafta ${appointmentCount}/3 randevu kullandınız.` 
      };
      
    } catch (error) {
      console.error('Error checking appointment limit:', error);
      // In case of error, allow booking but warn user
      return { 
        canBook: true, 
        appointmentCount: 0, 
        message: 'Randevu sınırı kontrol edilemedi.' 
      };
    }
  },
  
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    // Transform the data to match the backend API expectations
    console.log("Original appointment data:", appointmentData);
    
    // Get user info from localStorage
    const userCode = localStorage.getItem('userId');
    if (!userCode) {
      throw new Error('User ID not found. Please login again.');
    }
    
    // Check appointment limit before proceeding
    const limitCheck = await AppointmentService.checkUserAppointmentLimit(userCode);
    if (!limitCheck.canBook) {
      throw new Error(limitCheck.message);
    }
    
    // Get selected time from the slot
    const timeSlot = appointmentData.timeSlot || { startTime: "09:00" };
    
    // Create the properly formatted appointment object
    const formattedAppointment = {
      doctorCode: appointmentData.doctorId,  // Backend expects doctorCode not doctorId
      userCode: userCode,                    // Backend requires userCode
      appointmentTime: {
        date: appointmentData.date,
        time: timeSlot.startTime || appointmentData.time
      }
    };
    
    console.log("Formatted appointment data:", formattedAppointment);
    
    try {
      const response = await apiClient.post('/appointment', formattedAppointment);
      console.log("Appointment created successfully:", response);
      return response;
    } catch (error) {
      // Handle specific error cases
      if (error.response && error.response.data) {
        const errorMessage = error.response.data;
        if (typeof errorMessage === 'string' && errorMessage.includes('appointment limit exceeded')) {
          throw new Error('Haftalık randevu sınırına ulaştınız (3 randevu). Yeni randevu alabilmek için bir hafta beklemeniz gerekmektedir.');
        }
      }
      throw error;
    }
  },
  
  // Get user's appointments
  getUserAppointments: async (userCode) => {
    try {
      console.log(`Getting appointments for user ${userCode}`);
      
      // Make sure we have a userCode
      if (!userCode) {
        console.error('No userCode provided to getUserAppointments');
        throw new Error('No user ID provided');
      }
      
      // Call the backend endpoint
      const response = await apiClient.get(`/user/${userCode}/appointments`);
      
      console.log(`Appointments response for ${userCode}:`, 
        response.status, Array.isArray(response.data) ? `${response.data.length} items` : 'not an array');
      
      return response;
    } catch (error) {
      console.error(`Error fetching appointments for user ${userCode}:`, error);
      
      // Log more details about the error for debugging
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error;
    }
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
  },
  
  // Get user's appointments with detailed information
  getUserAppointmentsWithDetails: async (userCode) => {
    try {
      console.log(`Getting appointments with details for user ${userCode}`);
      
      // Make sure we have a userCode
      if (!userCode) {
        console.error('No userCode provided to getUserAppointmentsWithDetails');
        throw new Error('No user ID provided');
      }
      
      // Call the backend endpoint to get basic appointments
      const response = await apiClient.get(`/user/${userCode}/appointments`);
      
      console.log(`Basic appointments received for ${userCode}:`, 
        response.status, Array.isArray(response.data) ? `${response.data.length} items` : 'not an array');
      
      // If we don't have appointments or they're not in array format, return as is
      if (!response.data || !Array.isArray(response.data) || response.data.length === 0) {
        return response;
      }
      
      // For each appointment, fetch additional details
      const enhancedAppointments = await Promise.all(
        response.data.map(async (appointment) => {
          try {
            // Get appointment details which include doctorCode
            const appointmentCode = appointment.appointmentCode;
            console.log(`Getting details for appointment: ${appointmentCode}`);
            
            const detailsResponse = await apiClient.get(`/appointment/${appointmentCode}`);
            const appointmentWithDetails = { ...appointment, ...detailsResponse.data };
            
            // Get doctor details
            const doctorCode = appointmentWithDetails.doctorCode;
            if (doctorCode) {
              try {
                console.log(`Getting doctor info for: ${doctorCode}`);
                const doctorResponse = await apiClient.get(`/doctor/${doctorCode}`);
                
                if (doctorResponse && doctorResponse.data) {
                  // Extract doctor data
                  const doctor = doctorResponse.data;
                  
                  // Add doctor details to the appointment
                  appointmentWithDetails.doctor = doctor;
                  
                  // Add individual doctor fields for easier access in UI
                  appointmentWithDetails.doctorName = doctor.doctorName;
                  
                  // If doctor name has first and last name properties, extract them
                  const nameParts = doctor.doctorName ? doctor.doctorName.split(' ') : [];
                  if (nameParts.length >= 2) {
                    appointmentWithDetails.doctorFirstName = nameParts[0];
                    appointmentWithDetails.doctorLastName = nameParts.slice(1).join(' ');
                  } else if (doctor.doctorName) {
                    // If there's only one name, use it as firstName
                    appointmentWithDetails.doctorFirstName = doctor.doctorName;
                    appointmentWithDetails.doctorLastName = '';
                  }
                  
                  // Add field name - handle both field and fieldName properties
                  if (doctor.fieldName) {
                    appointmentWithDetails.fieldName = doctor.fieldName;
                  } else if (doctor.field !== undefined) {
                    // Map field code to field name using the common mapping
                    const fieldNameMap = {
                      1: "Dahiliye",
                      2: "Çocuk Sağlığı ve Hastalıkları",
                      3: "Kulak Burun Boğaz Hastalıkları",
                      4: "Göz Hastalıkları",
                      5: "Kadın Hastalıkları ve Doğum",
                      6: "Ortopedi ve Travmatoloji",
                      7: "Genel Cerrahi",
                      8: "Deri ve Zührevi Hastalıkları",
                      9: "Nöroloji",
                      10: "Kardiyoloji"
                    };
                    appointmentWithDetails.fieldName = fieldNameMap[doctor.field] || `Field ${doctor.field}`;
                  }
                  
                  // Get hospital details using the doctor's hospitalCode
                  const hospitalCode = doctor.hospitalCode;
                  if (hospitalCode) {
                    try {
                      console.log(`Getting hospital info for: ${hospitalCode}`);
                      const hospitalResponse = await apiClient.get(`/hospital/${hospitalCode}`);
                      
                      if (hospitalResponse && hospitalResponse.data) {
                        // Add hospital details to the appointment
                        appointmentWithDetails.hospital = hospitalResponse.data;
                        appointmentWithDetails.hospitalName = hospitalResponse.data.hospitalName;
                      }
                    } catch (err) {
                      console.error(`Error fetching hospital details for code ${hospitalCode}:`, err);
                    }
                  }
                }
              } catch (err) {
                console.error(`Error fetching doctor details for code ${doctorCode}:`, err);
              }
            }
            
            console.log(`Enhanced appointment:`, appointmentWithDetails);
            return appointmentWithDetails;
          } catch (error) {
            console.error(`Error fetching details for appointment ${appointment.appointmentCode}:`, error);
            return appointment;
          }
        })
      );
      
      console.log(`Enhanced appointments: ${enhancedAppointments.length} items`);
      return { ...response, data: enhancedAppointments };
      
    } catch (error) {
      console.error(`Error in getUserAppointmentsWithDetails for user ${userCode}:`, error);
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
      }
      throw error;
    }
  },
  
  getDoctorAppointments: async () => {
    // This would be used for doctor-specific appointment viewing
    // Implementation depends on how doctor authentication is handled
    return await apiClient.get('/doctor/appointments');
  }
};

export default AppointmentService; 