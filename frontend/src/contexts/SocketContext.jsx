// contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    
    if (!token) return;

    // Create socket connection (only in browser)
    let newSocket;
    try {
      newSocket = io(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
        auth: { token },
        autoConnect: true,
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionAttempts: 5
      });
    } catch (err) {
      console.error('Failed to create socket:', err);
      return;
    }

    // Connection event handlers
    newSocket.on('connect', () => {
      if (import.meta.env.DEV) console.debug('Socket connected:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', (reason) => {
      if (import.meta.env.DEV) console.debug('Socket disconnected:', reason);
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      if (import.meta.env.DEV) console.error('Socket connection error:', error?.message || error);
      setConnected(false);
    });

    newSocket.on('reconnect', (attemptNumber) => {
      if (import.meta.env.DEV) console.debug(`Socket reconnected after ${attemptNumber} attempts`);
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      try {
        newSocket?.disconnect();
      } catch (e) {}
      setSocket(null);
    };
  }, []);

  const value = {
    socket,
    connected,
    
    // Helper methods
    subscribeToJob: (jobId) => {
      if (socket) {
        socket.emit('subscribe:job', jobId);
      }
    },
    
    unsubscribeFromJob: (jobId) => {
      if (socket) {
        socket.emit('unsubscribe:job', jobId);
      }
    },
    
    subscribeToInventory: (itemId) => {
      if (socket) {
        socket.emit('subscribe:inventory', itemId);
      }
    }
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
};  