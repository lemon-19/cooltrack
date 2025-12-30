import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useSocket } from './SocketContext';

const NotificationContext = createContext(null);

/**
 * Notification object structure:
 * {
 *   id: string (unique identifier)
 *   type: 'job_updated' | 'job_completed' | 'material_added' | 'cost_approved' | 'user_action' | 'system'
 *   title: string
 *   message: string
 *   icon: 'CheckCircle' | 'AlertCircle' | 'Info' | 'Package' | 'DollarSign'
 *   severity: 'info' | 'success' | 'warning' | 'error'
 *   timestamp: Date
 *   read: boolean
 *   actionUrl?: string (optional link to navigate to)
 *   actionLabel?: string (optional label for action button)
 * }
 */

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used inside NotificationProvider');
  return ctx;
};

export const NotificationProvider = ({ children }) => {
  const { socket } = useSocket(); // Destructure to get the actual socket instance
  const [notifications, setNotifications] = useState([]);

  // Add a new notification
  const addNotification = useCallback((notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      timestamp: new Date(),
      read: false,
      severity: 'info',
      ...notification,
    };
    setNotifications((prev) => [newNotification, ...prev]);
    return id;
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications((prev) =>
      prev.map((notif) =>
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  // Mark all notifications as read
  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((notif) => ({ ...notif, read: true }))
    );
  }, []);

  // Remove a notification
  const removeNotification = useCallback((id) => {
    setNotifications((prev) => prev.filter((notif) => notif.id !== id));
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Get unread count
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Listen to Socket.io events
  useEffect(() => {
    if (!socket) return;

    // Job status updated
    socket.on('job:status-changed', (data) => {
      addNotification({
        type: 'job_updated',
        title: `Job #${data.jobNumber} Updated`,
        message: `Status changed to ${data.newStatus}`,
        icon: 'Info',
        severity: 'info',
        actionUrl: `/jobs/${data.jobId}`,
        actionLabel: 'View Job',
      });
    });

    // Job completed
    socket.on('job:completed', (data) => {
      addNotification({
        type: 'job_completed',
        title: `Job #${data.jobNumber} Completed`,
        message: `Job has been marked as completed`,
        icon: 'CheckCircle',
        severity: 'success',
        actionUrl: `/jobs/${data.jobId}`,
        actionLabel: 'View Job',
      });
    });

    // Materials added
    socket.on('job:materials-added', (data) => {
      addNotification({
        type: 'material_added',
        title: 'Materials Added',
        message: `${data.materialCount} materials added to job #${data.jobNumber}`,
        icon: 'Package',
        severity: 'info',
        actionUrl: `/jobs/${data.jobId}`,
        actionLabel: 'View Materials',
      });
    });

    // Labor hours updated
    socket.on('job:labor-updated', (data) => {
      addNotification({
        type: 'job_updated',
        title: 'Labor Hours Updated',
        message: `Job #${data.jobNumber}: ${data.hours} hours logged`,
        icon: 'DollarSign',
        severity: 'info',
        actionUrl: `/jobs/${data.jobId}`,
        actionLabel: 'View Job',
      });
    });

    // Costing approved
    socket.on('job:costing-approved', (data) => {
      addNotification({
        type: 'cost_approved',
        title: 'Costing Approved',
        message: `Costing for job #${data.jobNumber} has been approved`,
        icon: 'CheckCircle',
        severity: 'success',
        actionUrl: `/jobs/${data.jobId}`,
        actionLabel: 'View Job',
      });
    });

    // Inventory updated
    socket.on('inventory:updated', (data) => {
      addNotification({
        type: 'job_updated',
        title: 'Inventory Updated',
        message: `${data.itemName} inventory has been updated`,
        icon: 'Package',
        severity: 'info',
        actionUrl: '/inventory',
        actionLabel: 'View Inventory',
      });
    });

    // User action notification
    socket.on('user:action', (data) => {
      addNotification({
        type: 'user_action',
        title: data.title || 'User Action',
        message: data.message,
        icon: 'Info',
        severity: data.severity || 'info',
        actionUrl: data.actionUrl,
        actionLabel: data.actionLabel,
      });
    });

    // System notifications
    socket.on('system:notification', (data) => {
      addNotification({
        type: 'system',
        title: data.title || 'System Notification',
        message: data.message,
        icon: 'AlertCircle',
        severity: data.severity || 'warning',
      });
    });

    return () => {
      socket.off('job:status-changed');
      socket.off('job:completed');
      socket.off('job:materials-added');
      socket.off('job:labor-updated');
      socket.off('job:costing-approved');
      socket.off('inventory:updated');
      socket.off('user:action');
      socket.off('system:notification');
    };
  }, [socket, addNotification]);

  const value = {
    notifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    unreadCount,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

export default NotificationProvider;