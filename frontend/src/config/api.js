// API URL Configuration - Environment Aware
// During development, it uses localhost
// During production, it uses the Render backend URL

// Check if we're in production and if REACT_APP_API_URL is set
const API_URL = process.env.REACT_APP_API_URL || 
  (process.env.NODE_ENV === 'production' 
    ? "https://your-render-app-name.onrender.com/api"  // Replace this with your actual Render URL
    : "http://localhost:8080/api");

// WebSocket URL configuration  
const WS_URL_BASE = process.env.REACT_APP_WS_URL || 
  (process.env.NODE_ENV === 'production'
    ? "wss://your-render-app-name.onrender.com"        // Replace this with your actual Render URL
    : "ws://localhost:8080");

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
console.log('API configuration loaded with URL:', API_URL);
console.log('WebSocket base URL:', WS_URL_BASE);

// Export configuration
export { API_URL, WS_URL_BASE, getWsUrl }; 