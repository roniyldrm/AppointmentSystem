import apiClient from './api';

const AuthService = {
  login: async (username, password) => {
    const response = await apiClient.post('/auth/login', { username, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      localStorage.setItem('userRole', response.data.role);
      localStorage.setItem('userId', response.data.userId);
    }
    return response.data;
  },
  
  register: async (userData) => {
    return await apiClient.post('/auth/register', userData);
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