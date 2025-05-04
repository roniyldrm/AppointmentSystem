import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AppointmentService from '../services/appointment';
import { useAuth } from '../contexts/AuthContext';

const DoctorProfile = () => {
  const { currentUser } = useAuth();
  const [doctorInfo, setDoctorInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    fetchDoctorInfo();
  }, []);
  
  const fetchDoctorInfo = async () => {
    try {
      setLoading(true);
      // Fetch doctor information
      const response = await AppointmentService.getDoctor('current'); // 'current' is a special identifier for the currently logged-in doctor
      setDoctorInfo(response.data);
    } catch (err) {
      setError('Failed to load your profile information. Please try again later.');
      console.error('Error fetching doctor info:', err);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-gray-50 min-h-screen py-8">
        <div className="container mx-auto px-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Doctor Profile</h1>
              <p className="text-gray-600 mt-1">View and manage your profile information</p>
            </div>
            
            {currentUser && (
              <div className="mt-4 sm:mt-0 px-4 py-2 bg-blue-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <span className="font-semibold">Logged in as:</span> {currentUser.username || currentUser.id}
                </p>
              </div>
            )}
          </div>
          
          {doctorInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Information</h2>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Name</h3>
                  <p className="text-gray-800">Dr. {doctorInfo.firstName} {doctorInfo.lastName}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Specialty</h3>
                  <p className="text-gray-800">{doctorInfo.fieldName}</p>
                </div>
                
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Hospital</h3>
                  <p className="text-gray-800">{doctorInfo.hospitalName}</p>
                </div>
                
                {doctorInfo.email && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Email</h3>
                    <p className="text-gray-800">{doctorInfo.email}</p>
                  </div>
                )}
                
                {doctorInfo.phone && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-1">Phone</h3>
                    <p className="text-gray-800">{doctorInfo.phone}</p>
                  </div>
                )}
              </div>
              
              <div className="bg-gray-50 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Work Schedule</h2>
                
                {doctorInfo.workingHours ? (
                  <div>
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-100">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Day
                          </th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Hours
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {doctorInfo.workingHours.map((schedule) => (
                          <tr key={schedule.day}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm font-medium text-gray-900">{schedule.day}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {schedule.isWorkingDay ? (
                                <div className="text-sm text-gray-900">
                                  {schedule.startTime} - {schedule.endTime}
                                </div>
                              ) : (
                                <div className="text-sm text-gray-500">Day Off</div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500">No working hours information available.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 bg-gray-50 rounded-lg">
              <p className="text-gray-700">No profile information available.</p>
            </div>
          )}
          
          <div className="mt-8 flex justify-end">
            <a 
              href="/doctor/appointments" 
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
            >
              View My Appointments
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DoctorProfile; 