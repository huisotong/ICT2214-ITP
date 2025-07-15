import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [showNotification, setShowNotification] = useState(false);
  const { auth } = useAuth();

  const checkForNewNotifications = async () => {
    if (!auth.user?.userID) return;

    try {
      const response = await fetch(`http://localhost:5000/api/credit-requests/user/${auth.user.userID}/approved`);
      if (response.ok) {
        const approvedRequests = await response.json();
        
        // Get previously shown notifications from localStorage
        const shownNotifications = JSON.parse(localStorage.getItem('shownNotifications') || '[]');
        
        // Filter out notifications that have already been shown
        const newNotifications = approvedRequests.filter(
          request => !shownNotifications.includes(request.requestID)
        );

        if (newNotifications.length > 0) {
          setNotifications(newNotifications);
          setShowNotification(true);
          
          // Mark these notifications as shown
          const updatedShownNotifications = [
            ...shownNotifications, 
            ...newNotifications.map(n => n.requestID)
          ];
          localStorage.setItem('shownNotifications', JSON.stringify(updatedShownNotifications));
        }
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Check for notifications when user logs in or component mounts
  useEffect(() => {
    if (auth.user?.userID) {
      checkForNewNotifications();
    }
  }, [auth.user?.userID]);

  const dismissNotification = () => {
    setShowNotification(false);
    setNotifications([]);
  };

  const clearAllShownNotifications = () => {
    localStorage.removeItem('shownNotifications');
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      showNotification,
      dismissNotification,
      checkForNewNotifications,
      clearAllShownNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};
