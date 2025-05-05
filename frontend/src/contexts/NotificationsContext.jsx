import React, { createContext, useState, useEffect, useContext } from 'react';
import webSocketService from '../services/websocket';
import { useAuth } from './AuthContext';

const NotificationsContext = createContext();

export const NotificationsProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      return; // Don't connect if not logged in
    }

    // Connect to WebSocket
    webSocketService.connect();

    // Set up event listeners
    const handleAppointmentCreated = (payload) => {
      const notification = {
        id: `appointment-created-${Date.now()}`,
        type: 'appointment_created',
        title: 'Yeni Randevu',
        message: `Dr. ${payload.doctorName} ile ${payload.date} tarihinde saat ${payload.time} için randevunuz oluşturuldu.`,
        data: payload,
        read: false,
        timestamp: new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleAppointmentCancelled = (payload) => {
      const notification = {
        id: `appointment-cancelled-${Date.now()}`,
        type: 'appointment_cancelled',
        title: 'Randevu İptal Edildi',
        message: `Dr. ${payload.doctorName} ile ${payload.date} tarihinde saat ${payload.time} için randevunuz iptal edildi.`,
        data: payload,
        read: false,
        timestamp: new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleStatusChanged = (payload) => {
      const notification = {
        id: `status-changed-${Date.now()}`,
        type: 'status_changed',
        title: 'Randevu Durumu Değişti',
        message: `Randevunuzun durumu "${payload.oldStatus}" → "${payload.newStatus}" olarak güncellendi.`,
        data: payload,
        read: false,
        timestamp: new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    const handleNotification = (payload) => {
      const notification = {
        id: payload.id || `notification-${Date.now()}`,
        type: payload.type || 'notification',
        title: payload.title || 'Bildirim',
        message: payload.message,
        data: payload,
        read: false,
        timestamp: payload.timestamp || new Date().toISOString()
      };
      
      addNotification(notification);
    };
    
    // Register event handlers
    webSocketService.on('appointmentCreated', handleAppointmentCreated);
    webSocketService.on('appointmentCancelled', handleAppointmentCancelled);
    webSocketService.on('appointmentStatusChanged', handleStatusChanged);
    webSocketService.on('notification', handleNotification);
    
    // Clean up on unmount
    return () => {
      webSocketService.off('appointmentCreated', handleAppointmentCreated);
      webSocketService.off('appointmentCancelled', handleAppointmentCancelled);
      webSocketService.off('appointmentStatusChanged', handleStatusChanged);
      webSocketService.off('notification', handleNotification);
    };
  }, [isAuthenticated]);

  const addNotification = (notification) => {
    setNotifications(prev => [notification, ...prev]);
    setUnreadCount(prev => prev + 1);
    
    // Optional: Display a toast notification
    showToastNotification(notification);
  };

  const showToastNotification = (notification) => {
    // You can implement toast notifications here
    // For now, just log to console
    console.log('New notification:', notification);
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
    clearNotifications
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