import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AdminService from '../services/admin';

const ManageHospitals = () => {
  const [hospitals, setHospitals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    provinceCode: '',
    districtCode: '',
    search: ''
  });
  const [cities, setCities] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeHospital, setActiveHospital] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    // Check authentication on load
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found");
      setError("Authentication required. Please log in again.");
      return;
    }
    
    console.log("ManageHospitals: Component mounted, fetching initial data...");
    fetchHospitals();
    fetchCities();
  }, [page]);
  
  const fetchHospitals = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token available for fetching hospitals");
        setError("Authentication required. Please log in again.");
        return;
      }
      
      console.log("Fetching hospitals with filter:", filter);
      const response = await AdminService.getHospitals(filter);
      console.log("Hospitals response:", response);
      
      if (Array.isArray(response)) {
        setHospitals(response);
        console.log("Successfully loaded", response.length, "hospitals");
      } else {
        console.error("Invalid response format:", response);
        setHospitals([]);
        setError("Received invalid data from server");
      }
      
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      if (error.response?.status === 401) {
        console.warn("Authentication error (401)");
        setError("Authentication failed. Please log in again.");
      } else {
        setError('Failed to load hospitals. Please try again later.');
      }
      setHospitals([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCities = async () => {
    try {
      console.log("Fetching cities...");
      const response = await AdminService.getCities();
      console.log("Cities response:", response);
      
      if (Array.isArray(response)) {
        setCities(response);
        console.log("Successfully loaded", response.length, "cities");
      } else {
        console.error("Invalid cities response format:", response);
        setCities([]);
      }
    } catch (err) {
      console.error('Error fetching cities:', err);
      if (err.response?.status === 401) {
        console.warn("Authentication error (401) while fetching cities");
        setError("Authentication failed. Please log in again.");
      }
      setCities([]); // Ensure it's always an array
    }
  };
  
  const fetchDistricts = async (provinceCode) => {
    if (!provinceCode) {
      setDistricts([]);
      return;
    }
    
    try {
      const response = await AdminService.getDistricts(provinceCode);
      setDistricts(Array.isArray(response) ? response : []);
    } catch (err) {
      console.error('Error fetching districts:', err);
      setDistricts([]); // Ensure it's always an array
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    
    // If city changes, reset district and fetch new districts
    if (name === 'provinceCode') {
      setFilter(prev => ({ ...prev, [name]: value, districtCode: '' }));
      fetchDistricts(value);
    } else {
      setFilter(prev => ({ ...prev, [name]: value }));
    }
  };
  
  const handleApplyFilter = () => {
    setPage(1); // Reset to first page when applying filters
    fetchHospitals();
  };
  
  const handleResetFilter = () => {
    setFilter({
      provinceCode: '',
      districtCode: '',
      search: ''
    });
    setDistricts([]);
    
    setPage(1);
    fetchHospitals();
  };
  
  const handleEditHospital = (hospital) => {
    setActiveHospital(hospital);
    setShowEditModal(true);
    
    // Fetch districts for the hospital's city if needed
    if (hospital.provinceCode && districts.length === 0) {
      fetchDistricts(hospital.provinceCode);
    }
  };
  
  const handleCloseModal = () => {
    setShowEditModal(false);
    setActiveHospital(null);
  };
  
  const handleUpdateHospital = async (e) => {
    e.preventDefault();
    
    try {
      await AdminService.updateHospital(activeHospital.hospitalCode, activeHospital);
      
      // Update local state
      setHospitals(hospitals.map(hosp => 
        hosp.hospitalCode === activeHospital.hospitalCode ? activeHospital : hosp
      ));
      
      handleCloseModal();
    } catch (err) {
      setError('Failed to update hospital. Please try again.');
      console.error('Error updating hospital:', err);
    }
  };
  
  const handleDeleteHospital = async (hospitalCode) => {
    if (!window.confirm('Are you sure you want to delete this hospital? This action cannot be undone.')) {
      return;
    }
    
    try {
      await AdminService.deleteHospital(hospitalCode);
      
      // Remove from local state
      setHospitals(hospitals.filter(hosp => hosp.hospitalCode !== hospitalCode));
    } catch (err) {
      setError('Failed to delete hospital. Please try again.');
      console.error('Error deleting hospital:', err);
    }
  };
  
  const handleCreateHospital = () => {
    setActiveHospital({
      hospitalName: '',
      hospitalCode: '',
      provinceCode: '',
      districtCode: '',
      address: '',
      phone: ''
    });
    setShowCreateModal(true);
  };
  
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setActiveHospital(null);
  };
  
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await AdminService.createHospital(activeHospital);
      
      // Add to local state
      setHospitals([...hospitals, response.data]);
      
      handleCloseCreateModal();
    } catch (err) {
      setError('Failed to create hospital. Please try again.');
      console.error('Error creating hospital:', err);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Manage Hospitals</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filters</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="provinceCode">
                City
              </label>
              <select
                id="provinceCode"
                name="provinceCode"
                value={filter.provinceCode}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">All Cities</option>
                {Array.isArray(cities) && cities.map(city => (
                  <option key={city.code} value={city.code}>{city.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="districtCode">
                District
              </label>
              <select
                id="districtCode"
                name="districtCode"
                value={filter.districtCode}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                disabled={!filter.provinceCode}
              >
                <option value="">All Districts</option>
                {Array.isArray(districts) && districts.map(district => (
                  <option key={district.districtCode} value={district.districtCode}>{district.districtName}</option>
                ))}
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
                placeholder="Search by name..."
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
        
        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleCreateHospital}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Add New Hospital
          </button>
        </div>
        
        {/* Hospitals List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : hospitals.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">No hospitals found matching your criteria.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hospital Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Code
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Location
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Contact
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {hospitals.map((hospital) => (
                      <tr key={hospital.hospitalCode}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {hospital.hospitalName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{hospital.hospitalCode}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{hospital.cityName}</div>
                          {hospital.districtName && (
                            <div className="text-sm text-gray-500">{hospital.districtName}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {hospital.phone && (
                            <div className="text-sm text-gray-900">{hospital.phone}</div>
                          )}
                          {hospital.address && (
                            <div className="text-sm text-gray-500 truncate max-w-xs">{hospital.address}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditHospital(hospital)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteHospital(hospital.hospitalCode)}
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
      {showEditModal && activeHospital && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Hospital</h3>
              
              <form onSubmit={handleUpdateHospital}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hospitalName">
                    Hospital Name
                  </label>
                  <input
                    id="hospitalName"
                    type="text"
                    value={activeHospital.hospitalName}
                    onChange={(e) => setActiveHospital({...activeHospital, hospitalName: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hospitalCode">
                    Hospital Code
                  </label>
                  <input
                    id="hospitalCode"
                    type="text"
                    value={activeHospital.hospitalCode}
                    disabled={true} // Don't allow editing hospital code
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 bg-gray-100 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editProvinceCode">
                      City
                    </label>
                    <select
                      id="editProvinceCode"
                      value={activeHospital.provinceCode}
                      onChange={(e) => {
                        setActiveHospital({...activeHospital, provinceCode: e.target.value, districtCode: ''});
                        fetchDistricts(e.target.value);
                      }}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select City</option>
                      {Array.isArray(cities) && cities.map(city => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editDistrictCode">
                      District
                    </label>
                    <select
                      id="editDistrictCode"
                      value={activeHospital.districtCode}
                      onChange={(e) => setActiveHospital({...activeHospital, districtCode: e.target.value})}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={!activeHospital.provinceCode}
                    >
                      <option value="">Select District</option>
                      {Array.isArray(districts) && districts.map(district => (
                        <option key={district.districtCode} value={district.districtCode}>{district.districtName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="address">
                    Address
                  </label>
                  <textarea
                    id="address"
                    value={activeHospital.address || ''}
                    onChange={(e) => setActiveHospital({...activeHospital, address: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="3"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                    Phone
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={activeHospital.phone || ''}
                    onChange={(e) => setActiveHospital({...activeHospital, phone: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
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
      
      {/* Create Modal */}
      {showCreateModal && activeHospital && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Add New Hospital</h3>
              
              <form onSubmit={handleSubmitCreate}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHospitalName">
                    Hospital Name*
                  </label>
                  <input
                    id="newHospitalName"
                    type="text"
                    value={activeHospital.hospitalName}
                    onChange={(e) => setActiveHospital({...activeHospital, hospitalName: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHospitalCode">
                    Hospital Code*
                  </label>
                  <input
                    id="newHospitalCode"
                    type="text"
                    value={activeHospital.hospitalCode}
                    onChange={(e) => setActiveHospital({...activeHospital, hospitalCode: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newProvinceCode">
                      City*
                    </label>
                    <select
                      id="newProvinceCode"
                      value={activeHospital.provinceCode}
                      onChange={(e) => {
                        setActiveHospital({...activeHospital, provinceCode: e.target.value, districtCode: ''});
                        fetchDistricts(e.target.value);
                      }}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      required
                    >
                      <option value="">Select City</option>
                      {Array.isArray(cities) && cities.map(city => (
                        <option key={city.code} value={city.code}>{city.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newDistrictCode">
                      District
                    </label>
                    <select
                      id="newDistrictCode"
                      value={activeHospital.districtCode}
                      onChange={(e) => setActiveHospital({...activeHospital, districtCode: e.target.value})}
                      className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                      disabled={!activeHospital.provinceCode}
                    >
                      <option value="">Select District</option>
                      {Array.isArray(districts) && districts.map(district => (
                        <option key={district.districtCode} value={district.districtCode}>{district.districtName}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newAddress">
                    Address
                  </label>
                  <textarea
                    id="newAddress"
                    value={activeHospital.address || ''}
                    onChange={(e) => setActiveHospital({...activeHospital, address: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    rows="3"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPhone">
                    Phone
                  </label>
                  <input
                    id="newPhone"
                    type="tel"
                    value={activeHospital.phone || ''}
                    onChange={(e) => setActiveHospital({...activeHospital, phone: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    onClick={handleCloseCreateModal}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Create
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

export default ManageHospitals; 