import React, { useEffect } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
  duration?: number;
}

export const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 style={{ width: '18px', height: '18px' }} />;
      case 'error':
        return <AlertCircle style={{ width: '18px', height: '18px' }} />;
      case 'info':
      default:
        return <Info style={{ width: '18px', height: '18px' }} />;
    }
  };

  return (
    <div className={`toast-item toast-${type}`}>
      <div className="toast-icon">
        {getIcon()}
      </div>
      <div className="toast-message">{message}</div>
      <button 
        onClick={onClose} 
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          marginLeft: 'auto', 
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          color: 'var(--text-muted)',
          transition: 'var(--transition-smooth)'
        }}
        title="Dismiss"
      >
        <X style={{ width: '14px', height: '14px' }} />
      </button>
    </div>
  );
};

export interface ToastContainerProps {
  toasts: { id: string; message: string; type: 'success' | 'error' | 'info' }[];
  removeToast: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
  return (
    <div className="toast-container">
      {toasts.map((t) => (
        <Toast 
          key={t.id} 
          message={t.message} 
          type={t.type} 
          onClose={() => removeToast(t.id)} 
        />
      ))}
    </div>
  );
};
