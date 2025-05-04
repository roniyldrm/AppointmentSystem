import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth';
import webSocketService from '../services/websocket';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is already logged in
    const initAuth = () => {
      const currentUser = AuthService.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        // Connect to WebSocket if user is authenticated
        webSocketService.connect();
      }
      setLoading(false);
    };

    initAuth();
    
    // Clean up on unmount
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  const login = async (username, password) => {
    try {
      console.log('AuthContext: Login attempt with', username);
      const userData = await AuthService.login(username, password);
      console.log('AuthContext: Login response', userData);
      
      setUser({
        id: userData.userCode,
        role: userData.role,
        token: userData.accessToken
      });
      
      // Connect to WebSocket after successful login
      webSocketService.connect();
      
      setError(null);
      return userData;
    } catch (error) {
      console.error('AuthContext: Login error', error);
      const errorMessage = error.response?.data?.message || 'Login failed';
      setError(errorMessage);
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      await AuthService.register(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
    webSocketService.disconnect();
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isDoctor: user?.role === 'doctor',
    isPatient: user?.role === 'patient'
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 