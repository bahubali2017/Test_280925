/**
 * @file Version Checking Utility
 * @description Client-side version checking to detect server updates and force cache refresh
 * Eliminates manual cache clearing by automatically detecting version mismatches
 */

/**
 * Cache for storing the initial client version (fetched on first load)
 * @type {string|null}
 */
let initialClientVersion = null;

/**
 * Cache for storing the last known server version
 * @type {string|null}
 */
let lastKnownVersion = null;

/**
 * Flag to prevent multiple simultaneous version checks
 * @type {boolean}
 */
let isCheckingVersion = false;

/**
 * @typedef {object} VersionCheckConfig
 * @property {number} FOCUS_CHECK_THROTTLE - How often to check for updates when window gains focus (ms)
 * @property {number} REQUEST_TIMEOUT - Timeout for version check requests (ms)
 * @property {number} MAX_RETRIES - Retry attempts for failed version checks
 * @property {string} VERSION_ENDPOINT - Base URL for version checks
 */

/**
 * Configuration for version checking behavior
 * @type {VersionCheckConfig}
 */
const VERSION_CHECK_CONFIG = {
  // How often to check for updates when window gains focus (ms)
  FOCUS_CHECK_THROTTLE: 30000, // 30 seconds
  // Timeout for version check requests (ms)
  REQUEST_TIMEOUT: 5000, // 5 seconds
  // Retry attempts for failed version checks
  MAX_RETRIES: 2,
  // Base URL for version checks
  VERSION_ENDPOINT: '/api/app-config.json'
};

/**
 * Throttle mechanism to prevent excessive version checks
 * @type {number}
 */
let lastFocusCheck = 0;

/**
 * Get the current client version (initially fetched from server)
 * @returns {string|null} Client version or null if not available
 */
function getClientVersion() {
  return initialClientVersion;
}

/**
 * Set the initial client version (called on first successful server fetch)
 * @param {string} version - Version to set as initial client version
 */
function setInitialClientVersion(version) {
  if (!initialClientVersion && version) {
    initialClientVersion = version;
    console.log(`[Version Check] Initial client version set: ${version}`);
  }
}

/**
 * @typedef {object} ServerConfig
 * @property {string} version - Server version string
 * @property {boolean} [mustRefresh] - Whether client must refresh
 * @property {boolean} [swKillSwitch] - Whether to disable service worker
 */

/**
 * Fetch current server version with timeout and retry logic
 * @param {number} retryCount - Current retry attempt
 * @returns {Promise<ServerConfig|null>} Server config or null on failure
 */
async function fetchServerVersion(retryCount = 0) {
  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), VERSION_CHECK_CONFIG.REQUEST_TIMEOUT);
    
    // Add cache-busting parameter to ensure fresh response
    const cacheBuster = Date.now();
    const url = `${VERSION_CHECK_CONFIG.VERSION_ENDPOINT}?_cb=${cacheBuster}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`Version check failed: ${response.status} ${response.statusText}`);
    }
    
    const serverConfig = await response.json();
    
    // Validate response structure
    if (!serverConfig || typeof serverConfig.version !== 'string') {
      throw new Error('Invalid server config response');
    }
    
    console.log(`[Version Check] Server version: ${serverConfig.version}, client version: ${getClientVersion()}`);
    return serverConfig;
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.warn(`[Version Check] Attempt ${retryCount + 1} failed:`, errorMessage);
    
    // Retry logic
    if (retryCount < VERSION_CHECK_CONFIG.MAX_RETRIES) {
      const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff
      console.log(`[Version Check] Retrying in ${delay}ms...`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchServerVersion(retryCount + 1);
    }
    
    // All retries exhausted
    console.error('[Version Check] All retry attempts failed');
    return null;
  }
}

/**
 * Handle service worker kill switch if enabled
 * @param {boolean} swKillSwitch - Whether to disable service worker
 */
async function handleServiceWorkerKillSwitch(swKillSwitch) {
  if (!swKillSwitch) return;
  
  console.warn('[Version Check] Service Worker kill switch activated');
  
  try {
    // Unregister all service workers
    if ('serviceWorker' in navigator) {
      const registrations = await navigator.serviceWorker.getRegistrations();
      for (const registration of registrations) {
        await registration.unregister();
        console.log('[Version Check] Service worker unregistered');
      }
    }
  } catch (error) {
    console.error('[Version Check] Failed to unregister service workers:', error);
  }
}

/**
 * Force app reload with cache busting
 * @param {string} reason - Reason for reload (for logging)
 * @param {string} newVersion - New version hash
 */
function forceAppReload(reason, newVersion) {
  console.log(`[Version Check] Forcing app reload: ${reason}`);
  
  try {
    // Clear all possible caches before reload
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            console.log(`[Version Check] Clearing cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }).then(() => {
        // Perform cache-busting reload
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set('v', newVersion);
        currentUrl.searchParams.set('_reload', Date.now().toString());
        
        // Force hard reload with cache busting
        window.location.href = currentUrl.toString();
      });
    } else {
      // Fallback for browsers without cache API
      const currentUrl = new URL(globalThis.location.href);
      currentUrl.searchParams.set('v', newVersion);
      currentUrl.searchParams.set('_reload', Date.now().toString());
      
      globalThis.location.href = currentUrl.toString();
    }
  } catch (error) {
    console.error('[Version Check] Failed to clear caches, performing simple reload:', error);
    
    // Last resort: simple reload
    window.location.reload();
  }
}

/**
 * Compare client and server versions and take appropriate action
 * @param {ServerConfig} serverConfig - Server configuration object
 * @param {boolean} isInitialCheck - Whether this is the initial app load check
 */
function compareVersionsAndAct(serverConfig, isInitialCheck = false) {
  const serverVersion = serverConfig.version;
  
  // On initial check, set the server version as our baseline client version
  if (isInitialCheck && !initialClientVersion) {
    setInitialClientVersion(serverVersion);
    lastKnownVersion = serverVersion;
    console.log('[Version Check] Initial version established');
    return;
  }
  
  const clientVersion = getClientVersion();
  
  // Handle missing client version (shouldn't happen after initial check)
  if (!clientVersion) {
    console.warn('[Version Check] No client version available after initial check');
    setInitialClientVersion(serverVersion);
    lastKnownVersion = serverVersion;
    return;
  }
  
  // Handle forced refresh flag
  if (serverConfig.mustRefresh) {
    console.warn('[Version Check] Server requested forced refresh');
    forceAppReload('Server requested forced refresh', serverVersion);
    return;
  }
  
  // Handle service worker kill switch
  if (serverConfig.swKillSwitch) {
    handleServiceWorkerKillSwitch(true);
  }
  
  // Version comparison logic
  if (serverVersion !== clientVersion) {
    console.warn(`[Version Check] Version mismatch detected! Client: ${clientVersion}, Server: ${serverVersion}`);
    
    // Check if this is the first time we've detected this version
    if (lastKnownVersion && lastKnownVersion === serverVersion) {
      console.log('[Version Check] Already processed this server version, skipping reload');
      return;
    }
    
    // New version detected - force reload
    lastKnownVersion = serverVersion;
    forceAppReload('Version mismatch detected', serverVersion);
    
  } else {
    console.log('[Version Check] Versions match, no action needed');
    lastKnownVersion = serverVersion;
  }
}

/**
 * Perform version check against server
 * @param {boolean} isInitialCheck - Whether this is the initial app load check
 * @returns {Promise<void>}
 */
export async function checkForUpdates(isInitialCheck = false) {
  // Prevent concurrent version checks
  if (isCheckingVersion) {
    console.log('[Version Check] Already checking version, skipping');
    return;
  }
  
  // Throttle focus-based checks
  if (!isInitialCheck) {
    const now = Date.now();
    if (now - lastFocusCheck < VERSION_CHECK_CONFIG.FOCUS_CHECK_THROTTLE) {
      console.log('[Version Check] Throttling focus-based check');
      return;
    }
    lastFocusCheck = now;
  }
  
  isCheckingVersion = true;
  
  try {
    console.log(`[Version Check] Starting ${isInitialCheck ? 'initial' : 'focus-triggered'} version check`);
    
    const serverConfig = await fetchServerVersion();
    
    if (serverConfig) {
      compareVersionsAndAct(serverConfig, isInitialCheck);
    } else {
      console.warn('[Version Check] Failed to fetch server version, skipping update check');
    }
    
  } catch (error) {
    console.error('[Version Check] Unexpected error during version check:', error);
  } finally {
    isCheckingVersion = false;
  }
}

/**
 * Initialize version checking system
 * Sets up event listeners for focus-based version checks
 */
export function initializeVersionChecking() {
  console.log('[Version Check] Initializing version checking system');
  
  // Perform initial version check
  checkForUpdates(true);
  
  // Set up focus-based version checking
  /** @type {ReturnType<typeof setTimeout> | undefined} */
  let focusTimeout;
  
  const handleWindowFocus = () => {
    // Debounce focus events
    clearTimeout(focusTimeout);
    focusTimeout = setTimeout(() => {
      checkForUpdates(false);
    }, 1000); // Wait 1 second after focus to avoid excessive checks
  };
  
  // Add focus event listener
  window.addEventListener('focus', handleWindowFocus);
  
  // Also check on visibility change (for mobile browsers)
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      handleWindowFocus();
    }
  });
  
  console.log('[Version Check] Version checking system initialized');
}

/**
 * @typedef {object} VersionStatus
 * @property {string|null} clientVersion - Current client version
 * @property {string|null} lastKnownServerVersion - Last known server version
 * @property {boolean} isChecking - Whether currently checking for updates
 * @property {number} lastFocusCheck - Timestamp of last focus check
 * @property {VersionCheckConfig} config - Version check configuration
 */

/**
 * Get current version checking status
 * @returns {VersionStatus} Status information
 */
export function getVersionStatus() {
  return {
    clientVersion: getClientVersion(),
    lastKnownServerVersion: lastKnownVersion,
    isChecking: isCheckingVersion,
    lastFocusCheck: lastFocusCheck,
    config: VERSION_CHECK_CONFIG
  };
}