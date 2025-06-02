// API URL Configuration - Environment Aware
// During development, it uses localhost
// During production, it uses the Render backend URL

// For development, always use localhost
// For production, use environment variable or fallback to placeholder
const isDevelopment = !process.env.NODE_ENV || process.env.NODE_ENV === 'development';

const API_URL = isDevelopment 
  ? "http://localhost:8080/api"  // Always use localhost in development
  : (process.env.REACT_APP_API_URL || "https://appointmentsystem-ds5x.onrender.com/api");

// WebSocket URL configuration  
const WS_URL_BASE = isDevelopment
  ? "ws://localhost:8080"  // Always use localhost in development
  : (process.env.REACT_APP_WS_URL || "wss://appointmentsystem-ds5x.onrender.com");

// Kullanıcı koduna göre WebSocket URL'si oluşturma fonksiyonu
const getWsUrl = (userCode) => {
  if (!userCode) {
    console.error("WebSocket bağlantısı için kullanıcı kodu eksik");
    return null;
  }
  
  // URL'yi oluştururken token ekle
  const token = localStorage.getItem('token');
  if (!token) {
    console.error("WebSocket bağlantısı için token eksik");
    return null;
  }
  
  return `${WS_URL_BASE}/ws/user/${userCode}?token=${encodeURIComponent(token)}`;
};

// Debug info
console.log('Environment:', process.env.NODE_ENV);
console.log('Is Development:', isDevelopment);
console.log('API configuration loaded with URL:', API_URL);
console.log('WebSocket base URL:', WS_URL_BASE);

// Export configuration
export { API_URL, WS_URL_BASE, getWsUrl }; 