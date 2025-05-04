import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Home = () => {
  const { isAuthenticated, isPatient } = useAuth();

  return (
    <div className="py-12 bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">Welcome to the Hospital Appointment System</h1>
          <p className="text-gray-700 mb-6">
            Our platform makes it easy to book appointments with healthcare providers. 
            Find the right doctor, select a convenient time, and manage your appointments all in one place.
          </p>
          
          {isAuthenticated && isPatient ? (
            <div className="mt-6">
              <Link 
                to="/appointment" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block"
              >
                Book an Appointment
              </Link>
            </div>
          ) : !isAuthenticated && (
            <div className="mt-6">
              <Link 
                to="/login" 
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg inline-block mr-4"
              >
                Sign In
              </Link>
              <Link 
                to="/register" 
                className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg inline-block"
              >
                Register
              </Link>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-700 mb-2">Find a Doctor</h2>
              <p className="text-gray-600">Search for specialists by location, specialty, or hospital. Our system helps you find the perfect doctor for your needs.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-700 mb-2">Book Appointments</h2>
              <p className="text-gray-600">Schedule appointments at your convenience with our easy booking system. Choose a time that works for you.</p>
            </div>
            <div className="bg-blue-50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-700 mb-2">Manage Your Health</h2>
              <p className="text-gray-600">Keep track of your appointments and medical history in one place. Never miss an important healthcare visit again.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 