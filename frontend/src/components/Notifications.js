import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';
import webSocketService from '../services/websocket';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications, connected } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleTestNotification = () => {
    webSocketService.sendTestNotification();
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'appointmentCreated' || 
        notification.type === 'appointmentCancelled' || 
        notification.type === 'status_changed') {
      navigate('/profile'); // Navigate to profile/appointments page
    }
    
    setIsOpen(false);
  };

  const formatTime = (timestamp) => {
    try {
      return format(new Date(timestamp), 'HH:mm');
    } catch (e) {
      return '';
    }
  };

  const formatDate = (timestamp) => {
    try {
      return format(new Date(timestamp), 'dd.MM.yyyy');
    } catch (e) {
      return '';
    }
  };
  
  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'appointmentCreated':
        return <i className="fas fa-calendar-plus text-green-500"></i>;
      case 'appointmentCancelled':
        return <i className="fas fa-calendar-times text-red-500"></i>;
      case 'status_changed':
        return <i className="fas fa-exchange-alt text-blue-500"></i>;
      default:
        return <i className="fas fa-bell text-blue-400"></i>;
    }
  };

  // Notification ikonu için yeni stil - direkt DOM elementi olarak
  const NotificationIcon = () => (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: '32px',
      height: '32px',
      position: 'relative',
      cursor: 'pointer',
      marginRight: '2px'
    }}>
      {/* Farklı bir ikon deneyelim - inbox/envelope yerine */}
      <i 
        className="fas fa-envelope" 
        style={{
          fontSize: '22px',
          color: '#FFFFFF',
          display: 'block'
        }}
      />
      
      {/* Okunmamış bildirim sayısı */}
      {unreadCount > 0 && (
        <div style={{
          position: 'absolute',
          top: '-5px',
          right: '-5px',
          backgroundColor: '#EF4444',
          color: 'white',
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          border: '2px solid #1e40af'
        }}>
          {unreadCount > 9 ? '9+' : unreadCount}
        </div>
      )}
    </div>
  );

  return (
    <div className="relative" ref={dropdownRef}>
      {/* İkon butonu */}
      <button 
        style={{
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          padding: '0',
          display: 'flex',
          alignItems: 'center'
        }}
        onClick={toggleDropdown}
        aria-label="Bildirimler"
        title={connected ? 'Bildirimler' : 'Bildirim sistemi bağlantısı kurulamadı'}
      >
        <NotificationIcon />
      </button>
      
      {/* Açılır panel */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          right: '0',
          marginTop: '8px',
          width: '380px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
          zIndex: 50,
          overflow: 'hidden',
          border: '1px solid #E5E7EB'
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '16px',
            borderBottom: '1px solid #E5E7EB',
            backgroundColor: '#F9FAFB'
          }}>
            <h3 style={{ fontWeight: 600, color: '#111827', fontSize: '18px' }}>Bildirimler</h3>
            <div style={{ display: 'flex', gap: '8px' }}>
              {unreadCount > 0 && (
                <button 
                  style={{ fontSize: '12px', color: '#2563EB', fontWeight: 500 }}
                  onClick={markAllAsRead}
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  style={{ fontSize: '12px', color: '#DC2626', fontWeight: 500 }}
                  onClick={clearNotifications}
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
          
          <div style={{
            padding: '8px', 
            backgroundColor: '#F9FAFB', 
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px'
          }}>
            <span style={{ 
              display: 'flex', 
              alignItems: 'center',
              color: connected ? '#059669' : '#DC2626',
              fontWeight: 500
            }}>
              <i className={`fas fa-circle mr-1 ${connected ? 'text-green-500' : 'text-red-500'}`} style={{ fontSize: '10px', marginRight: '4px' }}></i>
              {connected ? 'Bildirim sistemi aktif' : 'Bildirim sistemi bağlantısı kesildi'}
            </span>
            
            <button 
              onClick={handleTestNotification}
              style={{
                fontSize: '12px',
                backgroundColor: '#3B82F6',
                color: 'white',
                padding: '4px 8px',
                borderRadius: '4px',
                fontWeight: 500,
                cursor: connected ? 'pointer' : 'not-allowed',
                opacity: connected ? 1 : 0.5
              }}
              disabled={!connected}
            >
              Test
            </button>
          </div>
          
          <div style={{ maxHeight: '384px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ 
                padding: '64px 16px', 
                textAlign: 'center', 
                color: '#6B7280'
              }}>
                <i className="fas fa-envelope-open" style={{ fontSize: '32px', marginBottom: '12px', color: '#D1D5DB' }}></i>
                <p style={{ fontWeight: 500 }}>Bildiriminiz bulunmuyor</p>
                <p style={{ fontSize: '14px', color: '#9CA3AF', marginTop: '4px' }}>Yeni bildirimler burada görünecek</p>
              </div>
            ) : (
              <ul style={{ borderTop: '1px solid #F3F4F6' }}>
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    style={{
                      padding: '16px',
                      backgroundColor: notification.read ? 'white' : '#EFF6FF',
                      borderBottom: '1px solid #F3F4F6',
                      cursor: 'pointer',
                      transition: 'background-color 0.15s'
                    }}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                      <div style={{ 
                        flexShrink: 0, 
                        marginRight: '12px',
                        marginTop: '4px', 
                        padding: '8px',
                        borderRadius: '9999px', 
                        backgroundColor: '#F3F4F6' 
                      }}>
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <p style={{ 
                            fontSize: '14px', 
                            fontWeight: 500, 
                            color: '#111827',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}>
                            {notification.title}
                          </p>
                          <span style={{ 
                            fontSize: '12px', 
                            color: '#6B7280',
                            whiteSpace: 'nowrap',
                            marginLeft: '8px'
                          }}>
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p style={{ 
                          fontSize: '14px', 
                          color: '#4B5563',
                          marginTop: '4px' 
                        }}>
                          {notification.message}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: '#9CA3AF',
                          marginTop: '4px' 
                        }}>
                          {formatDate(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Notifications; 