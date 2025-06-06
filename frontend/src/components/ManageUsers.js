import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AdminService from '../services/admin';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    role: '',
    search: ''
  });
  
  useEffect(() => {
    // Check authentication on load
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found");
      setError("Authentication required. Please log in again.");
      return;
    }
    
    console.log("ManageUsers: Component mounted, fetching initial data...");
    fetchUsers();
  }, [page]);
  
  // Add automatic filtering when filter changes
  useEffect(() => {
    fetchUsers();
  }, [filter]);
  
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token available for fetching users");
        setError("Authentication required. Please log in again.");
        return;
      }
      
      console.log("Fetching users with filter:", filter);
      const response = await AdminService.getAllUsers({
        page,
        limit: 50,
        role: filter.role,
        search: filter.search
      });
      console.log("Users response:", response);
      
      if (Array.isArray(response)) {
        setUsers(response);
        console.log("Successfully loaded", response.length, "users");
      } else if (response && Array.isArray(response.data)) {
        setUsers(response.data);
        setTotalPages(response.totalPages || 1);
        console.log("Successfully loaded", response.data.length, "users");
      } else {
        console.error("Invalid response format:", response);
        setUsers([]);
        setError("Received invalid data from server");
      }
      
    } catch (error) {
      console.error('Error fetching users:', error);
      if (error.response?.status === 401) {
        console.warn("Authentication error (401)");
        setError("Authentication failed. Please log in again.");
      } else {
        setError('Failed to load users. Please try again later.');
      }
      setUsers([]); // Ensure it's always an array
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
    fetchUsers();
  };
  
  const handleResetFilter = () => {
    setFilter({
      role: '',
      search: ''
    });
    
    setPage(1);
    fetchUsers();
  };
  
  const handleDeleteUser = async (userCode) => {
    if (!window.confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    
    try {
      await AdminService.deleteUser(userCode);
      
      // Remove from local state
      setUsers(users.filter(user => user.userCode !== userCode));
    } catch (err) {
      setError('Failed to delete user. Please try again.');
      console.error('Error deleting user:', err);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return format(date, 'dd/MM/yyyy');
    } catch (error) {
      return dateString;
    }
  };

  const getRoleDisplayName = (role) => {
    const roleMap = {
      'patient': 'Patient',
      'doctor': 'Doctor',
      'admin': 'Administrator'
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeClass = (role) => {
    const roleClasses = {
      'patient': 'bg-blue-100 text-blue-800',
      'doctor': 'bg-green-100 text-green-800',
      'admin': 'bg-purple-100 text-purple-800'
    };
    return roleClasses[role] || 'bg-gray-100 text-gray-800';
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Users</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="role">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={filter.role}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Roles</option>
                <option value="patient">Patient</option>
                <option value="doctor">Doctor</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Search
              </label>
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Search by name, email or phone..."
                value={filter.search}
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
        
        {/* Users List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found matching the criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User Information
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Registration Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {users.map((user) => (
                      <tr key={user.userCode}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="h-10 w-10 flex-shrink-0">
                              <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-700">
                                  {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
                                  {user.lastName ? user.lastName.charAt(0).toUpperCase() : ''}
                                </span>
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">
                                {user.firstName || user.lastName 
                                  ? `${user.firstName || ''} ${user.lastName || ''}`.trim()
                                  : user.email?.split('@')[0] || `User ${user.userCode}`
                                }
                              </div>
                              <div className="text-sm text-gray-500">
                                Code: {user.userCode}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {user.email && (
                            <div className="text-sm text-gray-900">{user.email}</div>
                          )}
                          {user.phone && (
                            <div className="text-sm text-gray-500">{user.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getRoleBadgeClass(user.role)}`}>
                            {getRoleDisplayName(user.role)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleDeleteUser(user.userCode)}
                            className="text-red-600 hover:text-red-900"
                            disabled={user.role === 'admin'} // Prevent deleting admin users
                          >
                            {user.role === 'admin' ? 'Cannot Delete' : 'Delete'}
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
                    Page {page} / {totalPages}
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
    </div>
  );
};

export default ManageUsers; 