/**
 * Proxy functionality for MCP servers
 * Handles proxying requests to registered MCP servers with authentication and timeout
 */

import { RequestContext, MCPServer, ProxyRequest, ProxyResponse } from './types';
import { getServer } from './registry';
import { checkRateLimit } from './auth';

const PROXY_TIMEOUT = 30000; // 30 seconds
const MAX_BODY_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

/**
 * Proxy a request to an MCP server
 */
export async function proxyRequest(
  ctx: RequestContext,
  serverId: string,
  targetPath: string,
  method: string,
  headers: Record<string, string> = {},
  body?: any
): Promise<ProxyResponse> {
  try {
    // Validate method
    if (!ALLOWED_METHODS.includes(method.toUpperCase())) {
      throw new Error(`Method ${method} not allowed`);
    }

    // Get server details
    const server = await getServer(ctx, serverId);
    if (!server) {
      throw new Error(`Server ${serverId} not found`);
    }

    // Check if server is online
    if (server.healthStatus === 'offline') {
      throw new Error(`Server ${serverId} is currently offline`);
    }

    // Check rate limits
    const rateLimitResult = await checkRateLimit(ctx);
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded');
    }

    // Construct target URL
    const targetUrl = new URL(targetPath, server.url);
    
    // Validate target URL is within server's domain
    if (targetUrl.origin !== new URL(server.url).origin) {
      throw new Error('Target URL must be within the server\'s domain');
    }

    // Prepare headers
    const proxyHeaders = prepareProxyHeaders(headers, server);

    // Prepare body
    let proxyBody: string | undefined;
    if (body && ['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      proxyBody = typeof body === 'string' ? body : JSON.stringify(body);
      
      // Check body size
      if (proxyBody.length > MAX_BODY_SIZE) {
        throw new Error('Request body too large');
      }
    }

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PROXY_TIMEOUT);

    const startTime = Date.now();

    try {
      // Make the proxied request
      const response = await fetch(targetUrl.toString(), {
        method: method.toUpperCase(),
        headers: proxyHeaders,
        body: proxyBody,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      // Read response body
      const responseBody = await response.text();

      // Log the request
      await logProxyRequest(ctx, {
        serverId,
        targetUrl: targetUrl.toString(),
        method: method.toUpperCase(),
        requestHeaders: proxyHeaders,
        requestBody: proxyBody,
        responseStatus: response.status,
        responseHeaders: Object.fromEntries(response.headers.entries()),
        responseBody,
        responseTime,
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
        responseTime,
      };
    } catch (fetchError) {
      clearTimeout(timeoutId);
      const responseTime = Date.now() - startTime;

      let errorMessage = 'Request failed';
      if (fetchError instanceof Error) {
        if (fetchError.name === 'AbortError') {
          errorMessage = 'Request timeout';
        } else {
          errorMessage = fetchError.message;
        }
      }

      // Log the failed request
      await logProxyRequest(ctx, {
        serverId,
        targetUrl: targetUrl.toString(),
        method: method.toUpperCase(),
        requestHeaders: proxyHeaders,
        requestBody: proxyBody,
        responseStatus: 0,
        responseHeaders: {},
        responseBody: '',
        responseTime,
        error: errorMessage,
        timestamp: new Date().toISOString(),
      });

      throw new Error(errorMessage);
    }
  } catch (error) {
    console.error(`Proxy request failed for ${serverId}:`, error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      status: 500,
      statusText: 'Internal Server Error',
      headers: {},
      body: '',
      responseTime: 0,
    };
  }
}

/**
 * Prepare headers for the proxied request
 */
function prepareProxyHeaders(
  originalHeaders: Record<string, string>,
  server: MCPServer
): Record<string, string> {
  const headers: Record<string, string> = {
    'User-Agent': 'MCP-Hub-Proxy/1.0',
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  };

  // Copy allowed headers from original request
  const allowedHeaders = [
    'accept',
    'accept-encoding',
    'accept-language',
    'cache-control',
    'content-type',
    'if-match',
    'if-modified-since',
    'if-none-match',
    'if-unmodified-since',
    'range',
  ];

  for (const [key, value] of Object.entries(originalHeaders)) {
    const lowerKey = key.toLowerCase();
    if (allowedHeaders.includes(lowerKey)) {
      headers[key] = value;
    }
  }

  // Add authentication if required
  if (server.authentication?.required) {
    switch (server.authentication.type) {
      case 'api-key':
        // In a real implementation, you'd get the API key from secure storage
        // For now, we'll pass through any Authorization header
        if (originalHeaders.authorization || originalHeaders.Authorization) {
          headers.Authorization = originalHeaders.authorization || originalHeaders.Authorization;
        }
        break;
      case 'oauth':
        // Similar to API key, pass through Authorization header
        if (originalHeaders.authorization || originalHeaders.Authorization) {
          headers.Authorization = originalHeaders.authorization || originalHeaders.Authorization;
        }
        break;
    }
  }

  // Remove hop-by-hop headers
  const hopByHopHeaders = [
    'connection',
    'keep-alive',
    'proxy-authenticate',
    'proxy-authorization',
    'te',
    'trailers',
    'transfer-encoding',
    'upgrade',
  ];

  for (const header of hopByHopHeaders) {
    delete headers[header];
    delete headers[header.toLowerCase()];
  }

  return headers;
}

/**
 * Log proxy request for monitoring and debugging
 */
async function logProxyRequest(
  ctx: RequestContext,
  logEntry: {
    serverId: string;
    targetUrl: string;
    method: string;
    requestHeaders: Record<string, string>;
    requestBody?: string;
    responseStatus: number;
    responseHeaders: Record<string, string>;
    responseBody: string;
    responseTime: number;
    error?: string;
    timestamp: string;
  }
): Promise<void> {
  try {
    const { env } = ctx;
    
    // Store in KV with TTL (keep logs for 7 days)
    const logKey = `proxy_log:${logEntry.serverId}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`;
    
    await env.MCP_CACHE.put(
      logKey,
      JSON.stringify(logEntry),
      { expirationTtl: 7 * 24 * 60 * 60 } // 7 days
    );

    // Also update request count for the server
    const statsKey = `proxy_stats:${logEntry.serverId}`;
    const existingStats = await env.MCP_CACHE.get(statsKey);
    
    let stats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastRequest: logEntry.timestamp,
    };

    if (existingStats) {
      try {
        stats = JSON.parse(existingStats);
      } catch (e) {
        // Use default stats if parsing fails
      }
    }

    // Update stats
    stats.totalRequests++;
    if (logEntry.responseStatus >= 200 && logEntry.responseStatus < 400) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;
    }
    
    // Update average response time (simple moving average)
    stats.averageResponseTime = (stats.averageResponseTime + logEntry.responseTime) / 2;
    stats.lastRequest = logEntry.timestamp;

    await env.MCP_CACHE.put(
      statsKey,
      JSON.stringify(stats),
      { expirationTtl: 30 * 24 * 60 * 60 } // 30 days
    );

  } catch (error) {
    console.error('Failed to log proxy request:', error);
    // Don't throw - logging failures shouldn't break the proxy
  }
}

/**
 * Get proxy statistics for a server
 */
export async function getProxyStats(
  ctx: RequestContext,
  serverId: string
): Promise<{
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  averageResponseTime: number;
  lastRequest: string;
} | null> {
  try {
    const { env } = ctx;
    const statsKey = `proxy_stats:${serverId}`;
    const stats = await env.MCP_CACHE.get(statsKey);
    
    if (!stats) {
      return null;
    }

    return JSON.parse(stats);
  } catch (error) {
    console.error(`Failed to get proxy stats for ${serverId}:`, error);
    return null;
  }
}

/**
 * Get recent proxy logs for a server
 */
export async function getProxyLogs(
  ctx: RequestContext,
  serverId: string,
  limit: number = 50
): Promise<any[]> {
  try {
    const { env } = ctx;
    
    // List all keys with the proxy log prefix for this server
    const listResult = await env.MCP_CACHE.list({
      prefix: `proxy_log:${serverId}:`,
      limit,
    });

    const logs = [];
    for (const key of listResult.keys) {
      try {
        const logData = await env.MCP_CACHE.get(key.name);
        if (logData) {
          logs.push(JSON.parse(logData));
        }
      } catch (e) {
        // Skip invalid log entries
        continue;
      }
    }

    // Sort by timestamp (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return logs.slice(0, limit);
  } catch (error) {
    console.error(`Failed to get proxy logs for ${serverId}:`, error);
    return [];
  }
}
