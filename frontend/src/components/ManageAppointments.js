import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AdminService from '../services/admin';

const ManageAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    status: '',
    doctorId: '',
    patientId: '',
    startDate: '',
    endDate: ''
  });
  const [activeAppointment, setActiveAppointment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [statusOptions] = useState(['SCHEDULED', 'COMPLETED', 'CANCELLED']);
  
  useEffect(() => {
    fetchAppointments();
  }, [page]);
  
  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const response = await AdminService.getAllAppointments({
        page,
        limit: 10,
        ...filter
      });
      
      setAppointments(response.data.appointments);
      setTotalPages(response.data.totalPages || 1);
    } catch (err) {
      setError('Failed to load appointments. Please try again later.');
      console.error('Error fetching appointments:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };
  
  const handleApplyFilter = () => {
    setPage(1); // Reset to first page when applying filters
    fetchAppointments();
  };
  
  const handleResetFilter = () => {
    setFilter({
      status: '',
      doctorId: '',
      patientId: '',
      startDate: '',
      endDate: ''
    });
    
    setPage(1);
    fetchAppointments();
  };
  
  const handleEditAppointment = (appointment) => {
    setActiveAppointment(appointment);
    setShowEditModal(true);
  };
  
  const handleCloseModal = () => {
    setShowEditModal(false);
    setActiveAppointment(null);
  };
  
  const handleUpdateAppointment = async (e) => {
    e.preventDefault();
    
    try {
      await AdminService.updateAppointment(activeAppointment.appointmentId, {
        status: activeAppointment.status
      });
      
      // Update local state
      setAppointments(appointments.map(app => 
        app.appointmentId === activeAppointment.appointmentId 
          ? { ...app, status: activeAppointment.status }
          : app
      ));
      
      handleCloseModal();
    } catch (err) {
      setError('Failed to update appointment. Please try again.');
      console.error('Error updating appointment:', err);
    }
  };
  
  const handleDeleteAppointment = async (appointmentId) => {
    if (!window.confirm('Are you sure you want to delete this appointment? This action cannot be undone.')) {
      return;
    }
    
    try {
      await AdminService.deleteAppointment(appointmentId);
      
      // Remove from local state
      setAppointments(appointments.filter(app => app.appointmentId !== appointmentId));
    } catch (err) {
      setError('Failed to delete appointment. Please try again.');
      console.error('Error deleting appointment:', err);
    }
  };
  
  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM d, yyyy');
    } catch (e) {
      return dateString;
    }
  };
  
  // Format time for display (e.g., "09:00" to "9:00 AM")
  const formatTime = (time) => {
    if (!time) return '';
    
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Appointments</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={filter.status}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Statuses</option>
                {statusOptions.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                Start Date
              </label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={filter.startDate}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                End Date
              </label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={filter.endDate}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              />
            </div>
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={handleResetFilter}
              className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded mr-2"
            >
              Reset
            </button>
            <button
              onClick={handleApplyFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Apply Filters
            </button>
          </div>
        </div>
        
        {/* Appointments List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No appointments found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        ID
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Patient
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date & Time
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {appointments.map((appointment) => (
                      <tr key={appointment.appointmentId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.appointmentId}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {appointment.patientFirstName} {appointment.patientLastName}
                          </div>
                          {appointment.patientEmail && (
                            <div className="text-sm text-gray-500">{appointment.patientEmail}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctorFirstName} {appointment.doctorLastName}
                          </div>
                          <div className="text-sm text-gray-500">{appointment.fieldName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatDate(appointment.date)}</div>
                          <div className="text-sm text-gray-500">
                            {formatTime(appointment.startTime)} - {formatTime(appointment.endTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{appointment.hospitalName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            appointment.status === 'CANCELLED'
                              ? 'bg-red-100 text-red-800'
                              : appointment.cancelRequested
                              ? 'bg-yellow-100 text-yellow-800'
                              : appointment.status === 'COMPLETED'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}>
                            {appointment.cancelRequested ? 'Cancellation Requested' : appointment.status || 'SCHEDULED'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditAppointment(appointment)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAppointment(appointment.appointmentId)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination */}
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
                <div className="flex-1 flex justify-between items-center">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page === 1}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 ${
                      page === 1 ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 ${
                      page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Next
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && activeAppointment && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Appointment</h3>
              
              <form onSubmit={handleUpdateAppointment}>
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Patient:</span> {activeAppointment.patientFirstName} {activeAppointment.patientLastName}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Doctor:</span> Dr. {activeAppointment.doctorFirstName} {activeAppointment.doctorLastName}
                  </p>
                  <p className="text-sm text-gray-500 mb-2">
                    <span className="font-medium">Date:</span> {formatDate(activeAppointment.date)}
                  </p>
                  <p className="text-sm text-gray-500 mb-4">
                    <span className="font-medium">Time:</span> {formatTime(activeAppointment.startTime)} - {formatTime(activeAppointment.endTime)}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="status">
                    Status
                  </label>
                  <select
                    id="status"
                    value={activeAppointment.status}
                    onChange={(e) => setActiveAppointment({...activeAppointment, status: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    onClick={handleCloseModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Update
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAppointments; 