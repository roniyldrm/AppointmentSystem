import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, error: contextError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to the page user tried to access or to home page
  const from = location.state?.from?.pathname || '/';
  
  // Use error from context if available
  useEffect(() => {
    if (contextError) {
      setError(contextError);
      console.log('Auth context error:', contextError);
    }
  }, [contextError]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent any default browser behavior
    
    setError('');
    setLoading(true);

    try {
      console.log('Attempting login with:', credentials.email);
      
      // Call login from AuthContext
      const userData = await login(credentials.email, credentials.password);
      
      console.log('Login successful:', userData);
      
      // Redirect based on user role
      if (userData.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (userData.role === 'doctor') {
        navigate('/doctor/profile');
      } else {
        // Navigate to the page they tried to access, or home
        navigate(from);
      }
    } catch (err) {
      // Enhanced error logging
      console.error('Login error details:', err);
      
      // Set a more descriptive error message
      let errorMsg = 'Failed to login. Please check your credentials.';
      
      if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err.response?.data) {
        errorMsg = err.response.data;
      } else if (err.message) {
        errorMsg = err.message;
      }
      
      setError(errorMsg);
      
      // Keep error visible for longer
      setTimeout(() => {
        console.log('Login error is still:', errorMsg);
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center text-blue-600 mb-6">Sign In to Your Account</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            <strong>Error: </strong>{error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
              Email
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              id="email"
              type="email"
              name="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="Your email address"
              required
              disabled={loading}
            />
          </div>
          <div className="mb-6">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="password">
              Password
            </label>
            <input
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline"
              id="password"
              type="password"
              name="password"
              value={credentials.password}
              onChange={handleChange}
              placeholder="******************"
              required
              disabled={loading}
            />
          </div>
          <div className="flex items-center justify-between">
            <button
              className={`bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline w-full ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              type="submit"
              disabled={loading}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </div>
          <div className="text-center mt-4 space-y-2">
            <Link to="/register" className="block text-blue-600 hover:text-blue-800 text-sm">
              Don't have an account? Register here
            </Link>
            <Link to="/admin/login" className="block text-red-600 hover:text-red-800 text-sm font-medium">
              Admin Login
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login; 