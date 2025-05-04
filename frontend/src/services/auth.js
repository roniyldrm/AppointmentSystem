import apiClient from './api';

const AuthService = {
  login: async (username, password) => {
    try {
      console.log('AuthService login attempt with:', username);
      
      // Try first with username field
      try {
        const response = await apiClient.post('/auth/login', { 
          username, 
          password 
        });
        
        console.log('Login API response with username:', response);
        
        if (response.data.accessToken) {
          console.log('Token received, storing authentication data...');
          localStorage.setItem('token', response.data.accessToken);
          
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          localStorage.setItem('userRole', response.data.role);
          localStorage.setItem('userId', response.data.userCode);
          
          console.log('Authentication data stored successfully.');
          return response.data;
        }
      } catch (usernameError) {
        console.log('Login with username failed, trying with email field...');
        
        // If username attempt fails, try with email field
        const response = await apiClient.post('/auth/login', { 
          email: username, // Use the same input but as email field
          password 
        });
        
        console.log('Login API response with email:', response);
        
        if (response.data.accessToken) {
          console.log('Token received, storing authentication data...');
          localStorage.setItem('token', response.data.accessToken);
          
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          localStorage.setItem('userRole', response.data.role);
          localStorage.setItem('userId', response.data.userCode);
          
          console.log('Authentication data stored successfully.');
          return response.data;
        }
      }
      
      // If we get here without returning, there's no token
      console.error('No token in response');
      throw new Error('Authentication failed: No token received');
      
    } catch (error) {
      console.error('AuthService login error:', error);
      
      // More detailed error info
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      } else if (error.request) {
        console.error('No response received:', error.request);
      } else {
        console.error('Error setting up request:', error.message);
      }
      
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      console.log('Register response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
  },
  
  getCurrentUser: () => {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    const userId = localStorage.getItem('userId');
    
    if (!token) return null;
    
    return {
      token,
      role: userRole,
      id: userId
    };
  },
  
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  getUserRole: () => {
    return localStorage.getItem('userRole');
  },
  
  isAdmin: () => {
    return localStorage.getItem('userRole') === 'admin';
  },
  
  isDoctor: () => {
    return localStorage.getItem('userRole') === 'doctor';
  },
  
  isPatient: () => {
    return localStorage.getItem('userRole') === 'patient';
  }
};

export default AuthService; 