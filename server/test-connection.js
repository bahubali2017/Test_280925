// server/test-connection.js
import { createClient } from '@supabase/supabase-js';

function withTimeout(promise, ms = 2500) {
  return Promise.race([
    promise,
    new Promise((_, rej) => globalThis.setTimeout(() => rej(new Error('timeout')), ms)),
  ]);
}

let currentSupabaseState = false;
let globalSupabaseHealthy = false;

/**
 * Test Supabase connection using multiple methods
 * @returns {Promise<{ok: boolean, reason?: string, method?: string}>}
 */
export async function testSupabaseConnection() {
  try {
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return { ok: false, reason: 'missing-config' };

    // First try auth health endpoint (most reliable)
    try {
      const healthResponse = await withTimeout(
        fetch(`${url}/auth/v1/health`, {
          method: 'GET',
          headers: {
            'apikey': key,
            'Content-Type': 'application/json'
          }
        }), 
        2500
      );
      
      if (healthResponse.ok) {
        return { ok: true, method: 'auth-health' };
      }
    } catch {
      // Fall back to other methods
    }

    // Fallback: Test with Supabase client
    const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });

    // Try a lightweight admin call if we have service key
    if (process.env.SUPABASE_SERVICE_KEY) {
      try {
        const admin = supabase.auth.admin;
        await withTimeout(admin.listUsers({ page: 1, perPage: 1 }), 2500);
        return { ok: true, method: 'admin-api' };
      } catch (adminError) {
        console.log('Admin API test failed, falling back to REST API test:', adminError.message);
        // Continue to REST API test instead of failing
      }
    }

    // Last resort: Try to access REST API
    const restResponse = await withTimeout(
      fetch(`${url}/rest/v1/`, {
        method: 'GET',
        headers: {
          'apikey': key,
          'Content-Type': 'application/json'
        }
      }), 
      2500
    );
    
    if (restResponse.ok) {
      return { ok: true, method: 'rest-api' };
    }

    return { ok: false, reason: `REST API failed with status ${restResponse.status}` };
  } catch (err) {
    return { ok: false, reason: String(err?.message || err) };
  }
}

/**
 * Start periodic health monitoring
 * @param {Function} onStateChange - Callback when health state changes
 */
export function startHealthMonitoring(onStateChange) {
  console.log('🩺 Starting Supabase health monitoring (60s intervals)');
  
  const checkHealth = async () => {
    const result = await testSupabaseConnection();
    const newState = result.ok;
    
    // Log state changes
    if (newState !== currentSupabaseState) {
      const stateMsg = newState ? 'UP' : 'DOWN';
      const reason = result.reason ? ` (${result.reason})` : '';
      const method = result.method ? ` via ${result.method}` : '';
      console.log(`🔄 Supabase connection state changed: ${stateMsg}${method}${reason}`);
      currentSupabaseState = newState;
      globalSupabaseHealthy = newState;
      
      // Call the state change callback
      if (onStateChange) {
        onStateChange(newState, result);
      }
    }
    
    return result;
  };

  // Initial check
  checkHealth();
  
  // Set up periodic monitoring
  globalThis.setInterval(checkHealth, 60000); // 60 seconds
}

/**
 * Get current health status
 * @returns {boolean} Current Supabase health status
 */
export function getSupabaseHealthStatus() {
  return globalSupabaseHealthy;
}