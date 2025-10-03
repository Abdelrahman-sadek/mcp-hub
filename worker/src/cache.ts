/**
 * Response caching layer for MCP Hub
 */

import { RequestContext, CacheEntry } from './types';

const DEFAULT_TTL = 300; // 5 minutes in seconds

/**
 * Get cached data from KV storage
 */
export async function getCachedData<T>(
  ctx: RequestContext,
  key: string
): Promise<T | null> {
  try {
    const { env } = ctx;
    const cached = await env.MCP_CACHE.get(key, 'json') as CacheEntry<T> | null;
    
    if (!cached) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now > cached.timestamp + (cached.ttl * 1000)) {
      // Cache expired, delete it
      await env.MCP_CACHE.delete(key);
      return null;
    }

    return cached.data;
  } catch (error) {
    console.error('Cache get error:', error);
    return null;
  }
}

/**
 * Set cached data in KV storage
 */
export async function setCachedData<T>(
  ctx: RequestContext,
  key: string,
  data: T,
  ttl: number = DEFAULT_TTL
): Promise<boolean> {
  try {
    const { env } = ctx;
    
    const cacheEntry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    await env.MCP_CACHE.put(
      key,
      JSON.stringify(cacheEntry),
      {
        expirationTtl: ttl + 60, // Add buffer to KV TTL
      }
    );

    return true;
  } catch (error) {
    console.error('Cache set error:', error);
    return false;
  }
}

/**
 * Delete cached data from KV storage
 */
export async function deleteCachedData(
  ctx: RequestContext,
  key: string
): Promise<boolean> {
  try {
    const { env } = ctx;
    await env.MCP_CACHE.delete(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error);
    return false;
  }
}

/**
 * Generate cache key for API responses
 */
export function generateCacheKey(
  endpoint: string,
  params?: Record<string, any>
): string {
  let key = `api:${endpoint}`;
  
  if (params && Object.keys(params).length > 0) {
    // Sort params for consistent cache keys
    const sortedParams = Object.keys(params)
      .sort()
      .map(k => `${k}=${params[k]}`)
      .join('&');
    
    key += `:${btoa(sortedParams)}`;
  }
  
  return key;
}

/**
 * Cache middleware for API responses
 */
export async function withCache<T>(
  ctx: RequestContext,
  cacheKey: string,
  ttl: number,
  fetchFn: () => Promise<T>
): Promise<T> {
  // Try to get from cache first
  const cached = await getCachedData<T>(ctx, cacheKey);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetchFn();
  
  // Cache the result
  await setCachedData(ctx, cacheKey, data, ttl);
  
  return data;
}

/**
 * Invalidate cache entries by pattern
 */
export async function invalidateCachePattern(
  ctx: RequestContext,
  pattern: string
): Promise<number> {
  try {
    const { env } = ctx;
    
    // KV doesn't support pattern matching, so we need to track keys
    // This is a simplified implementation
    const keysToDelete: string[] = [];
    
    // Get list of cache keys (this would need to be maintained separately)
    const cacheKeys = await env.MCP_CACHE.get('cache_keys', 'json') as string[] | null;
    
    if (cacheKeys) {
      for (const key of cacheKeys) {
        if (key.includes(pattern)) {
          keysToDelete.push(key);
        }
      }
    }

    // Delete matching keys
    for (const key of keysToDelete) {
      await env.MCP_CACHE.delete(key);
    }

    // Update cache keys list
    if (cacheKeys) {
      const updatedKeys = cacheKeys.filter(key => !keysToDelete.includes(key));
      await env.MCP_CACHE.put('cache_keys', JSON.stringify(updatedKeys));
    }

    return keysToDelete.length;
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return 0;
  }
}

/**
 * Get cache statistics
 */
export async function getCacheStats(ctx: RequestContext): Promise<{
  totalKeys: number;
  hitRate?: number;
  missRate?: number;
}> {
  try {
    const { env } = ctx;
    
    // Get cache keys list
    const cacheKeys = await env.MCP_CACHE.get('cache_keys', 'json') as string[] | null;
    const totalKeys = cacheKeys ? cacheKeys.length : 0;

    // Get hit/miss stats if available
    const stats = await env.MCP_CACHE.get('cache_stats', 'json') as {
      hits: number;
      misses: number;
    } | null;

    let hitRate: number | undefined;
    let missRate: number | undefined;

    if (stats && (stats.hits + stats.misses) > 0) {
      const total = stats.hits + stats.misses;
      hitRate = stats.hits / total;
      missRate = stats.misses / total;
    }

    return {
      totalKeys,
      hitRate,
      missRate,
    };
  } catch (error) {
    console.error('Cache stats error:', error);
    return { totalKeys: 0 };
  }
}

/**
 * Update cache statistics
 */
export async function updateCacheStats(
  ctx: RequestContext,
  hit: boolean
): Promise<void> {
  try {
    const { env } = ctx;
    
    const stats = await env.MCP_CACHE.get('cache_stats', 'json') as {
      hits: number;
      misses: number;
    } | null;

    const newStats = {
      hits: (stats?.hits || 0) + (hit ? 1 : 0),
      misses: (stats?.misses || 0) + (hit ? 0 : 1),
    };

    await env.MCP_CACHE.put('cache_stats', JSON.stringify(newStats));
  } catch (error) {
    console.error('Cache stats update error:', error);
  }
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmUpCache(ctx: RequestContext): Promise<void> {
  try {
    // This would typically pre-load frequently accessed data
    console.log('Cache warm-up initiated');
    
    // Example: Pre-load registry data
    // const registry = await fetchRegistryFromGitHub();
    // await setCachedData(ctx, 'registry', registry, 300);
    
  } catch (error) {
    console.error('Cache warm-up error:', error);
  }
}

/**
 * Clear all cache data
 */
export async function clearAllCache(ctx: RequestContext): Promise<boolean> {
  try {
    const { env } = ctx;
    
    // Get all cache keys
    const cacheKeys = await env.MCP_CACHE.get('cache_keys', 'json') as string[] | null;
    
    if (cacheKeys) {
      // Delete all cached data
      for (const key of cacheKeys) {
        await env.MCP_CACHE.delete(key);
      }
    }

    // Clear cache keys list and stats
    await env.MCP_CACHE.delete('cache_keys');
    await env.MCP_CACHE.delete('cache_stats');

    return true;
  } catch (error) {
    console.error('Clear cache error:', error);
    return false;
  }
}
