/**
 * @file Toast provider component for the Anamnesis Medical AI Assistant
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { ToastContainer } from './Toast';

/**
 * @typedef {object} ToastContextType
 * @property {Function} toast - Function to show a toast notification
 * @property {Function} dismiss - Function to dismiss a toast
 * @property {Function} dismissAll - Function to dismiss all toasts
 */

/**
 * @type {React.Context<ToastContextType>}
 */
const ToastContext = createContext({
  toast: () => {},
  dismiss: () => {},
  dismissAll: () => {}
});

/**
 * Hook to use the toast context
 * @returns {ToastContextType} Toast context
 */
export const useToast = () => useContext(ToastContext);

/**
 * Toast provider component
 * @param {{ children: React.ReactNode }} props - Component props
 * @returns {JSX.Element} The ToastProvider component
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  /**
   * Generate a unique ID for a toast
   * @returns {string} Unique ID
   */
  const generateId = useCallback(() => {
    return Math.random().toString(36).slice(2, 11);
  }, []);

  /**
   * Show a toast notification
   * @param {{ title: string, description?: string, variant?: string, duration?: number }} options - Toast options
   * @returns {string} Toast ID
   */
  const toast = useCallback(options => {
    const id = generateId();
    const { title, description, variant = 'default', duration = 5000 } = options;
    
    const newToast = {
      id,
      title,
      description,
      variant
    };
    
    setToasts(prev => [...prev, newToast]);
    
    if (duration > 0) {
      window.setTimeout(() => {
        dismiss(id);
      }, duration);
    }
    
    return id;
  }, [generateId]);

  /**
   * Dismiss a specific toast
   * @param {string} id - Toast ID
   */
  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  /**
   * Dismiss all toasts
   */
  const dismissAll = useCallback(() => {
    setToasts([]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss, dismissAll }}>
      {children}
      <ToastContainer toasts={toasts} dismissToast={dismiss} />
    </ToastContext.Provider>
  );
}

/**
 * Default export of the ToastProvider component
 * @module ToastProvider
 */
export default ToastProvider;