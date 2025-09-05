/**
 * @file Server uptime tracking utility
 * Tracks server start time and provides uptime calculations
 */

class UptimeTracker {
  constructor() {
    this.startTime = process.hrtime.bigint();
    this.startTimestamp = Date.now();
    
    console.info('[UPTIME-TRACKER] Server uptime tracking initialized');
  }
  
  /**
   * Get server uptime in milliseconds
   * @returns {number} Uptime in milliseconds
   */
  getUptimeMs() {
    const currentTime = process.hrtime.bigint();
    const uptimeNs = currentTime - this.startTime;
    return Number(uptimeNs / 1000000n); // Convert nanoseconds to milliseconds
  }
  
  /**
   * Get server uptime in seconds
   * @returns {number} Uptime in seconds
   */
  getUptimeSeconds() {
    return Math.floor(this.getUptimeMs() / 1000);
  }
  
  /**
   * Get human-readable uptime string
   * @returns {string} Formatted uptime string
   */
  getFormattedUptime() {
    const totalSeconds = this.getUptimeSeconds();
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    if (days > 0) {
      return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    } else if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }
  
  /**
   * Get server start timestamp
   * @returns {number} Start timestamp in milliseconds
   */
  getStartTimestamp() {
    return this.startTimestamp;
  }
}

// Export singleton instance
export const uptimeTracker = new UptimeTracker();