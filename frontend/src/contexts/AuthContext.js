import React, { createContext, useState, useEffect, useContext } from 'react';
import AuthService from '../services/auth';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Check if user is logged in on initial load
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      setError(null);
      setLoading(true);
      const userData = await AuthService.login(username, password);
      
      // Log what we received from auth service
      console.log('AuthContext: Login response data:', userData);
      
      // Extract user ID with fallbacks to different possible property names
      const userId = userData.userCode || userData.userId || 
                    (userData.user && userData.user.userCode) || '';
                    
      // Set current user with both id and userCode properties to ensure compatibility
      setCurrentUser({
        token: userData.token || userData.accessToken,
        role: userData.role,
        id: userId,
        userCode: userId // Include both formats
      });
      
      console.log('AuthContext: User data set to:', {
        token: userData.token || userData.accessToken ? '(exists)' : '(missing)',
        role: userData.role,
        id: userId
      });
      
      return userData;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      setLoading(true);
      return await AuthService.register(userData);
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin',
    isDoctor: currentUser?.role === 'doctor',
    isPatient: currentUser?.role === 'patient',
    login,
    register,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext; 