// API URL Configuration
const API_URL = "http://localhost:8080/api";
// WS_URL artık direkt bir URL yerine, kullanıcı kodunu dahil edebilmek için bir fonksiyon
const WS_URL_BASE = "ws://localhost:8080";

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
console.log('API configuration loaded with URL:', API_URL);

// For development, can use alternative endpoints
// const API_URL = "http://127.0.0.1:8080/api";

export { API_URL, WS_URL_BASE, getWsUrl }; 