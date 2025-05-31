import React, { createContext, useState, useEffect, useContext } from 'react';
import webSocketService from '../services/websocket';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated, currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      console.log('Kullanıcı giriş yapmadı, WebSocket bağlantısı kurulmayacak');
      return;
    }
    
    console.log('WebSocket bağlantısı kuruluyor, kullanıcı bilgileri:', {
      isAuthenticated,
      userId: localStorage.getItem('userId'),
      tokenExists: !!localStorage.getItem('token')
    });

    // WebSocket servisine bağlantı durumu için dinleyici ekle
    const handleConnect = () => {
      console.log('WebSocket bağlantısı başarılı');
      setConnected(true);
    };

    const handleDisconnect = () => {
      console.log('WebSocket bağlantısı kesildi');
      setConnected(false);
    };

    webSocketService.on('connect', handleConnect);
    webSocketService.on('disconnect', handleDisconnect);

    // Connect to WebSocket
    webSocketService.connect();

    // Set up event listeners
    const handleAppointmentCreated = (payload) => {
      console.log('Randevu oluşturuldu bildirimi alındı:', payload);
      
      const notification = {
        id: `appointment-created-${Date.now()}`,
        type: 'appointmentCreated',
        title: payload.title || 'Yeni Randevu',
        message: payload.message || `Dr. ${payload.doctorName || 'Bilinmeyen'} ile ${payload.date || 'belirtilmemiş tarihte'} tarihinde saat ${payload.time || 'belirtilmemiş saatte'} için randevunuz oluşturuldu.`,
        data: payload,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleAppointmentCancelled = (payload) => {
      console.log('Randevu iptal bildirimi alındı:', payload);
      
      const notification = {
        id: `appointment-cancelled-${Date.now()}`,
        type: 'appointmentCancelled',
        title: payload.title || 'Randevu İptal Edildi',
        message: payload.message || `Dr. ${payload.doctorName || 'Bilinmeyen'} ile ${payload.date || 'belirtilmemiş tarihte'} tarihinde saat ${payload.time || 'belirtilmemiş saatte'} için randevunuz iptal edildi.`,
        data: payload,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleStatusChanged = (payload) => {
      console.log('Randevu durumu değişti bildirimi alındı:', payload);
      
      const notification = {
        id: `status-changed-${Date.now()}`,
        type: 'status_changed',
        title: payload.title || 'Randevu Durumu Değişti',
        message: payload.message || `Randevunuzun durumu "${payload.oldStatus || 'Önceki'}" → "${payload.newStatus || 'Yeni'}" olarak güncellendi.`,
        data: payload,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleNotification = (payload) => {
      console.log('Genel bildirim alındı:', payload);
      
      // Payload'ı direkt bir bildirim olarak işle
      const notification = {
        id: payload.id || `notification-${Date.now()}`,
        type: payload.type || 'notification',
        title: payload.title || 'Bildirim',
        message: payload.message || 'Yeni bir bildiriminiz var.',
        data: payload,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    // Direkt olarak mesaj dinleyicisi, gerekirse mesaj tipine göre dağıtım yap
    const handleMessage = (event) => {
      try {
        console.log('WebSocket mesajı alındı:', event.data);
        const data = JSON.parse(event.data);
        
        // Mesaj tipine göre uygun işleyiciye yönlendir
        // Öncelikle bu mesajın zaten işlenip işlenmediğini kontrol et
        const uniqueMessageId = `${data.type}-${data.id || data.appointmentId || Date.now()}`;
        const isDuplicate = notifications.some(n => 
          n.id === uniqueMessageId || 
          (n.data && data.appointmentId && n.data.appointmentId === data.appointmentId && 
           n.type === data.type && Math.abs(new Date(n.timestamp) - new Date(data.timestamp || Date.now())) < 3000)
        );
        
        if (isDuplicate) {
          console.log('Yinelenen bildirim algılandı, işlenmeyecek:', data);
          return;
        }
        
        switch(data.type) {
          case 'appointmentCreated':
            handleAppointmentCreated({...data, id: uniqueMessageId});
            break;
          case 'appointmentCancelled':
            handleAppointmentCancelled({...data, id: uniqueMessageId});
            break;
          case 'status_changed':
            handleStatusChanged({...data, id: uniqueMessageId});
            break;
          case 'notification':
            handleNotification({...data, id: uniqueMessageId});
            break;
          default:
            // Bilinmeyen mesaj tipi, genel bildirim olarak işle
            handleNotification({...data, id: uniqueMessageId});
        }
      } catch (error) {
        console.error('WebSocket mesajı işlenirken hata:', error);
      }
    };
    
    // WebSocket mesaj işleme için olay dinleyicisi ekle
    if (webSocketService.socket) {
      webSocketService.socket.addEventListener('message', handleMessage);
    }
    
    // Register event handlers
    webSocketService.on('appointmentCreated', handleAppointmentCreated);
    webSocketService.on('appointmentCancelled', handleAppointmentCancelled);
    webSocketService.on('appointmentStatusChanged', handleStatusChanged);
    webSocketService.on('notification', handleNotification);
    
    // Clean up on unmount
    return () => {
      webSocketService.off('connect', handleConnect);
      webSocketService.off('disconnect', handleDisconnect);
      webSocketService.off('appointmentCreated', handleAppointmentCreated);
      webSocketService.off('appointmentCancelled', handleAppointmentCancelled);
      webSocketService.off('appointmentStatusChanged', handleStatusChanged);
      webSocketService.off('notification', handleNotification);
      
      if (webSocketService.socket) {
        webSocketService.socket.removeEventListener('message', handleMessage);
      }
      
      webSocketService.disconnect();
    };
  }, [isAuthenticated, currentUser]);

  const addNotification = (notification) => {
    // Yinelenen bildirimleri filtrele
    const isDuplicate = notifications.some(n => 
      n.id === notification.id || 
      (n.data && notification.data && 
       n.data.appointmentId === notification.data.appointmentId && 
       n.type === notification.type && 
       Math.abs(new Date(n.timestamp) - new Date(notification.timestamp)) < 3000)
    );
    
    if (isDuplicate) {
      console.log('Yinelenen bildirim eklenmeyecek:', notification);
      return;
    }
    
    console.log('Bildirim ekleniyor:', notification);
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Optional: Display a toast notification
    showToastNotification(notification);
  };

  const showToastNotification = (notification) => {
    // You can implement toast notifications here
    // For now, just log to console
    console.log('Yeni bildirim:', notification);
    
    // Tarayıcı bildirimi göstermeyi deneyebiliriz (kullanıcı izin verirse)
    if (Notification && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message
      });
    } else if (Notification && Notification.permission !== 'denied') {
      // İzin iste
      Notification.requestPermission();
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
    
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notif => ({ ...notif, read: true }))
    );
    
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  const value = {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    clearNotifications,
    connected
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};

export default NotificationsContext; 