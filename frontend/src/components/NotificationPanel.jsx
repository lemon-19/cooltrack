import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  CheckCircle,
  AlertCircle,
  Info,
  Package,
  DollarSign,
  Trash2,
} from 'lucide-react';
import { useNotifications } from '../contexts/NotificationContext';

const iconMap = {
  CheckCircle,
  AlertCircle,
  Info,
  Package,
  DollarSign,
};

const severityConfig = {
  success: { bg: 'bg-green-50', border: 'border-l-4 border-green-500', text: 'text-green-900' },
  error: { bg: 'bg-red-50', border: 'border-l-4 border-red-500', text: 'text-red-900' },
  warning: { bg: 'bg-yellow-50', border: 'border-l-4 border-yellow-500', text: 'text-yellow-900' },
  info: { bg: 'bg-blue-50', border: 'border-l-4 border-blue-500', text: 'text-blue-900' },
};

/**
 * NotificationPanel - Display dropdown panel of notifications with mark as read/delete options
 */
const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
  } = useNotifications();

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
      onClose();
    }
  };

  const unreadNotifications = notifications.filter((n) => !n.read);

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 z-30"
          onClick={onClose}
        ></div>
      )}

      <div
        className={`absolute right-0 top-full mt-2 w-96 max-h-96 bg-white rounded-lg shadow-xl border border-gray-200 z-40 flex flex-col transition-all duration-200 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-gray-50 rounded-t-lg">
          <div>
            <h3 className="font-semibold text-gray-900">Notifications</h3>
            {unreadNotifications.length > 0 && (
              <p className="text-xs text-gray-500">
                {unreadNotifications.length} unread
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                title="Mark all as read"
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <Info className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm">No notifications yet</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {notifications.map((notification) => {
                const IconComponent = iconMap[notification.icon] || Info;
                const config = severityConfig[notification.severity] || severityConfig.info;

                return (
                  <div
                    key={notification.id}
                    className={`p-3 ${config.bg} ${config.border} cursor-pointer hover:opacity-80 transition-opacity group ${
                      !notification.read ? 'bg-opacity-100' : 'bg-opacity-50'
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      <IconComponent className={`w-5 h-5 shrink-0 mt-0.5 ${config.text}`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`font-medium text-sm ${config.text}`}>
                            {notification.title}
                            {!notification.read && (
                              <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
                            )}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeNotification(notification.id);
                            }}
                            className="text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className={`text-xs ${config.text} mt-1 text-opacity-75`}>
                          {notification.message}
                        </p>
                        {notification.actionLabel && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(notification);
                            }}
                            className={`text-xs font-medium mt-2 px-2 py-1 rounded ${config.text} opacity-75 hover:opacity-100 transition-opacity`}
                          >
                            {notification.actionLabel} →
                          </button>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-gray-200 px-4 py-3 bg-gray-50 rounded-b-lg">
            <button
              onClick={clearAll}
              className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-2 w-full justify-center"
            >
              <Trash2 className="w-4 h-4" />
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
};

/**
 * Format timestamp to readable format (e.g., "2 minutes ago", "1 hour ago")
 */
function formatTime(timestamp) {
  const now = new Date();
  const diff = now - new Date(timestamp);
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return new Date(timestamp).toLocaleDateString();
}

export default NotificationPanel;
