/**
 * @file Supabase Watchdog & Alerts System
 * Continuously monitors Supabase health, tracks metrics, and provides circuit breaker functionality
 */

// Using native fetch (Node.js 18+)

/**
 * @typedef {object} WatchdogMetrics
 * @property {number} checks - Total health checks performed
 * @property {number} up - Number of UP state checks
 * @property {number} down - Number of DOWN state checks  
 * @property {number} flips - Number of state changes
 * @property {string|null} lastFlipAt - ISO timestamp of last state change
 * @property {boolean} circuitBreaker - Circuit breaker status
 * @property {string} currentState - Current Supabase state (UP|DOWN)
 * @property {number} consecutiveDown - Consecutive DOWN checks
 * @property {number} consecutiveUp - Consecutive UP checks (when recovering)
 */

class SupabaseWatchdog {
  constructor() {
    /** @type {WatchdogMetrics} */
    this.metrics = {
      checks: 0,
      up: 0,
      down: 0,
      flips: 0,
      lastFlipAt: null,
      circuitBreaker: false,
      currentState: 'UNKNOWN',
      consecutiveDown: 0,
      consecutiveUp: 0
    };

    this.healthEndpoint = 'http://localhost:5000/api/health';
    this.alertWebhookUrl = process.env.ALERT_WEBHOOK_URL;
    this.monitoringInterval = null;
    this.isStarted = false;
  }

  /**
   * Start the watchdog monitoring
   */
  start() {
    if (this.isStarted) {
      console.warn('⚠️ Watchdog already started');
      return;
    }

    console.log('🩺 Watchdog started (60s)');
    this.isStarted = true;

    // Initial check
    this.performHealthCheck();

    // Set up periodic monitoring
    this.monitoringInterval = globalThis.setInterval(() => {
      this.performHealthCheck();
    }, 60000); // 60 seconds
  }

  /**
   * Stop the watchdog monitoring
   */
  stop() {
    if (this.monitoringInterval) {
      globalThis.clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isStarted = false;
    console.log('🩺 Watchdog stopped');
  }

  /**
   * Perform a health check with timeout
   * @returns {Promise<{state: string, method?: string}>}
   */
  async performHealthCheck() {
    this.metrics.checks++;

    try {
      const controller = new globalThis.AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), 2000); // 2s timeout

      const response = await fetch(this.healthEndpoint, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal
      });

      globalThis.clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        const newState = data.supabase === 'up' ? 'UP' : 'DOWN';
        await this.updateState(newState, 'health-api');
        return { state: newState, method: 'health-api' };
      } else {
        await this.updateState('DOWN', 'http-error');
        return { state: 'DOWN', method: 'http-error' };
      }
    } catch {
      await this.updateState('DOWN', 'fetch-error');
      return { state: 'DOWN', method: 'fetch-error' };
    }
  }

  /**
   * Update state and handle state changes
   * @param {string} newState - New state (UP|DOWN)
   * @param {string} method - Detection method
   */
  async updateState(newState, method) {
    const previousState = this.metrics.currentState;
    
    // Update counters
    if (newState === 'UP') {
      this.metrics.up++;
      this.consecutiveUp++;
      this.consecutiveDown = 0;
    } else {
      this.metrics.down++;
      this.consecutiveDown++;
      this.consecutiveUp = 0;
    }

    // Handle state changes
    if (previousState !== 'UNKNOWN' && previousState !== newState) {
      this.metrics.flips++;
      this.metrics.lastFlipAt = new Date().toISOString();

      // Log state change
      console.log(`🔄 Supabase state: ${previousState}→${newState} (${method})`);

      // Log admin access entry (without PHI)
      console.log(`[ADMIN-REMOTE-ACCESS] Supabase state change: ${previousState}→${newState} at ${this.metrics.lastFlipAt}`);

      // Send webhook alert if configured
      if (this.alertWebhookUrl) {
        await this.sendWebhookAlert(newState);
      }
    }

    this.metrics.currentState = newState;

    // Handle circuit breaker logic
    this.updateCircuitBreaker();
  }

  /**
   * Update circuit breaker status based on consecutive failures
   */
  updateCircuitBreaker() {
    const wasBreaker = this.metrics.circuitBreaker;

    // Set circuit breaker if 5+ consecutive DOWN checks
    if (this.consecutiveDown >= 5) {
      this.metrics.circuitBreaker = true;
    }

    // Clear circuit breaker if 2+ consecutive UP checks
    if (this.consecutiveUp >= 2) {
      this.metrics.circuitBreaker = false;
    }

    // Log circuit breaker state changes
    if (wasBreaker !== this.metrics.circuitBreaker) {
      const action = this.metrics.circuitBreaker ? 'OPENED' : 'CLOSED';
      console.log(`🔴 Circuit breaker ${action} (consecutive ${this.metrics.circuitBreaker ? 'down' : 'up'}: ${this.metrics.circuitBreaker ? this.consecutiveDown : this.consecutiveUp})`);
    }
  }

  /**
   * Send webhook alert for state changes
   * @param {string} state - Current state (UP|DOWN)
   */
  async sendWebhookAlert(state) {
    try {
      const payload = {
        source: 'supabase',
        state: state,
        time: new Date().toISOString()
      };

      const controller = new globalThis.AbortController();
      const timeoutId = globalThis.setTimeout(() => controller.abort(), 2000);

      await fetch(this.alertWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      globalThis.clearTimeout(timeoutId);
      console.log(`📤 Alert sent: ${state} at ${payload.time}`);
    } catch (e) {
      console.warn(`⚠️ Failed to send webhook alert: ${e.message}`);
    }
  }

  /**
   * Get current watchdog metrics and status
   * @returns {WatchdogMetrics}
   */
  getMetrics() {
    return {
      ...this.metrics,
      consecutiveDown: this.consecutiveDown,
      consecutiveUp: this.consecutiveUp
    };
  }

  /**
   * Check if circuit breaker is open
   * @returns {boolean}
   */
  isCircuitBreakerOpen() {
    return this.metrics.circuitBreaker;
  }

  /**
   * Get demo mode response for circuit breaker
   * @returns {{mode: string, reason: string}}
   */
  getDemoModeResponse() {
    return {
      mode: 'demo',
      reason: 'supabase_down'
    };
  }
}

// Create singleton instance
const watchdog = new SupabaseWatchdog();

/**
 *
 */
export default watchdog;