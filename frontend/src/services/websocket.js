import { WS_URL_BASE, getWsUrl } from '../config/api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.handlers = {
      appointmentCreated: [],
      appointmentCancelled: [],
      appointmentStatusChanged: [],
      notification: [],
      connect: [],
      disconnect: []
    };
    this.reconnectInterval = null;
    this.isConnected = false;
  }

  connect() {
    const token = localStorage.getItem('token');
    const userCode = localStorage.getItem('userId');
    
    if (!token || !userCode) {
      console.error('WebSocket bağlantısı için token veya userCode eksik');
      return;
    }

    try {
      // Kullanıcı koduna göre WebSocket URL'si oluştur
      const wsUrl = getWsUrl(userCode);
      
      if (!wsUrl) {
        console.error('WebSocket URL oluşturulamadı');
        return;
      }
      
      console.log('WebSocket connecting to:', wsUrl);
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        clearInterval(this.reconnectInterval);
        
        // Connect olayı için tüm işleyicileri çağır
        if (this.handlers.connect) {
          this.handlers.connect.forEach(handler => handler());
        }
      };

      this.socket.onmessage = (event) => {
        try {
          console.log('WebSocket mesajı alındı:', event.data);
          const data = JSON.parse(event.data);
          console.log('Ayrıştırılmış veri:', data);
          
          // Mesaj tipi varsa o tip için handlers çağır
          const type = data.type;
          
          if (type && this.handlers[type]) {
            console.log(`'${type}' tipinde olay işleniyor`);
            this.handlers[type].forEach(handler => handler(data));
          } else {
            // Bilinmeyen türdeki mesajlar için genel bildirim olarak işle
            console.log('Bilinmeyen mesaj tipi, genel bildirim olarak işleniyor:', type);
            if (this.handlers.notification) {
              this.handlers.notification.forEach(handler => handler(data));
            }
          }
        } catch (error) {
          console.error('WebSocket mesajını işlerken hata:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
        
        // Disconnect olayı için tüm işleyicileri çağır
        if (this.handlers.disconnect) {
          this.handlers.disconnect.forEach(handler => handler());
        }
        
        this.reconnect();
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.socket.close();
      };
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      this.reconnect();
    }
  }

  reconnect() {
    if (!this.reconnectInterval) {
      this.reconnectInterval = setInterval(() => {
        if (!this.isConnected) {
          this.connect();
        }
      }, 5000); // Try to reconnect every 5 seconds
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.close();
    }
    clearInterval(this.reconnectInterval);
  }

  on(eventType, handler) {
    if (this.handlers[eventType]) {
      this.handlers[eventType].push(handler);
    }
  }

  off(eventType, handler) {
    if (this.handlers[eventType]) {
      this.handlers[eventType] = this.handlers[eventType].filter(h => h !== handler);
    }
  }

  // Manuel olarak test bildirimi gönderme metodu
  sendTestNotification() {
    if (!this.isConnected) {
      console.error('WebSocket bağlantısı kurulamadı, test bildirimi gönderilemiyor');
      return;
    }
    
    const testMessage = {
      type: 'notification',
      title: 'Test Bildirimi',
      message: 'Bu bir test bildirimidir.',
      timestamp: new Date().toISOString()
    };
    
    // Bildirim işleyicilerini çağır
    if (this.handlers.notification) {
      this.handlers.notification.forEach(handler => handler(testMessage));
    }
  }
}

const webSocketService = new WebSocketService();
export default webSocketService; 