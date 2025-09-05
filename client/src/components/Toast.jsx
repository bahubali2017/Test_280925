/**
 * @file Toast component for displaying notifications in the Anamnesis Medical AI Assistant
 */

import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * @typedef {object} ToastProps
 * @property {string} id - Unique toast ID
 * @property {string} title - Toast title
 * @property {string} [description] - Optional toast description
 * @property {string} [variant='default'] - Toast variant (default, success, error, warning)
 * @property {Function} onDismiss - Function to call when the toast is dismissed
 */

/**
 * Toast component for displaying notifications
 * @param {ToastProps} props - Component props
 * @returns {JSX.Element} Toast component
 */
export function Toast({ id, title, description, variant = 'default', onDismiss }) {
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => {
      window.clearTimeout(timer);
    };
  }, []);
  
  const handleDismiss = () => {
    setIsVisible(false);
    window.setTimeout(() => {
      onDismiss(id);
    }, 300); // Match this with the CSS transition time
  };
  
  // Determine classes based on variant
  const variantClasses = {
    default: 'bg-gray-800 text-white border-gray-700',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  
  const animateClasses = isVisible 
    ? 'translate-y-0 opacity-100' 
    : 'translate-y-2 opacity-0';
  
  return (
    <div 
      className={`
        fixed bottom-4 right-4 max-w-sm w-full shadow-lg rounded-md border 
        py-3 px-4 flex items-start transition-all duration-300 transform
        ${variantClasses[variant] || variantClasses.default}
        ${animateClasses}
      `}
      role="alert"
    >
      <div className="flex-1">
        <h3 className="font-medium">{title}</h3>
        {description && <p className="text-sm mt-1">{description}</p>}
      </div>
      <button 
        onClick={handleDismiss}
        className="ml-4 rounded-full p-1 hover:bg-opacity-20 hover:bg-gray-900 transition-colors"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
}

/**
 * Container component for managing multiple toasts
 * @param {{toasts: Array<object>, dismissToast: Function}} props - Component props
 * @returns {JSX.Element} ToastContainer component
 */
export function ToastContainer({ toasts = [], dismissToast }) {
  if (toasts.length === 0) return null;
  
  return (
    <div className="fixed bottom-0 right-0 p-4 z-50 space-y-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          onDismiss={dismissToast}
        />
      ))}
    </div>
  );
}

/**
 * Default export of the Toast component
 * @module Toast
 */
export default Toast;