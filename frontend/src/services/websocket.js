import { WS_URL } from '../config/api';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.handlers = {
      appointmentCreated: [],
      appointmentCancelled: [],
      appointmentStatusChanged: [],
      notification: []
    };
    this.reconnectInterval = null;
    this.isConnected = false;
  }

  connect() {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      this.socket = new WebSocket(`${WS_URL}?token=${token}`);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        clearInterval(this.reconnectInterval);
      };

      this.socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          const { type, payload } = data;

          if (this.handlers[type]) {
            this.handlers[type].forEach(handler => handler(payload));
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      this.socket.onclose = () => {
        console.log('WebSocket disconnected');
        this.isConnected = false;
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
}

const webSocketService = new WebSocketService();
export default webSocketService; 