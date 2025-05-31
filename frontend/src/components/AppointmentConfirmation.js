import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const AppointmentConfirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { doctor, date, timeSlot } = location.state || {};
  
  // If no appointment data is available, redirect to appointment booking
  if (!doctor || !date || !timeSlot) {
    navigate('/appointment');
    return null;
  }
  
  // Format date and time for display
  const formatDate = (dateString) => {
    const dateObj = new Date(dateString);
    return format(dateObj, 'd MMMM yyyy, EEEE', { locale: tr });
  };
  
  const formatTime = (time) => {
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes}`;
  };
  
  // Add the field name mapping function
  const getFieldNameFromCode = (fieldCode) => {
    if (!fieldCode) return null;
    
    const fieldNameMap = {
      1: "Dahiliye",
      2: "Çocuk Sağlığı ve Hastalıkları",
      3: "Kulak Burun Boğaz Hastalıkları",
      4: "Göz Hastalıkları",
      5: "Kadın Hastalıkları ve Doğum",
      6: "Ortopedi ve Travmatoloji",
      7: "Genel Cerrahi",
      8: "Deri ve Zührevi Hastalıkları",
      9: "Nöroloji",
      10: "Kardiyoloji"
    };
    
    return fieldNameMap[fieldCode] || `Field ${fieldCode}`;
  };
  
  return (
    <div className="bg-gray-50 min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md p-8 max-w-2xl mx-auto">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-green-500 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Randevu Onaylandı</h1>
            <p className="text-gray-600 mt-2">Randevunuz başarıyla oluşturuldu.</p>
          </div>
          
          <div className="border-t border-b border-gray-200 py-4 mb-6">
            <div className="flex flex-col md:flex-row md:justify-between">
              <div className="mb-4 md:mb-0">
                <h2 className="text-lg font-semibold text-gray-700">Randevu Detayları</h2>
                <p className="text-gray-600 mt-1">Lütfen randevunuzdan 15 dakika önce gelmeye özen gösterin.</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  Onay Kodu #: {Math.random().toString(36).substring(2, 10).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Doktor</h3>
              <p className="text-gray-800 font-medium">
                {doctor.doctorName ? (
                  `Dr. ${doctor.doctorName}`
                ) : (
                  `Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`
                )}
              </p>
              <p className="text-gray-600">{doctor.fieldName || (doctor.field && getFieldNameFromCode(doctor.field)) || 'Uzmanlık belirtilmemiş'}</p>
              <p className="text-gray-600">{doctor.hospitalName || 'Hastane belirtilmemiş'}</p>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-2">Tarih & Saat</h3>
              <p className="text-gray-800 font-medium">{formatDate(date)}</p>
              <p className="text-gray-600">
                {formatTime(timeSlot.startTime)} - {formatTime(timeSlot.endTime)}
              </p>
            </div>
          </div>
          
          <div className="mb-8 p-4 bg-blue-50 rounded-lg">
            <h3 className="text-sm font-medium text-blue-700 mb-2">Önemli Bilgiler</h3>
            <ul className="text-sm text-blue-600 space-y-1">
              <li>• Lütfen kimlik ve sağlık sigorta kartınızı getirin.</li>
              <li>• Randevunuzdan 15 dakika önce gelmeye özen gösterin.</li>
              <li>• Randevunuzu planlanan saatten 24 saat öncesine kadar iptal edebilirsiniz.</li>
              <li>• Hastane ziyaretiniz sırasında maske takın.</li>
            </ul>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between">
            <button
              onClick={() => navigate('/patient/profile')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded mb-3 sm:mb-0"
            >
              <i className="fas fa-calendar-check mr-1"></i> Randevularım
            </button>
            
            <button
              onClick={() => navigate('/')}
              className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-6 rounded"
            >
              <i className="fas fa-home mr-1"></i> Ana Sayfa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppointmentConfirmation; 