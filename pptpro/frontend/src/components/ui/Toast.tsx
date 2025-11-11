/**
 * Toast notification component for user feedback
 */
import React, { useEffect } from 'react';
import './Toast.css';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message: string;
  type: ToastType;
  duration?: number;
  onClose: () => void;
}

const Toast: React.FC<ToastProps> = ({ message, type, duration = 3000, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  };

  return (
    <div className={`toast toast--${type}`} onClick={onClose}>
      <div className="toast__icon">{icons[type]}</div>
      <div className="toast__message">{message}</div>
      <button className="toast__close" onClick={onClose} aria-label="Close">
        ✕
      </button>
    </div>
  );
};

export default Toast;
