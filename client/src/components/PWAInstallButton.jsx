import { useState, useEffect } from 'react';

/**
 * PWA Install Button Component
 * Shows an install button when the app is installable
 * @returns {JSX.Element|null} Install button or null if not installable
 */
export function PWAInstallButton() {
  /** @type {[any, React.Dispatch<React.SetStateAction<any>>]} */
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Detect iOS
    const iOS = typeof navigator !== 'undefined' && (
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||  // eslint-disable-line no-undef
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1) // eslint-disable-line no-undef
    );
    setIsIOS(iOS);

    // Check if app is already installed
    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches || 
          (window.navigator && 'standalone' in window.navigator && window.navigator.standalone === true)) {
        setIsInstalled(true);
        return;
      }
    };

    checkIfInstalled();

    // Show install button for iOS users even without beforeinstallprompt
    if (iOS && !window.matchMedia('(display-mode: standalone)').matches) {
      setShowInstallButton(true);
    }

    // Listen for the beforeinstallprompt event
    /** @param {Event} e */
    const handleBeforeInstallPrompt = (e) => {
      console.log('💾 PWA install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallButton(true);
    };

    // Listen for app installed event
    const handleAppInstalled = () => {
      console.log('✅ PWA was installed successfully');
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      // For iOS, show instructions
      if (typeof alert !== 'undefined') {
        alert('To install this app on your iPhone/iPad:\n\n1. Tap the Share button (square with arrow)\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install'); // eslint-disable-line no-undef
      }
      return;
    }

    if (!deferredPrompt) {
      console.log('No install prompt available');
      return;
    }

    // Show the install prompt
    /** @type {any} */ (deferredPrompt).prompt();

    // Wait for the user to respond to the prompt
    const { outcome } = await /** @type {any} */ (deferredPrompt).userChoice;
    
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    } else {
      console.log('User dismissed the install prompt');
    }

    // Clear the deferredPrompt so it can only be used once
    setDeferredPrompt(null);
    setShowInstallButton(false);
  };

  // Don't show if already installed or prompt not available
  if (isInstalled || !showInstallButton) {
    return null;
  }

  return (
    <button
      onClick={handleInstallClick}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-cyan-600 hover:text-cyan-700 dark:text-cyan-400 dark:hover:text-cyan-300 bg-gradient-to-r from-cyan-50 to-cyan-100 hover:from-cyan-100 hover:to-cyan-200 dark:from-cyan-900/20 dark:to-cyan-800/20 dark:hover:from-cyan-800/30 dark:hover:to-cyan-700/30 border border-cyan-200 dark:border-cyan-700/50 rounded-md transition-all duration-200 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
      title="Install Anamnesis as an app"
      aria-label="Install Anamnesis Medical AI Assistant as an app"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
        <polyline points="7 10 12 15 17 10"/>
        <line x1="12" y1="15" x2="12" y2="3"/>
      </svg>
      Install App
    </button>
  );
}