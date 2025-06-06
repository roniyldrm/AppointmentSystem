import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUserProfile, updateUserProfile, changePassword } from '../services/api';

const UserAccount = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    birthDate: '',
    gender: '',
    bloodType: '',
    height: '',
    weight: '',
    allergies: '',
    chronicDiseases: '',
    currentMedications: ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [editMode, setEditMode] = useState(false);

  // Get user data from localStorage (saved during registration/login)
  useEffect(() => {
    const getUserData = () => {
      const userCode = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const userFirstName = localStorage.getItem('userFirstName');
      const userLastName = localStorage.getItem('userLastName');
      const userPhone = localStorage.getItem('userPhone');
      
      if (userCode) {
        setLoading(true);
        getUserProfile(userCode)
          .then(profileData => {
            if (profileData) {
              // Update form with profile data, prioritizing stored data from registration
              setFormData({
                firstName: profileData.firstName || userFirstName || '',
                lastName: profileData.lastName || userLastName || '',
                email: profileData.email || userEmail || '',
                phone: profileData.phone || userPhone || '',
                address: profileData.address || '',
                birthDate: profileData.birthDate || '',
                gender: profileData.gender || '',
                bloodType: profileData.bloodType || '',
                height: profileData.height || '',
                weight: profileData.weight || '',
                allergies: profileData.allergies || '',
                chronicDiseases: profileData.chronicDiseases || '',
                currentMedications: profileData.currentMedications || ''
              });
              console.log('Profile data loaded:', profileData);
            } else {
              // If no profile data found, use registration data
              setFormData({
                firstName: userFirstName || '',
                lastName: userLastName || '',
                email: userEmail || '',
                phone: userPhone || '',
                address: '',
                birthDate: '',
                gender: '',
                bloodType: '',
                height: '',
                weight: '',
                allergies: '',
                chronicDiseases: '',
                currentMedications: ''
              });
              console.log('No profile data found, using registration data');
            }
          })
          .catch(err => {
            console.error('Error fetching profile:', err);
            setError('An error occurred while loading profile information.');
            
            // Fall back to registration data if profile fetch fails
            setFormData({
              firstName: userFirstName || '',
              lastName: userLastName || '',
              email: userEmail || '',
              phone: userPhone || '',
              address: '',
              birthDate: '',
              gender: '',
              bloodType: '',
              height: '',
              weight: '',
              allergies: '',
              chronicDiseases: '',
              currentMedications: ''
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    };

    getUserData();
  }, []);

  const handleChange = (e) => {
    if (!editMode) return;
    
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaveLoading(true);
      setError('');
      
      const userCode = localStorage.getItem('userId');
      if (!userCode) {
        throw new Error('User identifier not found. Please log in again.');
      }
      
      // Call the API to update the profile
      await updateUserProfile(userCode, formData);
      
      setSuccess(true);
      setEditMode(false); // Exit edit mode after saving
      setTimeout(() => setSuccess(false), 3000);
      console.log('Profile updated successfully');
    } catch (err) {
      setError('An error occurred while updating profile. Please try again.');
      console.error('Error updating profile:', err);
    } finally {
      setSaveLoading(false);
    }
  };
  
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError('');
    
    // Validate passwords
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    
    try {
      setPasswordLoading(true);
      const userCode = localStorage.getItem('userId');
      
      if (!userCode) {
        throw new Error('User identifier not found.');
      }
      
      await changePassword(userCode, passwordData.currentPassword, passwordData.newPassword);
      
      // Reset password fields
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setPasswordSuccess(true);
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError('Password change failed. Please check your current password.');
      console.error('Password change error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };
  
  const toggleEditMode = () => {
    setEditMode(!editMode);
    if (editMode) {
      // If canceling edit mode, reset to the original data by refetching
      const userCode = localStorage.getItem('userId');
      const userEmail = localStorage.getItem('userEmail');
      const userFirstName = localStorage.getItem('userFirstName');
      const userLastName = localStorage.getItem('userLastName');
      const userPhone = localStorage.getItem('userPhone');
      
      if (userCode) {
        setLoading(true);
        getUserProfile(userCode)
          .then(profileData => {
            if (profileData) {
              setFormData({
                firstName: profileData.firstName || userFirstName || '',
                lastName: profileData.lastName || userLastName || '',
                email: profileData.email || userEmail || '',
                phone: profileData.phone || userPhone || '',
                address: profileData.address || '',
                birthDate: profileData.birthDate || '',
                gender: profileData.gender || '',
                bloodType: profileData.bloodType || '',
                height: profileData.height || '',
                weight: profileData.weight || '',
                allergies: profileData.allergies || '',
                chronicDiseases: profileData.chronicDiseases || '',
                currentMedications: profileData.currentMedications || ''
              });
            } else {
              // If no profile data, use registration data
              setFormData({
                firstName: userFirstName || '',
                lastName: userLastName || '',
                email: userEmail || '',
                phone: userPhone || '',
                address: '',
                birthDate: '',
                gender: '',
                bloodType: '',
                height: '',
                weight: '',
                allergies: '',
                chronicDiseases: '',
                currentMedications: ''
              });
            }
          })
          .catch(err => {
            console.error('Error resetting profile data:', err);
            // Fall back to registration data
            setFormData({
              firstName: userFirstName || '',
              lastName: userLastName || '',
              email: userEmail || '',
              phone: userPhone || '',
              address: '',
              birthDate: '',
              gender: '',
              bloodType: '',
              height: '',
              weight: '',
              allergies: '',
              chronicDiseases: '',
              currentMedications: ''
            });
          })
          .finally(() => {
            setLoading(false);
          });
      }
    }
  };

  if (loading) {
    return (
      <div className="app-container">
        <div className="card max-w-5xl mx-auto">
          <div className="card-header">
            <h1 className="page-title">My Profile</h1>
          </div>
          <div className="card-body flex justify-center items-center py-16">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full border-4 border-primary border-t-transparent animate-spin mb-3"></div>
              <p className="text-gray-500">Loading profile information...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Define common input field styling
  const getFieldStyle = () => {
    return !editMode 
      ? 'form-input bg-gray-100 cursor-not-allowed opacity-75' 
      : 'form-input';
  };

  return (
    <div className="app-container">
      <div className="card max-w-5xl mx-auto">
        <div className="card-header">
          <h1 className="page-title">My Profile</h1>
          <div className="text-sm text-gray-500">Manage and update your personal information</div>
        </div>
        
        <div className="card-body">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-exclamation-circle text-red-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              </div>
            </div>
          )}
          
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <i className="fas fa-check-circle text-green-400"></i>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium">Your profile information has been successfully updated!</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tabs */}
          <div className="mb-6 border-b border-gray-200">
            <div className="flex -mb-px space-x-4">
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'profile'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('profile')}
              >
                <i className="fas fa-user mr-2"></i>
                <span>Personal Information</span>
              </button>
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'medical'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('medical')}
              >
                <i className="fas fa-heartbeat mr-2"></i>
                <span>Health Information</span>
              </button>
              <button
                className={`px-4 py-2 font-medium border-b-2 transition-colors ${
                  activeTab === 'security'
                    ? 'text-primary border-primary'
                    : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                }`}
                onClick={() => setActiveTab('security')}
              >
                <i className="fas fa-lock mr-2"></i>
                <span>Security</span>
              </button>
            </div>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label htmlFor="firstName" className="form-label">First Name</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="Your first name"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label htmlFor="lastName" className="form-label">Last Name</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="Your last name"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label htmlFor="email" className="form-label">Email</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="example@email.com"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label htmlFor="phone" className="form-label">Phone</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="0555 123 4567"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="address" className="form-label">Address</label>
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={`h-24 ${getFieldStyle()}`}
                  placeholder="Your address"
                  readOnly={!editMode}
                  tabIndex={!editMode ? -1 : 0}
                ></textarea>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <label htmlFor="birthDate" className="form-label">Birth Date</label>
                  <input
                    type="date"
                    id="birthDate"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
                <div className="w-full md:w-1/2">
                  <label htmlFor="gender" className="form-label">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    disabled={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  >
                    <option value="">Select</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-between">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={toggleEditMode}
                      className="btn btn-outline"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="btn btn-primary ml-auto"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit My Information
                  </button>
                )}
              </div>
            </form>
          )}
          
          {/* Medical Tab */}
          {activeTab === 'medical' && (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/3">
                  <label htmlFor="bloodType" className="form-label">Blood Type</label>
                  <select
                    id="bloodType"
                    name="bloodType"
                    value={formData.bloodType}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    disabled={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="0+">0+</option>
                    <option value="0-">0-</option>
                  </select>
                </div>
                <div className="w-full md:w-1/3">
                  <label htmlFor="height" className="form-label">Height (cm)</label>
                  <input
                    type="number"
                    id="height"
                    name="height"
                    value={formData.height}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="175"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
                <div className="w-full md:w-1/3">
                  <label htmlFor="weight" className="form-label">Weight (kg)</label>
                  <input
                    type="number"
                    id="weight"
                    name="weight"
                    value={formData.weight}
                    onChange={handleChange}
                    className={getFieldStyle()}
                    placeholder="70"
                    readOnly={!editMode}
                    tabIndex={!editMode ? -1 : 0}
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="allergies" className="form-label">Allergies</label>
                <textarea
                  id="allergies"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  className={`h-20 ${getFieldStyle()}`}
                  placeholder="Your known allergies"
                  readOnly={!editMode}
                  tabIndex={!editMode ? -1 : 0}
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="chronicDiseases" className="form-label">Chronic Diseases</label>
                <textarea
                  id="chronicDiseases"
                  name="chronicDiseases"
                  value={formData.chronicDiseases}
                  onChange={handleChange}
                  className={`h-20 ${getFieldStyle()}`}
                  placeholder="Your chronic diseases"
                  readOnly={!editMode}
                  tabIndex={!editMode ? -1 : 0}
                ></textarea>
              </div>
              
              <div>
                <label htmlFor="currentMedications" className="form-label">Current Medications</label>
                <textarea
                  id="currentMedications"
                  name="currentMedications"
                  value={formData.currentMedications}
                  onChange={handleChange}
                  className={`h-20 ${getFieldStyle()}`}
                  placeholder="Medications you regularly take"
                  readOnly={!editMode}
                  tabIndex={!editMode ? -1 : 0}
                ></textarea>
              </div>
              
              <div className="flex justify-between">
                {editMode ? (
                  <>
                    <button
                      type="button"
                      onClick={toggleEditMode}
                      className="btn btn-outline"
                    >
                      <i className="fas fa-times mr-2"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={saveLoading}
                    >
                      {saveLoading ? (
                        <>
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Updating...
                        </>
                      ) : (
                        <>
                          <i className="fas fa-save mr-2"></i>
                          Save Changes
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={toggleEditMode}
                    className="btn btn-primary ml-auto"
                  >
                    <i className="fas fa-edit mr-2"></i>
                    Edit My Information
                  </button>
                )}
              </div>
            </form>
          )}
          
          {/* Security Tab */}
          {activeTab === 'security' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-6">
              {passwordError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-exclamation-circle text-red-400"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">{passwordError}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {passwordSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <i className="fas fa-check-circle text-green-400"></i>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm font-medium">Your password has been successfully updated!</p>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <i className="fas fa-info-circle text-yellow-500"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm">
                      You need to enter your current password and new password to change your password.
                    </p>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="currentPassword" className="form-label">Current Password</label>
                <input
                  type="password"
                  id="currentPassword"
                  name="currentPassword"
                  value={passwordData.currentPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              
              <div>
                <label htmlFor="newPassword" className="form-label">New Password</label>
                <input
                  type="password"
                  id="newPassword"
                  name="newPassword"
                  value={passwordData.newPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="••••••••"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Your password must be at least 6 characters long.
                </p>
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="form-label">New Password (Repeat)</label>
                <input
                  type="password"
                  id="confirmPassword"
                  name="confirmPassword"
                  value={passwordData.confirmPassword}
                  onChange={handlePasswordChange}
                  className="form-input"
                  placeholder="••••••••"
                />
              </div>
              
              <div className="p-4 bg-blue-50 text-blue-800 rounded-lg">
                <h3 className="font-medium mb-2">Two-Factor Authentication</h3>
                <div className="flex items-center">
                  <div className="form-switch">
                    <input type="checkbox" id="twoFactorAuth" className="form-switch-checkbox" />
                    <label htmlFor="twoFactorAuth" className="form-switch-label"></label>
                  </div>
                  <span className="ml-2 text-sm">Enable two-factor authentication</span>
                </div>
                <p className="text-xs mt-2">
                  Two-factor authentication requires an additional verification code sent to your phone when logging in to increase your account security.
                </p>
              </div>
              
              <div className="text-right">
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Updating...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-lock mr-2"></i>
                      Update My Password
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        <div className="card-footer">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center">
            <button 
              onClick={() => navigate('/patient/profile')} 
              className="btn btn-outline mt-3 sm:mt-0"
            >
              <i className="fas fa-calendar-check mr-1"></i>
              Go to My Appointments
            </button>
            
            <button 
              onClick={() => navigate('/')} 
              className="btn btn-secondary"
            >
              <i className="fas fa-home mr-1"></i>
              Home
            </button>
          </div>
        </div>
      </div>
      
      <style jsx global>{`
        .form-label {
          @apply block text-sm font-medium text-gray-700 mb-1;
        }
        .form-input {
          @apply block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm 
                 placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary;
        }
        .form-switch {
          @apply relative inline-flex items-center cursor-pointer;
        }
        .form-switch-checkbox {
          @apply sr-only;
        }
        .form-switch-label {
          @apply bg-gray-200 rounded-full w-11 h-6 cursor-pointer;
        }
        .form-switch-label:after {
          content: "";
          @apply absolute top-0.5 left-0.5 bg-white rounded-full h-5 w-5 transition-all;
        }
        .form-switch-checkbox:checked + .form-switch-label {
          @apply bg-primary;
        }
        .form-switch-checkbox:checked + .form-switch-label:after {
          @apply transform translate-x-5;
        }
      `}</style>
    </div>
  );
};

export default UserAccount; 