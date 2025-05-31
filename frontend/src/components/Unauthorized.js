import React from 'react';
import { Link } from 'react-router-dom';

const Unauthorized = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
      <div className="text-6xl text-red-600 mb-4">
        <i className="fas fa-exclamation-circle"></i>
        ⚠️
      </div>
      <h1 className="text-3xl font-bold text-gray-800 mb-4">Erişim Reddedildi</h1>
      <p className="text-xl text-gray-600 mb-8 text-center">
        Bu sayfaya erişim izniniz bulunmamaktadır.
      </p>
      <div className="flex space-x-4">
        <Link 
          to="/" 
          className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
        >
          Ana Sayfa
        </Link>
        <Link 
          to="/login" 
          className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline"
        >
          Giriş Yap
        </Link>
      </div>
    </div>
  );
};

export default Unauthorized; 