import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../contexts/NotificationsContext';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const Notifications = () => {
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useNotifications();
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

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    
    // Navigate based on notification type
    if (notification.type === 'appointment_created' || 
        notification.type === 'appointment_cancelled' || 
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
      case 'appointment_created':
        return <i className="fas fa-calendar-plus text-green-500"></i>;
      case 'appointment_cancelled':
        return <i className="fas fa-calendar-times text-red-500"></i>;
      case 'status_changed':
        return <i className="fas fa-exchange-alt text-blue-500"></i>;
      default:
        return <i className="fas fa-bell text-blue-400"></i>;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="relative p-2 text-gray-600 hover:text-primary focus:outline-none"
        onClick={toggleDropdown}
        aria-label="Notifications"
      >
        <i className="fas fa-bell text-xl"></i>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Bildirimler</h3>
            <div className="flex space-x-2">
              {unreadCount > 0 && (
                <button 
                  className="text-xs text-blue-600 hover:text-blue-800"
                  onClick={markAllAsRead}
                >
                  Tümünü Okundu İşaretle
                </button>
              )}
              {notifications.length > 0 && (
                <button 
                  className="text-xs text-red-600 hover:text-red-800"
                  onClick={clearNotifications}
                >
                  Temizle
                </button>
              )}
            </div>
          </div>
          
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-gray-500">
                <i className="fas fa-inbox text-3xl mb-2 text-gray-300"></i>
                <p>Bildiriminiz bulunmuyor</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <li 
                    key={notification.id}
                    className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors duration-150 ${
                      notification.read ? 'bg-white' : 'bg-blue-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {notification.title}
                          </p>
                          <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                            {formatTime(notification.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
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