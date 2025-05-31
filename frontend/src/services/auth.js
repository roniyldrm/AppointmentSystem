import apiClient from './api';

const AuthService = {
  login: async (username, password) => {
    try {
      console.log('AuthService login attempt with:', username);
      let userData = null;
      
      // Try first with username field
      try {
        const response = await apiClient.post('/auth/login', { 
          username, 
          password 
        });
        
        console.log('Login API response with username:', response);
        
        // Check for success and token access
        if (response.data && (response.data.accessToken || response.data.token)) {
          console.log('Token received, storing authentication data...');
          // Store token (handle either accessToken or token in the response)
          const token = response.data.accessToken || response.data.token;
          localStorage.setItem('token', token);
          
          if (response.data.refreshToken) {
            localStorage.setItem('refreshToken', response.data.refreshToken);
          }
          
          // Store user ID - critical for appointments
          if (response.data.userId || response.data.userCode) {
            const userId = response.data.userId || response.data.userCode;
            localStorage.setItem('userId', userId);
            console.log('User ID stored:', userId);
          } else if (response.data.user && response.data.user.userCode) {
            localStorage.setItem('userId', response.data.user.userCode);
            console.log('User ID stored from user object:', response.data.user.userCode);
          } else {
            console.warn('No user ID found in login response');
          }
          
          // Store user email for profile usage
          if (username.includes('@')) {
            localStorage.setItem('userEmail', username);
            console.log('User email stored:', username);
          }
          
          // Store additional user data if available
          if (response.data.user) {
            if (response.data.user.firstName) {
              localStorage.setItem('userFirstName', response.data.user.firstName);
              console.log('User firstName stored:', response.data.user.firstName);
            }
            if (response.data.user.lastName) {
              localStorage.setItem('userLastName', response.data.user.lastName);
              console.log('User lastName stored:', response.data.user.lastName);
            }
            if (response.data.user.phone) {
              localStorage.setItem('userPhone', response.data.user.phone);
              console.log('User phone stored:', response.data.user.phone);
            }
            if (response.data.user.email) {
              localStorage.setItem('userEmail', response.data.user.email);
              console.log('User email stored from response:', response.data.user.email);
            }
          }
          
          if (response.data.role) {
            localStorage.setItem('userRole', response.data.role);
          }
          
          console.log('Authentication data stored successfully.');
          userData = response.data;
        }
      } catch (error) {
        console.error('Failed login with username field:', error);
        // Continue to email attempt
      }
      
      // If first attempt failed, try with email field
      if (!userData) {
        try {
          const response = await apiClient.post('/auth/login', { 
            email: username, 
            password 
          });
          
          console.log('Login API response with email:', response);
          
          if (response.data && (response.data.accessToken || response.data.token)) {
            console.log('Token received from email login, storing authentication data...');
            const token = response.data.accessToken || response.data.token;
            localStorage.setItem('token', token);
            
            if (response.data.refreshToken) {
              localStorage.setItem('refreshToken', response.data.refreshToken);
            }
            
            // Store user ID - critical for appointments
            if (response.data.userId || response.data.userCode) {
              const userId = response.data.userId || response.data.userCode;
              localStorage.setItem('userId', userId);
              console.log('User ID stored:', userId);
            } else if (response.data.user && response.data.user.userCode) {
              localStorage.setItem('userId', response.data.user.userCode);
              console.log('User ID stored from user object:', response.data.user.userCode);
            } else {
              console.warn('No user ID found in login response');
            }
            
            // Store user email for profile usage
            if (username.includes('@')) {
              localStorage.setItem('userEmail', username);
              console.log('User email stored:', username);
            }
            
            // Store additional user data if available
            if (response.data.user) {
              if (response.data.user.firstName) {
                localStorage.setItem('userFirstName', response.data.user.firstName);
                console.log('User firstName stored:', response.data.user.firstName);
              }
              if (response.data.user.lastName) {
                localStorage.setItem('userLastName', response.data.user.lastName);
                console.log('User lastName stored:', response.data.user.lastName);
              }
              if (response.data.user.phone) {
                localStorage.setItem('userPhone', response.data.user.phone);
                console.log('User phone stored:', response.data.user.phone);
              }
              if (response.data.user.email) {
                localStorage.setItem('userEmail', response.data.user.email);
                console.log('User email stored from response:', response.data.user.email);
              }
            }
            
            if (response.data.role) {
              localStorage.setItem('userRole', response.data.role);
            }
            
            console.log('Authentication data stored successfully.');
            userData = response.data;
          }
        } catch (error) {
          console.error('Failed login with email field:', error);
          throw new Error('Invalid username/email or password');
        }
      }
      
      return userData;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await apiClient.post('/auth/register', userData);
      console.log('Register response:', response.data);
      
      // Store user information from registration
      if (userData.email) {
        localStorage.setItem('userEmail', userData.email);
      }
      if (userData.firstName) {
        localStorage.setItem('userFirstName', userData.firstName);
      }
      if (userData.lastName) {
        localStorage.setItem('userLastName', userData.lastName);
      }
      if (userData.phone) {
        localStorage.setItem('userPhone', userData.phone);
      }
      
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
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userFirstName');
    localStorage.removeItem('userLastName');
    localStorage.removeItem('userPhone');
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