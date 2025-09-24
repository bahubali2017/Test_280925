/**
 * @file Toast component for displaying notifications in the Anamnesis Medical AI Assistant
 */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

/**
 * Toast variant types for styling
 * @typedef {'default'|'success'|'error'|'warning'} ToastVariant
 */

/**
 * Individual toast message structure
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description?: string;
 *   variant?: ToastVariant;
 * }} ToastMessage
 */

/**
 * Props for the Toast component
 * @typedef {{
 *   id: string;
 *   title: string;
 *   description?: string;
 *   variant?: ToastVariant;
 *   onDismiss: (id: string) => void;
 * }} ToastProps
 */

/**
 * Props for the ToastContainer component
 * @typedef {{
 *   toasts: ToastMessage[];
 *   dismissToast: (id: string) => void;
 * }} ToastContainerProps
 */

/**
 * Timer reference type for cleanup
 * @typedef {ReturnType<typeof setTimeout>} TimerRef
 */

/**
 * Type guard to check if a variant is valid
 * @param {string} variant - The variant to validate
 * @returns {variant is ToastVariant}
 */
function isValidVariant(variant) {
  return ['default', 'success', 'error', 'warning'].includes(variant);
}

/**
 * Get CSS classes for toast variants
 * @param {ToastVariant} variant - The toast variant
 * @returns {string} CSS classes for the variant
 */
function getToastClasses(variant) {
  /** @type {Record<ToastVariant, string>} */
  const variantClasses = {
    default: 'bg-gray-800 text-white border-gray-700',
    success: 'bg-green-50 text-green-800 border-green-200',
    error: 'bg-red-50 text-red-800 border-red-200',
    warning: 'bg-yellow-50 text-yellow-800 border-yellow-200',
  };
  
  return variantClasses[variant] || variantClasses.default;
}

/**
 * Get animation classes based on visibility state
 * @param {boolean} isVisible - Whether the toast is visible
 * @returns {string} CSS animation classes
 */
function getAnimationClasses(isVisible) {
  return isVisible 
    ? 'translate-y-0 opacity-100' 
    : 'translate-y-2 opacity-0';
}

/**
 * Type guard to check if a value is a valid timer reference
 * @param {unknown} timer - Timer to validate
 * @returns {timer is TimerRef}
 */
function isValidTimer(timer) {
  return typeof timer === 'number' || (typeof timer === 'object' && timer !== null);
}

/**
 * Toast component for displaying notifications
 * @param {ToastProps} props - Component props
 * @returns {React.ReactElement} Toast component
 */
export function Toast({ id, title, description, variant = 'default', onDismiss }) {
  // Validate required props
  if (!id || typeof id !== 'string') {
    console.warn('[Toast] Invalid or missing id prop');
    return <div data-testid="toast-error" />;
  }
  
  if (!title || typeof title !== 'string') {
    console.warn('[Toast] Invalid or missing title prop');
    return <div data-testid="toast-error" />;
  }
  
  if (typeof onDismiss !== 'function') {
    console.warn('[Toast] Invalid or missing onDismiss callback');
    return <div data-testid="toast-error" />;
  }

  // Validate and sanitize variant
  const safeVariant = /** @type {ToastVariant} */ (
    variant && typeof variant === 'string' && isValidVariant(variant) 
      ? variant 
      : 'default'
  );

  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    const timer = window.setTimeout(() => {
      setIsVisible(true);
    }, 10);
    
    return () => {
      if (isValidTimer(timer)) {
        window.clearTimeout(timer);
      }
    };
  }, []);
  
  /**
   * Handle toast dismissal with animation
   * @returns {void}
   */
  const handleDismiss = () => {
    console.info('[Toast] Dismissing toast', { id, variant: safeVariant });
    
    setIsVisible(false);
    const dismissTimer = window.setTimeout(() => {
      if (typeof onDismiss === 'function') {
        onDismiss(id);
      }
    }, 300); // Match this with the CSS transition time
    
    // Clean up timer on unmount (Note: this return statement won't work here as intended)
    // Timer cleanup should be handled by component unmount, not function return
    if (isValidTimer(dismissTimer)) {
      // Store timer ref for potential cleanup if component unmounts during animation
      const timerId = dismissTimer;
      window.setTimeout(() => {
        window.clearTimeout(timerId);
      }, 301);
    }
  };
  
  return (
    <div 
      className={`
        fixed bottom-56 right-4 max-w-sm w-full shadow-lg rounded-md border 
        py-3 px-4 flex items-start transition-all duration-300 transform
        ${getToastClasses(safeVariant)}
        ${getAnimationClasses(isVisible)}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      data-testid={`toast-${id}`}
      data-variant={safeVariant}
    >
      <div className="flex-1">
        <h3 className="font-medium" data-testid="toast-title">
          {title}
        </h3>
        {description && typeof description === 'string' && (
          <p className="text-sm mt-1" data-testid="toast-description">
            {description}
          </p>
        )}
      </div>
      <button 
        onClick={handleDismiss}
        className="ml-4 rounded-full p-1 hover:bg-opacity-20 hover:bg-gray-900 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-current"
        aria-label={`Dismiss ${safeVariant} notification: ${title}`}
        data-testid="toast-dismiss"
        type="button"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Container component for managing multiple toasts
 * @param {ToastContainerProps} props - Component props
 * @returns {React.ReactElement | null} ToastContainer component
 */
export function ToastContainer({ toasts = [], dismissToast }) {
  // Validate props
  if (!Array.isArray(toasts)) {
    console.warn('[ToastContainer] Invalid toasts prop, expected array');
    return null;
  }
  
  if (typeof dismissToast !== 'function') {
    console.warn('[ToastContainer] Invalid dismissToast callback');
    return null;
  }
  
  if (toasts.length === 0) {
    return null;
  }
  
  /**
   * Validate individual toast message structure
   * @param {unknown} toast - Toast to validate
   * @returns {toast is ToastMessage}
   */
  const isValidToast = (toast) => {
    return toast !== null && 
           typeof toast === 'object' && 
           'id' in toast && 
           'title' in toast &&
           typeof toast.id === 'string' &&
           typeof toast.title === 'string';
  };

  // Filter valid toasts and log warnings for invalid ones
  const validToasts = toasts.filter(toast => {
    const valid = isValidToast(toast);
    if (!valid) {
      console.warn('[ToastContainer] Invalid toast structure detected', toast);
    }
    return valid;
  });

  if (validToasts.length === 0) {
    return null;
  }
  
  return (
    <div 
      className="fixed bottom-52 right-0 p-4 z-50 space-y-3"
      aria-label="Notifications"
      data-testid="toast-container"
    >
      {validToasts.map(toast => (
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

console.info('[Toast] Toast notification system initialized');

/**
 * Default export of the Toast component for backward compatibility
 */
export default Toast;