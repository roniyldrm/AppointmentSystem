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
  getDoctors: async (params = {}) => {
    console.log("Getting doctors with params:", params);
    const { hospitalCode, cityCode, districtCode, fieldCode, startDate, endDate } = params;
    
    try {
      let url = '/doctors';
      
      // If hospitalCode is provided, get doctors for that hospital
      if (hospitalCode) {
        url = `/doctors/${hospitalCode}`;
      }
      
      // Add query parameters for filtering if needed
      const queryParams = new URLSearchParams();
      if (cityCode) queryParams.append('provinceCode', cityCode);
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
    // Transform the data to match the backend API expectations
    console.log("Original appointment data:", appointmentData);
    
    // Get user info from localStorage
    const userCode = localStorage.getItem('userId');
    if (!userCode) {
      throw new Error('User ID not found. Please login again.');
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
    
    return await apiClient.post('/appointment', formattedAppointment);
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
      
      // For each appointment, fetch additional details if needed
      const enhancedAppointments = await Promise.all(
        response.data.map(async (appointment) => {
          try {
            // If the appointment already has doctor/hospital info, return as is
            if (appointment.doctor && appointment.hospital) {
              return appointment;
            }
            
            // Otherwise, try to fetch details for this appointment
            const detailsResponse = await apiClient.get(`/appointment/${appointment.appointmentCode}`);
            return {
              ...appointment,
              ...detailsResponse.data
            };
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
  }
};

export default AppointmentService; 