import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import AdminService from '../services/admin';

const ManageDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filter, setFilter] = useState({
    hospitalCode: '',
    fieldCode: '',
    search: ''
  });
  const [fields, setFields] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeDoctor, setActiveDoctor] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  useEffect(() => {
    // Check authentication on load
    const token = localStorage.getItem("token");
    if (!token) {
      console.warn("No authentication token found");
      setError("Authentication required. Please log in again.");
      return;
    }
    
    console.log("ManageDoctors: Component mounted, fetching initial data...");
    fetchDoctors();
    fetchFields();
    fetchHospitals();
  }, [page]);
  
  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError(''); // Clear previous errors
      
      // Check if token exists
      const token = localStorage.getItem("token");
      if (!token) {
        console.error("No token available for fetching doctors");
        setError("Authentication required. Please log in again.");
        return;
      }
      
      console.log("Fetching doctors with filter:", filter);
      const response = await AdminService.getDoctors(filter);
      console.log("Doctors response:", response);
      
      if (Array.isArray(response)) {
        setDoctors(response);
        console.log("Successfully loaded", response.length, "doctors");
      } else {
        console.error("Invalid response format:", response);
        setDoctors([]);
        setError("Received invalid data from server");
      }
      
      setTotalPages(response.totalPages || 1);
    } catch (error) {
      console.error('Error fetching doctors:', error);
      if (error.response?.status === 401) {
        console.warn("Authentication error (401)");
        setError("Authentication failed. Please log in again.");
      } else {
        setError('Failed to load doctors. Please try again later.');
      }
      setDoctors([]); // Ensure it's always an array
    } finally {
      setLoading(false);
    }
  };
  
  const fetchFields = async () => {
    try {
      console.log("Fetching fields...");
      const response = await AdminService.getFields();
      console.log("Fields response:", response);
      
      if (Array.isArray(response)) {
        setFields(response);
        console.log("Successfully loaded", response.length, "fields");
      } else {
        console.error("Invalid fields response format:", response);
        setFields([]);
      }
    } catch (error) {
      console.error('Error fetching fields:', error);
      if (error.response?.status === 401) {
        console.warn("Authentication error (401) while fetching fields");
        setError("Authentication failed. Please log in again.");
      }
      setFields([]); // Ensure it's always an array
    }
  };
  
  const fetchHospitals = async () => {
    try {
      const response = await AdminService.getHospitals();
      setHospitals(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('Error fetching hospitals:', error);
      setHospitals([]); // Ensure it's always an array
    }
  };
  
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter({ ...filter, [name]: value });
  };
  
  const handleApplyFilter = () => {
    setPage(1); // Reset to first page when applying filters
    fetchDoctors();
  };
  
  const handleResetFilter = () => {
    setFilter({
      hospitalCode: '',
      fieldCode: '',
      search: ''
    });
    
    setPage(1);
    fetchDoctors();
  };
  
  const handleEditDoctor = (doctor) => {
    setActiveDoctor(doctor);
    setShowEditModal(true);
  };
  
  const handleCloseModal = () => {
    setShowEditModal(false);
    setActiveDoctor(null);
  };
  
  const handleUpdateDoctor = async (e) => {
    e.preventDefault();
    
    try {
      await AdminService.updateDoctor(activeDoctor.doctorCode, activeDoctor);
      
      // Update local state
      setDoctors(doctors.map(doc => 
        doc.doctorCode === activeDoctor.doctorCode ? activeDoctor : doc
      ));
      
      handleCloseModal();
    } catch (err) {
      setError('Failed to update doctor. Please try again.');
      console.error('Error updating doctor:', err);
    }
  };
  
  const handleDeleteDoctor = async (doctorCode) => {
    if (!window.confirm('Are you sure you want to delete this doctor? This action cannot be undone.')) {
      return;
    }
    
    try {
      await AdminService.deleteDoctor(doctorCode);
      
      // Remove from local state
      setDoctors(doctors.filter(doc => doc.doctorCode !== doctorCode));
    } catch (err) {
      setError('Failed to delete doctor. Please try again.');
      console.error('Error deleting doctor:', err);
    }
  };
  
  const handleCreateDoctor = () => {
    setActiveDoctor({
      doctorName: '',
      email: '',
      phone: '',
      fieldCode: '',
      hospitalCode: ''
    });
    setShowCreateModal(true);
  };
  
  const handleCloseCreateModal = () => {
    setShowCreateModal(false);
    setActiveDoctor(null);
  };
  
  const handleSubmitCreate = async (e) => {
    e.preventDefault();
    
    try {
      const response = await AdminService.createDoctor(activeDoctor);
      
      // Add to local state
      setDoctors([...doctors, response]);
      
      handleCloseCreateModal();
    } catch (err) {
      setError('Failed to create doctor. Please try again.');
      console.error('Error creating doctor:', err);
    }
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Doktorları Yönet</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-700 mb-4">Filtreler</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="fieldCode">
                Uzmanlık
              </label>
              <select
                id="fieldCode"
                name="fieldCode"
                value={filter.fieldCode}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Tüm Uzmanlıklar</option>
                {Array.isArray(fields) && fields.map(field => (
                  <option key={field.fieldCode} value={field.fieldCode}>{field.fieldName}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="hospitalCode">
                Hastane
              </label>
              <select
                id="hospitalCode"
                name="hospitalCode"
                value={filter.hospitalCode}
                onChange={handleFilterChange}
                className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              >
                <option value="">Tüm Hastaneler</option>
                {Array.isArray(hospitals) && hospitals.map(hospital => (
                  <option key={hospital.hospitalCode} value={hospital.hospitalCode}>{hospital.hospitalName}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="search">
                Ara
              </label>
              <input
                id="search"
                name="search"
                type="text"
                placeholder="İsme göre ara..."
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
              Sıfırla
            </button>
            <button
              onClick={handleApplyFilter}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            >
              Filtreleri Uygula
            </button>
          </div>
        </div>
        
        {/* Action Button */}
        <div className="mb-4 flex justify-end">
          <button
            onClick={handleCreateDoctor}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
          >
            Yeni Doktor Ekle
          </button>
        </div>
        
        {/* Doctors List */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="flex justify-center items-center h-40">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Kriterlere uygun doktor bulunamadı.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İsim
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Uzmanlık
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Hastane
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İletişim
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        İşlemler
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctors.map((doctor) => (
                      <tr key={doctor.doctorCode}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {doctor.doctorName || `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.fieldName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{doctor.hospitalName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {doctor.email && (
                            <div className="text-sm text-gray-900">{doctor.email}</div>
                          )}
                          {doctor.phone && (
                            <div className="text-sm text-gray-500">{doctor.phone}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleEditDoctor(doctor)}
                            className="text-blue-600 hover:text-blue-900 mr-3"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => handleDeleteDoctor(doctor.doctorCode)}
                            className="text-red-600 hover:text-red-900"
                          >
                            Sil
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
                    Önceki
                  </button>
                  <span className="text-sm text-gray-700">
                    Sayfa {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page === totalPages}
                    className={`relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md bg-white text-gray-700 hover:bg-gray-50 ${
                      page === totalPages ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Sonraki
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Edit Modal */}
      {showEditModal && activeDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Doktor Düzenle</h3>
              
              <form onSubmit={handleUpdateDoctor}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="doctorName">
                    Doktor Adı*
                  </label>
                  <input
                    id="doctorName"
                    type="text"
                    value={activeDoctor.doctorName || ''}
                    onChange={(e) => setActiveDoctor({...activeDoctor, doctorName: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Dr. Ahmet Yılmaz"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="email">
                    E-posta
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={activeDoctor.email}
                    onChange={(e) => setActiveDoctor({...activeDoctor, email: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="phone">
                    Telefon
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    value={activeDoctor.phone}
                    onChange={(e) => setActiveDoctor({...activeDoctor, phone: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editFieldCode">
                    Uzmanlık
                  </label>
                  <select
                    id="editFieldCode"
                    value={activeDoctor.fieldCode}
                    onChange={(e) => setActiveDoctor({...activeDoctor, fieldCode: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Uzmanlık Seçin</option>
                    {Array.isArray(fields) && fields.map(field => (
                      <option key={field.fieldCode} value={field.fieldCode}>{field.fieldName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="editHospitalCode">
                    Hastane
                  </label>
                  <select
                    id="editHospitalCode"
                    value={activeDoctor.hospitalCode}
                    onChange={(e) => setActiveDoctor({...activeDoctor, hospitalCode: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Hastane Seçin</option>
                    {Array.isArray(hospitals) && hospitals.map(hospital => (
                      <option key={hospital.hospitalCode} value={hospital.hospitalCode}>{hospital.hospitalName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    onClick={handleCloseModal}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Güncelle
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Create Modal */}
      {showCreateModal && activeDoctor && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Yeni Doktor Ekle</h3>
              
              <form onSubmit={handleSubmitCreate}>
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newDoctorName">
                    Doktor Adı*
                  </label>
                  <input
                    id="newDoctorName"
                    type="text"
                    value={activeDoctor.doctorName || ''}
                    onChange={(e) => setActiveDoctor({...activeDoctor, doctorName: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    placeholder="Dr. Ahmet Yılmaz"
                    required
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newEmail">
                    E-posta
                  </label>
                  <input
                    id="newEmail"
                    type="email"
                    value={activeDoctor.email}
                    onChange={(e) => setActiveDoctor({...activeDoctor, email: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newPhone">
                    Telefon
                  </label>
                  <input
                    id="newPhone"
                    type="tel"
                    value={activeDoctor.phone}
                    onChange={(e) => setActiveDoctor({...activeDoctor, phone: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newFieldCode">
                    Uzmanlık*
                  </label>
                  <select
                    id="newFieldCode"
                    value={activeDoctor.fieldCode}
                    onChange={(e) => setActiveDoctor({...activeDoctor, fieldCode: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Uzmanlık Seçin</option>
                    {Array.isArray(fields) && fields.map(field => (
                      <option key={field.fieldCode} value={field.fieldCode}>{field.fieldName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="newHospitalCode">
                    Hastane*
                  </label>
                  <select
                    id="newHospitalCode"
                    value={activeDoctor.hospitalCode}
                    onChange={(e) => setActiveDoctor({...activeDoctor, hospitalCode: e.target.value})}
                    className="shadow border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                    required
                  >
                    <option value="">Hastane Seçin</option>
                    {Array.isArray(hospitals) && hospitals.map(hospital => (
                      <option key={hospital.hospitalCode} value={hospital.hospitalCode}>{hospital.hospitalName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    className="bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-2 px-4 rounded"
                    onClick={handleCloseCreateModal}
                  >
                    İptal
                  </button>
                  <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
                  >
                    Oluştur
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

export default ManageDoctors; 