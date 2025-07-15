import React from 'react';
import { useNotifications } from '../../context/NotificationContext';

const NotificationPopup = () => {
  const { notifications, showNotification, dismissNotification } = useNotifications();

  if (!showNotification || notifications.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-green-600">
            🎉 Credit Request{notifications.length > 1 ? 's' : ''} Approved!
          </h3>
          <button
            onClick={dismissNotification}
            className="text-gray-400 hover:text-gray-600 text-xl font-bold"
          >
            ×
          </button>
        </div>
        
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div key={notification.requestID} className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-800 text-sm">
                {notification.message}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 text-center">
          <button
            onClick={dismissNotification}
            className="bg-green-600 text-white px-6 py-2 rounded-md hover:bg-green-700 transition-colors"
          >
            Great!
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationPopup;
