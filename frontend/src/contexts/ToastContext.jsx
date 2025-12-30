import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerGlobalToast } from '../utils/toast';
import { AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

const ToastContext = createContext(null);

const typeConfig = {
  success: { bg: 'bg-green-900', border: 'border-l-4 border-green-500', icon: CheckCircle },
  error: { bg: 'bg-red-900', border: 'border-l-4 border-red-500', icon: AlertCircle },
  warning: { bg: 'bg-yellow-900', border: 'border-l-4 border-yellow-500', icon: AlertTriangle },
  info: { bg: 'bg-blue-900', border: 'border-l-4 border-blue-500', icon: Info },
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
};

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    registerGlobalToast((t) => {
      const id = Date.now() + Math.random();
      const normalized = typeof t === 'string' ? { message: t, type: 'info', duration: 3000 } : { type: 'info', duration: 3000, ...t };
      setToasts((s) => [...s, { id, ...normalized }]);

      // Auto-dismiss
      if (normalized.duration !== false) {
        const timer = setTimeout(() => removeToast(id), normalized.duration || 3000);
        return () => clearTimeout(timer);
      }
    });
  }, []);

  const addToast = (toast) => {
    const id = Date.now() + Math.random();
    const normalized = typeof toast === 'string' ? { message: toast, type: 'info', duration: 3000 } : { type: 'info', duration: 3000, ...toast };
    setToasts(s => [...s, { id, ...normalized }]);
    
    // Auto-dismiss
    if (normalized.duration !== false) {
      setTimeout(() => removeToast(id), normalized.duration || 3000);
    }
    return id;
  };

  const removeToast = (id) => {
    setToasts(s => s.filter(t => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        {toasts.map(t => {
          const config = typeConfig[t.type] || typeConfig.info;
          const Icon = config.icon;
          return (
            <div
              key={t.id}
              className={`${config.bg} ${config.border} text-white px-4 py-3 rounded shadow-lg max-w-sm pointer-events-auto flex items-start gap-3`}
            >
              <Icon size={20} className="shrink-0 mt-0.5" />
              <div className="flex-1 text-sm">{t.message}</div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-xs opacity-70 hover:opacity-100 ml-2 shrink"
              >
                ×
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
};

export default ToastProvider;
