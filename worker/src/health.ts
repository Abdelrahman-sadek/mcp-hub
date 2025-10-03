/**
 * Health checking system for MCP servers
 */

import { RequestContext, MCPServer, HealthCheckResult } from './types';
import { getRegistry } from './registry';
import { setCachedData, getCachedData } from './cache';

const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
const HEALTH_CHECK_CACHE_TTL = 300; // 5 minutes
const MAX_CONCURRENT_CHECKS = 10; // Limit concurrent health checks

/**
 * Check health of a single MCP server
 */
export async function checkServerHealth(server: MCPServer): Promise<HealthCheckResult> {
  const startTime = Date.now();
  
  try {
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    // Attempt to connect to the server
    const response = await fetch(server.url, {
      method: 'HEAD', // Use HEAD to minimize data transfer
      signal: controller.signal,
      headers: {
        'User-Agent': 'MCP-Hub-Health-Checker/1.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Determine health status based on response
    let status: 'online' | 'offline' | 'degraded';
    
    if (response.ok) {
      // Consider degraded if response time is too high
      status = responseTime > 10000 ? 'degraded' : 'online';
    } else if (response.status >= 500) {
      status = 'degraded'; // Server errors indicate degraded service
    } else {
      status = 'offline'; // Client errors or other issues
    }

    return {
      serverId: server.id,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Determine error type
    let status: 'offline' | 'degraded' = 'offline';
    let errorMessage = 'Unknown error';

    if (error instanceof Error) {
      errorMessage = error.message;
      
      // Timeout errors indicate degraded service
      if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
        status = 'degraded';
        errorMessage = 'Request timeout';
      }
      // Network errors indicate offline
      else if (errorMessage.includes('fetch') || errorMessage.includes('network')) {
        status = 'offline';
        errorMessage = 'Network error';
      }
    }

    return {
      serverId: server.id,
      status,
      responseTime,
      error: errorMessage,
      timestamp: new Date().toISOString(),
    };
  }
}

/**
 * Check health of all servers in the registry
 */
export async function checkAllServersHealth(ctx: RequestContext): Promise<HealthCheckResult[]> {
  try {
    const registry = await getRegistry(ctx);
    const servers = registry.servers;

    console.log(`Starting health check for ${servers.length} servers`);

    // Process servers in batches to avoid overwhelming the system
    const results: HealthCheckResult[] = [];
    
    for (let i = 0; i < servers.length; i += MAX_CONCURRENT_CHECKS) {
      const batch = servers.slice(i, i + MAX_CONCURRENT_CHECKS);
      
      const batchPromises = batch.map(server => 
        checkServerHealth(server).catch(error => {
          console.error(`Health check failed for ${server.id}:`, error);
          return {
            serverId: server.id,
            status: 'offline' as const,
            error: error instanceof Error ? error.message : 'Health check failed',
            timestamp: new Date().toISOString(),
          };
        })
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
    }

    // Store health check results in KV
    await storeHealthCheckResults(ctx, results);

    console.log(`Health check completed for ${results.length} servers`);
    return results;
  } catch (error) {
    console.error('Failed to check servers health:', error);
    throw error;
  }
}

/**
 * Store health check results in KV storage
 */
async function storeHealthCheckResults(
  ctx: RequestContext,
  results: HealthCheckResult[]
): Promise<void> {
  try {
    const { env } = ctx;
    
    // Store individual server health results
    const storePromises = results.map(result => 
      env.MCP_CACHE.put(
        `health:${result.serverId}`,
        JSON.stringify(result),
        { expirationTtl: HEALTH_CHECK_CACHE_TTL * 2 } // Store longer than cache TTL
      )
    );

    // Store aggregated health summary
    const summary = {
      totalServers: results.length,
      onlineServers: results.filter(r => r.status === 'online').length,
      degradedServers: results.filter(r => r.status === 'degraded').length,
      offlineServers: results.filter(r => r.status === 'offline').length,
      lastUpdated: new Date().toISOString(),
    };

    storePromises.push(
      env.MCP_CACHE.put(
        'health:summary',
        JSON.stringify(summary),
        { expirationTtl: HEALTH_CHECK_CACHE_TTL * 2 }
      )
    );

    await Promise.all(storePromises);
  } catch (error) {
    console.error('Failed to store health check results:', error);
  }
}

/**
 * Get health status for a specific server
 */
export async function getServerHealthStatus(
  ctx: RequestContext,
  serverId: string
): Promise<HealthCheckResult | null> {
  try {
    const cached = await getCachedData<HealthCheckResult>(ctx, `health:${serverId}`);
    return cached;
  } catch (error) {
    console.error(`Failed to get health status for ${serverId}:`, error);
    return null;
  }
}

/**
 * Get health summary for all servers
 */
export async function getHealthSummary(ctx: RequestContext): Promise<{
  totalServers: number;
  onlineServers: number;
  degradedServers: number;
  offlineServers: number;
  lastUpdated: string;
} | null> {
  try {
    const cached = await getCachedData<{
      totalServers: number;
      onlineServers: number;
      degradedServers: number;
      offlineServers: number;
      lastUpdated: string;
    }>(ctx, 'health:summary');
    
    return cached;
  } catch (error) {
    console.error('Failed to get health summary:', error);
    return null;
  }
}

/**
 * Update health status for a specific server in the registry
 */
export async function updateServerHealthInRegistry(
  ctx: RequestContext,
  serverId: string,
  healthResult: HealthCheckResult
): Promise<boolean> {
  try {
    // This would typically update the registry in KV storage
    // For now, we'll cache the updated status
    await setCachedData(
      ctx,
      `server_health:${serverId}`,
      {
        healthStatus: healthResult.status,
        lastChecked: healthResult.timestamp,
        responseTime: healthResult.responseTime,
        error: healthResult.error,
      },
      HEALTH_CHECK_CACHE_TTL
    );

    return true;
  } catch (error) {
    console.error(`Failed to update health status for ${serverId}:`, error);
    return false;
  }
}

/**
 * Get health check history for a server
 */
export async function getServerHealthHistory(
  ctx: RequestContext,
  serverId: string,
  limit: number = 24
): Promise<HealthCheckResult[]> {
  try {
    // This would typically fetch from a time-series database
    // For now, return the current status as a single-item array
    const current = await getServerHealthStatus(ctx, serverId);
    return current ? [current] : [];
  } catch (error) {
    console.error(`Failed to get health history for ${serverId}:`, error);
    return [];
  }
}

/**
 * Calculate server uptime percentage
 */
export function calculateUptime(healthHistory: HealthCheckResult[]): number {
  if (healthHistory.length === 0) return 0;
  
  const onlineCount = healthHistory.filter(h => h.status === 'online').length;
  return (onlineCount / healthHistory.length) * 100;
}

/**
 * Determine if a server needs immediate attention
 */
export function isServerCritical(healthResult: HealthCheckResult): boolean {
  return (
    healthResult.status === 'offline' ||
    (healthResult.status === 'degraded' && (healthResult.responseTime || 0) > 20000)
  );
}

/**
 * Format health status for display
 */
export function formatHealthStatus(status: string): {
  label: string;
  color: string;
  icon: string;
} {
  switch (status) {
    case 'online':
      return { label: 'Online', color: 'success', icon: '🟢' };
    case 'degraded':
      return { label: 'Degraded', color: 'warning', icon: '🟡' };
    case 'offline':
      return { label: 'Offline', color: 'error', icon: '🔴' };
    default:
      return { label: 'Unknown', color: 'gray', icon: '⚪' };
  }
}
