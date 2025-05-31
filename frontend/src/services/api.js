import axios from 'axios';
import { API_URL } from '../config/api';

// Debug server URL
console.log('API URL being used:', API_URL);

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  // Make sure we get complete error information
  validateStatus: status => {
    // Return true for all status codes so that we can handle them in error handlers
    return true;
  },
  // Increase timeout to 15 seconds for slow connections
  timeout: 15000
});

// Request interceptor for adding auth token
apiClient.interceptors.request.use(
  (config) => {
    console.log(`Making ${config.method?.toUpperCase() || 'API'} request to: ${config.baseURL}${config.url}`);
    
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log('Request with auth token:', token.substring(0, 10) + '...');
    } else {
      console.log('Request without auth token - this may cause 401 errors');
    }
    
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for handling token expiry
apiClient.interceptors.response.use(
  (response) => {
    // Log the response status
    console.log(`Response status: ${response.status} for ${response.config.url}`);
    
    // If status code is not successful, convert to error
    if (response.status >= 400) {
      console.error(`Error response ${response.status}:`, response.data);
      
      // If unauthorized and token exists, attempt to refresh
      if (response.status === 401 && localStorage.getItem('token')) {
        console.warn('Received 401 with existing token - may need refresh');
      }
      
      return Promise.reject({
        response: response,
        message: response.data?.message || `Error ${response.status}`
      });
    }
    
    return response;
  },
  async (error) => {
    console.error('Response interceptor caught error:', error);
    
    // Handle network errors
    if (!error.response) {
      console.error('Network error - no response from server');
      return Promise.reject({
        message: 'Network error - could not connect to server'
      });
    }
    
    const originalRequest = error.config;
    
    if (!originalRequest) {
      console.error('No original request found in error object:', error);
      return Promise.reject(error);
    }
    
    // If token expired and we haven't tried refreshing yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Attempting to refresh token...');
      originalRequest._retry = true;
      
      try {
        // Call refresh token endpoint
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token available - redirecting to login');
          throw new Error('No refresh token available');
        }
        
        console.log('Calling refresh token endpoint');
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh`, { 
          refreshToken 
        });
        
        // Check if refresh was successful
        if (!refreshResponse.data || 
            !refreshResponse.data.accessToken && !refreshResponse.data.token) {
          console.error('Refresh token response did not contain a valid token:', refreshResponse.data);
          throw new Error('Invalid refresh response');
        }
        
        // Store new tokens - handle different response formats
        const token = refreshResponse.data.accessToken || refreshResponse.data.token;
        const newRefreshToken = refreshResponse.data.refreshToken || refreshResponse.data.refresh_token;
        
        localStorage.setItem('token', token);
        console.log('New token stored:', token.substring(0, 10) + '...');
        
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
          console.log('New refresh token stored');
        }
        
        console.log('Token refreshed successfully');
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userId');
        
        console.log('Redirecting to login page due to auth failure');
        // Use timeout to make sure console messages are visible before redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// User Profile API
export const getUserProfile = async (userCode) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/user/${userCode}/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }
};

export const updateUserProfile = async (userCode, profileData) => {
  try {
    const token = localStorage.getItem('token');
    await axios.put(`${API_URL}/user/${userCode}/profile`, profileData, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

// Change Password API
export const changePassword = async (userCode, currentPassword, newPassword) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.post(`${API_URL}/user/${userCode}/password`, {
      currentPassword,
      newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    return true;
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

export default apiClient; 