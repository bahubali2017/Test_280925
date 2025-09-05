import { QueryClient } from "@tanstack/react-query";

/**
 * Helper function to throw an error if the response is not ok
 * @param {Response} res - The fetch response object
 * @returns {Promise<Response>} The response if ok
 * @throws {Error} If the response is not ok
 */
async function throwIfResNotOk(res) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
  return res;
}

/**
 * API request options
 * @typedef {object} APIRequestOptions
 * @property {boolean} [noJson] - Don't parse JSON (e.g., for event-stream)
 * @property {boolean} [skipContentTypeCheck] - Skip JSON validation
 */

/**
 * Generic API request function
 * @param {string} method - HTTP method
 * @param {string} url - The URL to fetch
 * @param {object} [data] - Request payload (will be JSON.stringified)
 * @param {APIRequestOptions} [options={}] - Additional options
 * @returns {Promise<Response>} The raw Response object
 */
export async function apiRequest(method, url, data, options = {}) {
  // Ensure relative API path is normalized
  if (url.startsWith("/api") && !url.startsWith("http")) {
    url = url.replace(/^\/?/, "/");
  }

  /** @type {Record<string, string>} */
  const headers = {};
  if (data) {
    headers["Content-Type"] = "application/json";
    headers["Accept"] = options.noJson ? "text/event-stream" : "application/json";
  }

  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: data ? JSON.stringify(data) : undefined,
  });

  if (options.noJson) {
    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    return res;
  }

  await throwIfResNotOk(res);

  // Verify content type for API responses
  const contentType = res.headers.get("content-type");
  
  // Skip content type check if specified or verify it's JSON for API endpoints
  if (!options.skipContentTypeCheck && url.startsWith("/api") && contentType && !contentType.includes("application/json")) {
    console.error("Invalid content type:", contentType);
    throw new Error(`Expected JSON response but received ${contentType || "unknown content type"}`);
  }

  return res;
}

/**
 * @typedef {"returnNull" | "throw"} UnauthorizedBehavior
 */

/**
 * Generates a query function with defined 401 behavior
 * @param {{ on401: UnauthorizedBehavior }} options - Options
 * @returns {import("@tanstack/react-query").QueryFunction<any, unknown[]>}
 */
export const getQueryFn = ({ on401 }) => {
  /**
   * Query function for React Query
   * @param {object} context - Query context
   * @param {Array<string|any>} context.queryKey - Query key array where first element is a URL string
   * @returns {Promise<any>} Response data
   */
  return async ({ queryKey }) => {
    // Get URL from query key and validate it's a string
    if (!Array.isArray(queryKey) || queryKey.length === 0) {
      throw new Error('Invalid queryKey: Expected non-empty array');
    }
    
    // Convert and normalize URL
    let url = String(queryKey[0] || '');
    if (url.startsWith("/api") && !url.startsWith("http")) {
      url = url.replace(/^\/?/, "/");
    }

    const res = await fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
      },
    });

    if (on401 === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);

    // Verify content type for API responses
    const contentType = res.headers.get("content-type");
    
    // Check that API responses return proper JSON
    if (url.startsWith("/api") && contentType && !contentType.includes("application/json")) {
      console.error("Unexpected content type in queryFn:", contentType);
      throw new Error(`Expected JSON response but received ${contentType || "unknown content type"}`);
    }

    // Parse and return JSON response
    return await res.json();
  };
};

/**
 * Global QueryClient instance with configured defaults
 * @type {import('@tanstack/react-query').QueryClient}
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
