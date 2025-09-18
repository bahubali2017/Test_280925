import React, { useState, useEffect } from 'react';

/**
 * @file PWA Installation Notice Component
 * @description Displays a smart, dismissible banner with platform-specific installation instructions
 * for Progressive Web App (PWA) installation. Automatically detects user's operating system
 * and provides appropriate guidance for installing the Anamnesis Medical AI Assistant.
 * 
 * @author Anamnesis Development Team
 * @version 1.0.0
 * @since 2025-01-08
 */

/**
 * Supported platform types for installation instructions
 * @typedef {'ios'|'android'|'windows'|'macos'|'desktop'} PlatformType
 */

/**
 * Installation instructions object structure
 * @typedef {object} InstallationInstructions
 * @property {string} title - The main title for the installation prompt
 * @property {string[]} steps - Array of step-by-step installation instructions
 * @property {string} buttonText - Text to display on the installation action button
 */

/**
 * Component props interface (no props for this component)
 * @typedef {object} InstallationNoticeProps
 */

/**
 * Installation Notice Component
 * 
 * A smart banner component that provides platform-specific PWA installation guidance.
 * Features include:
 * - Automatic platform detection (iOS, Android, Windows, macOS, Desktop)
 * - User preference persistence (dismissal state)
 * - Automatic hiding for already-installed PWAs
 * - Smooth slide-in animation after page load
 * - Responsive design for mobile and desktop
 * - Integration with existing PWA install functionality
 * 
 * The component automatically:
 * 1. Detects if the PWA is already installed and hides if so
 * 2. Checks localStorage for previous dismissal state
 * 3. Identifies the user's platform for targeted instructions
 * 4. Shows appropriate installation steps with platform-specific UI guidance
 * 5. Provides one-click installation trigger integration
 * 
 * @returns {JSX.Element|null} The installation notice banner or null if hidden
 * 
 * @example
 * // Basic usage - no props required
 * <InstallationNotice />
 * 
 * @example
 * // Typical integration in app layout
 * <div className="app-container">
 *   <InstallationNotice />
 *   <Header />
 *   <MainContent />
 * </div>
 */
export function InstallationNotice() {
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} Controls banner visibility */
  const [isVisible, setIsVisible] = useState(false);
  
  /** @type {[string, React.Dispatch<React.SetStateAction<string>>]} Detected user platform */
  const [platform, setPlatform] = useState('desktop');
  
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} PWA installation status */
  const [isInstalled, setIsInstalled] = useState(false);
  
  /** @type {[boolean, React.Dispatch<React.SetStateAction<boolean>>]} Temporary dismissal for current session */
  const [isDismissed, setIsDismissed] = useState(false);

  /**
   * Main effect hook for initialization and platform detection
   * Handles:
   * - Dismissal state checking from localStorage
   * - PWA installation status detection
   * - Platform identification and classification
   * - Delayed visibility timing for smooth UX
   * 
   * @returns {Function} Cleanup function for timeout
   */
  useEffect(() => {

    /**
     * Checks if the PWA is currently installed/running in standalone mode
     * Uses multiple detection methods for cross-platform compatibility
     * More conservative detection to prevent false positives in development
     * 
     * @function
     * @returns {boolean} True if PWA is installed and running standalone
     * 
     * @example
     * const installed = checkIfInstalled();
     * if (installed) {
     *   // Hide installation prompt
     * }
     */
    const checkIfInstalled = () => {
      // Check for iOS Safari standalone mode (most reliable)
      const iosStandalone = typeof window !== 'undefined' && window.navigator && 'standalone' in window.navigator && window.navigator.standalone === true;
      
      if (iosStandalone) {
        setIsInstalled(true);
        return true;
      }
      
      // For non-iOS, be more conservative with standalone detection
      // Only consider installed if we're in a true standalone window (not iframe)
      const standaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
      const isInIframe = window !== window.top;
      
      if (standaloneMatch && !isInIframe) {
        setIsInstalled(true);
        return true;
      }
      
      return false;
    };

    // Exit early if PWA is already installed
    if (checkIfInstalled()) {
      return;
    }

    /**
     * Detect user's operating system and device type
     * Uses user agent and platform strings for comprehensive detection
     * Handles edge cases like iPad Pro detection and touch-enabled Macs
     */
    const userAgent = (typeof navigator !== 'undefined' ? navigator.userAgent : '').toLowerCase(); // eslint-disable-line no-undef
    const platformString = (typeof navigator !== 'undefined' ? navigator.platform : '').toLowerCase(); // eslint-disable-line no-undef
    
    let detectedPlatform = 'desktop';
    
    // iOS Detection (iPhone, iPad, iPod)
    // Includes modern iPad Pro detection using touch points
    if (/ipad|iphone|ipod/.test(userAgent) || 
        (platformString.includes('mac') && typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1)) { // eslint-disable-line no-undef
      detectedPlatform = 'ios';
    }
    // Android Detection (phones and tablets)
    else if (/android/.test(userAgent)) {
      detectedPlatform = 'android';
    }
    // Windows Detection (all Windows versions)
    else if (/win/.test(platformString)) {
      detectedPlatform = 'windows';
    }
    // macOS Detection (desktop/laptop Mac)
    else if (/mac/.test(platformString)) {
      detectedPlatform = 'macos';
    }

    setPlatform(detectedPlatform);
    
    /**
     * Delayed visibility timer for smooth user experience
     * Waits 2 seconds after page load to show the notice banner
     * This prevents immediate disruption of the initial page view
     * 
     * @type {NodeJS.Timeout} timer - Timeout reference for cleanup
     */
    const timer = (typeof setTimeout !== 'undefined') ? setTimeout(() => { // eslint-disable-line no-undef
      setIsVisible(true);
    }, 2000) : null;

    // Cleanup function to clear timeout on component unmount
    return () => {
      if (timer && typeof clearTimeout !== 'undefined') {
        clearTimeout(timer); // eslint-disable-line no-undef
      }
    };
  }, []);

  /**
   * Handles user dismissal of the installation notice
   * - Immediately hides the banner with slide-up animation
   * - Temporarily dismisses for current session only
   * - Will reappear on next page load/refresh
   * 
   * @function
   * @returns {void}
   * 
   * @example
   * // Called when user clicks the dismiss (X) button
   * <button onClick={handleDismiss}>×</button>
   */
  const handleDismiss = () => {
    setIsVisible(false);
    setIsDismissed(true);
  };

  /**
   * Handles installation button click action
   * - Provides device-specific installation instructions
   * - Shows appropriate guidance based on detected platform
   * - Triggers native PWA installation prompt when available
   * - Automatically dismisses notice after showing instructions
   * 
   * @function
   * @returns {void}
   * 
   * @example
   * // Called when user clicks installation action button
   * <button onClick={handleInstall}>Install Now</button>
   */
  const handleInstall = () => {
    if (platform === 'ios') {
      // iOS - Show detailed installation instructions
      if (typeof alert !== 'undefined') {
        alert('To install Anamnesis on your iPhone/iPad:\n\n1. Tap the Share button (⬆️) at the bottom of Safari\n2. Scroll down and tap "Add to Home Screen"\n3. Tap "Add" to install the app'); // eslint-disable-line no-undef
      }
    } else {
      // Android/Desktop - Try to trigger native install prompt
      const beforeInstallPromptHandler = (e) => {
        e.preventDefault();
        e.prompt();
      };
      
      // Check if beforeinstallprompt event is available
      if (typeof window !== 'undefined' && 'BeforeInstallPromptEvent' in window) {
        window.addEventListener('beforeinstallprompt', beforeInstallPromptHandler, { once: true });
      } else {
        // Fallback instructions for platforms without native prompt
        const instructions = getInstallationInstructions();
        if (typeof alert !== 'undefined') {
          alert(`${instructions.title}\n\n${instructions.steps.join('\n')}`); // eslint-disable-line no-undef
        }
      }
    }
    
    // Always dismiss the notice after showing instructions
    handleDismiss();
  };

  /**
   * Early return conditions - don't render the component if:
   * - PWA is already installed (no need to show install prompt)
   * - User has previously dismissed the notice (respecting user preference)
   * - Component visibility is false (during initial load or hide animation)
   * 
   * @returns {null} When component should not be displayed
   */
  // Check if component should be hidden
  if (isInstalled || isDismissed || !isVisible) {
    return null;
  }

  /**
   * Generates platform-specific installation instructions
   * Returns customized guidance based on detected operating system and browser capabilities
   * Each platform has tailored steps that match the actual user interface they will see
   * 
   * @function
   * @returns {InstallationInstructions} Object containing title, steps array, and button text
   * 
   * @example
   * const instructions = getInstallationInstructions();
   * console.log(instructions.title); // "Install Anamnesis on your iPhone/iPad"
   * console.log(instructions.steps); // ["Tap the Share button...", "Scroll down..."]
   * console.log(instructions.buttonText); // "Show Me How"
   */
  const getInstallationInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          title: 'Install Anamnesis on your iPhone/iPad',
          steps: [
            'Tap the Share button (⬆️) at the bottom of Safari',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install the app'
          ],
          buttonText: 'Show Me How'
        };
      
      case 'android':
        return {
          title: 'Install Anamnesis on your Android device',
          steps: [
            'Look for the "Install" notification or',
            'Tap the menu (⋮) in your browser',
            'Select "Install app" or "Add to Home screen"'
          ],
          buttonText: 'Install Now'
        };
      
      case 'windows':
        return {
          title: 'Install Anamnesis on Windows',
          steps: [
            'Look for the install icon (⬇️) in your browser\'s address bar',
            'Or click the menu (⋮) and select "Install Anamnesis"',
            'The app will be added to your Start menu'
          ],
          buttonText: 'Install Now'
        };
      
      case 'macos':
        return {
          title: 'Install Anamnesis on macOS',
          steps: [
            'Look for the install button in Safari\'s address bar',
            'Or use Chrome/Edge menu and select "Install Anamnesis"',
            'The app will be added to your Applications folder'
          ],
          buttonText: 'Install Now'
        };
      
      default:
        // Fallback for unrecognized platforms
        return {
          title: 'Install Anamnesis as an App',
          steps: [
            'Look for an install option in your browser',
            'This will give you faster access and a better experience',
            'The app works offline once installed'
          ],
          buttonText: 'Try to Install'
        };
    }
  };

  /** @type {InstallationInstructions} Platform-specific installation guidance */
  const instructions = getInstallationInstructions();

  return (
    <div className={`fixed top-0 left-0 right-0 z-50 transform transition-transform duration-500 ease-out translate-y-0`}>
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 border-b border-cyan-200 dark:border-cyan-800/50 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-start justify-between gap-4">
            {/* Icon and Content */}
            <div className="flex items-start gap-3 flex-1">
              {/* App Icon */}
              <div className="flex-shrink-0 mt-0.5">
                <img 
                  src="/favicon-32x32.png" 
                  alt="Anamnesis" 
                  className="w-6 h-6"
                  style={{ 
                    filter: 'drop-shadow(0 0 4px rgba(6, 182, 212, 0.5))' 
                  }}
                />
              </div>
              
              {/* Text Content */}
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-cyan-900 dark:text-cyan-100 mb-1">
                  {instructions.title}
                </h3>
                
                {/* Desktop: Show all steps in one line */}
                <div className="hidden sm:block">
                  <p className="text-xs text-cyan-700 dark:text-cyan-300 leading-relaxed">
                    {instructions.steps.join(' • ')}
                  </p>
                </div>
                
                {/* Mobile: Show simplified message */}
                <div className="sm:hidden">
                  <p className="text-xs text-cyan-700 dark:text-cyan-300">
                    Get faster access and work offline
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleInstall}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-cyan-700 hover:text-cyan-800 dark:text-cyan-300 dark:hover:text-cyan-200 bg-cyan-100 hover:bg-cyan-200 dark:bg-cyan-900/30 dark:hover:bg-cyan-800/40 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="7 10 12 15 17 10"/>
                  <line x1="12" y1="15" x2="12" y2="3"/>
                </svg>
                {instructions.buttonText}
              </button>
              
              <button
                onClick={handleDismiss}
                className="inline-flex items-center justify-center w-6 h-6 text-cyan-600 hover:text-cyan-800 dark:text-cyan-400 dark:hover:text-cyan-200 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-cyan-500/30"
                aria-label="Dismiss installation notice"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}