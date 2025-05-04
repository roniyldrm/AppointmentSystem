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
      console.log('Request with auth token');
    } else {
      console.log('Request without auth token');
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
      return Promise.reject({
        response: response,
        message: response.data?.message || `Error ${response.status}`
      });
    }
    
    return response;
  },
  async (error) => {
    console.error('Response interceptor caught error:', error);
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
          throw new Error('No refresh token available');
        }
        
        console.log('Calling refresh token endpoint');
        const refreshResponse = await axios.post(`${API_URL}/auth/refresh-token`, { 
          refreshToken 
        });
        
        // Store new tokens
        const { token, refreshToken: newRefreshToken } = refreshResponse.data;
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        console.log('Token refreshed successfully');
        
        // Retry original request with new token
        originalRequest.headers['Authorization'] = `Bearer ${token}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        
        // If refresh token fails, redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
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

export default apiClient; 