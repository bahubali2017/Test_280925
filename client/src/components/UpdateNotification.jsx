import { useState, useEffect } from 'react';

/**
 * @file PWA Update Notification Component
 * @description Smart update notification that appears when new app version is available.
 * Provides user-controlled updates with smooth UX and no interruptions.
 * 
 * @author Anamnesis Development Team
 * @version 1.0.0
 * @since 2025-01-08
 */

/**
 * Update Notification Component
 * 
 * A user-friendly notification that appears when a PWA update is available.
 * Features:
 * - Non-intrusive slide-in notification
 * - User-controlled update timing (no forced updates)
 * - Clear messaging about what's being updated
 * - Smooth transition during update process
 * - Preserves user data and active sessions
 * 
 * @returns {JSX.Element|null} The update notification or null if hidden
 */
export function UpdateNotification() {
  const [isVisible, setIsVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [swRegistration, setSwRegistration] = useState(null);

  useEffect(() => {
    // Only run in browsers that support service workers
    if (!('serviceWorker' in navigator)) {
      return;
    }

    let refreshing = false;

    // Listen for service worker updates
    const handleServiceWorkerUpdate = (registration) => {
      console.log('[Update] New service worker available');
      setSwRegistration(registration);
      setIsVisible(true);
    };

    // Listen for immediate controller change (after update is applied)
    const handleControllerChange = () => {
      if (refreshing) return;
      refreshing = true;
      console.log('[Update] App updated, reloading...');
      window.location.reload();
    };

    navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

    // Check for existing registration and updates
    navigator.serviceWorker.getRegistration().then(registration => {
      if (!registration) return;

      // Check if there's an update waiting
      if (registration.waiting) {
        handleServiceWorkerUpdate(registration);
        return;
      }

      // Listen for new service worker installing
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (!newWorker) return;

        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            handleServiceWorkerUpdate(registration);
          }
        });
      });
    });

    // Check for updates when app regains focus
    const handleFocus = () => {
      navigator.serviceWorker.getRegistration().then(registration => {
        if (registration) {
          registration.update();
        }
      });
    };

    window.addEventListener('focus', handleFocus);

    // Cleanup
    return () => {
      navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  /**
   * Handle user clicking "Update Now"
   */
  const handleUpdateNow = () => {
    if (!swRegistration?.waiting) return;

    setIsUpdating(true);
    
    // Tell the waiting service worker to become active
    swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
    
    // The page will reload automatically when the new SW takes control
  };

  /**
   * Handle user dismissing the notification
   */
  const handleDismiss = () => {
    setIsVisible(false);
    
    // Store dismissal so we don't show again until next session
    sessionStorage.setItem('updateDismissed', 'true');
  };

  // Don't show if already dismissed this session
  useEffect(() => {
    if (sessionStorage.getItem('updateDismissed')) {
      setIsVisible(false);
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div 
      className="fixed bottom-4 left-4 right-4 z-50 animate-slide-up"
      role="banner"
      aria-live="polite"
      data-testid="update-notification"
    >
      <div className="bg-gradient-to-r from-cyan-500 to-blue-600 dark:from-cyan-600 dark:to-blue-700 rounded-lg shadow-lg p-4 text-white max-w-sm mx-auto">
        <div className="flex items-start space-x-3">
          {/* Update Icon */}
          <div className="flex-shrink-0 mt-0.5">
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="text-white"
            >
              <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
              <path d="M21 3v5h-5"/>
              <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
              <path d="M8 16H3v5"/>
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white">
              Update Available
            </h3>
            <p className="text-xs text-cyan-100 mt-1">
              New features and improvements are ready to install.
            </p>
          </div>

          {/* Close Button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 text-cyan-100 hover:text-white transition-colors p-1"
            aria-label="Dismiss update notification"
            data-testid="button-dismiss-update"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 mt-3">
          <button
            onClick={handleUpdateNow}
            disabled={isUpdating}
            className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 px-3 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-update-now"
          >
            {isUpdating ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              'Update Now'
            )}
          </button>
          
          <button
            onClick={handleDismiss}
            className="text-cyan-100 hover:text-white text-xs font-medium py-2 px-3 transition-colors"
            data-testid="button-update-later"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}

// CSS Animation (add to your global CSS or component styles)
export const updateNotificationStyles = `
@keyframes slide-up {
  from {
    transform: translateY(100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

.animate-slide-up {
  animation: slide-up 0.3s ease-out;
}
`;