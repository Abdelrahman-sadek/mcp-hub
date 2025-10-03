/**
 * Authentication and rate limiting middleware for MCP Hub
 */

import { RequestContext, RateLimitInfo } from './types';

const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute in milliseconds
const RATE_LIMIT_MAX_REQUESTS = 100; // 100 requests per minute per IP

interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check rate limit for the current request
 */
export async function checkRateLimit(ctx: RequestContext): Promise<RateLimitResult> {
  const { env, ip } = ctx;
  
  if (!ip) {
    // If we can't get IP, allow the request but with minimal limits
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: Date.now() + RATE_LIMIT_WINDOW,
    };
  }

  const rateLimitKey = `rate_limit:${ip}`;
  const now = Date.now();
  const windowStart = now - RATE_LIMIT_WINDOW;

  try {
    // Get current rate limit data from KV
    const rateLimitData = await env.MCP_CACHE.get(rateLimitKey, 'json') as {
      requests: { timestamp: number }[];
      windowStart: number;
    } | null;

    let requests: { timestamp: number }[] = [];
    
    if (rateLimitData) {
      // Filter out requests outside the current window
      requests = rateLimitData.requests.filter(req => req.timestamp > windowStart);
    }

    // Check if rate limit is exceeded
    if (requests.length >= RATE_LIMIT_MAX_REQUESTS) {
      const oldestRequest = requests[0];
      const resetTime = oldestRequest.timestamp + RATE_LIMIT_WINDOW;
      
      return {
        allowed: false,
        limit: RATE_LIMIT_MAX_REQUESTS,
        remaining: 0,
        reset: resetTime,
      };
    }

    // Add current request
    requests.push({ timestamp: now });

    // Store updated rate limit data
    await env.MCP_CACHE.put(
      rateLimitKey,
      JSON.stringify({
        requests,
        windowStart: now,
      }),
      {
        expirationTtl: Math.ceil(RATE_LIMIT_WINDOW / 1000) + 60, // Add buffer
      }
    );

    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - requests.length,
      reset: now + RATE_LIMIT_WINDOW,
    };
  } catch (error) {
    console.error('Rate limit check failed:', error);
    
    // On error, allow the request but log the issue
    return {
      allowed: true,
      limit: RATE_LIMIT_MAX_REQUESTS,
      remaining: RATE_LIMIT_MAX_REQUESTS - 1,
      reset: now + RATE_LIMIT_WINDOW,
    };
  }
}

/**
 * Verify API key for admin endpoints
 */
export function verifyApiKey(ctx: RequestContext): boolean {
  const { request, env } = ctx;
  
  if (!env.ADMIN_API_KEY) {
    // If no admin API key is configured, deny access
    return false;
  }

  const apiKey = request.headers.get('X-API-Key') || request.headers.get('Authorization')?.replace('Bearer ', '');
  
  return apiKey === env.ADMIN_API_KEY;
}

/**
 * Verify GitHub token for webhook endpoints
 */
export function verifyGitHubToken(ctx: RequestContext): boolean {
  const { request, env } = ctx;
  
  if (!env.GITHUB_TOKEN) {
    // If no GitHub token is configured, deny access
    return false;
  }

  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('token ')) {
    return false;
  }

  const token = authHeader.replace('token ', '');
  return token === env.GITHUB_TOKEN;
}

/**
 * Extract user information from request headers
 */
export function extractUserInfo(ctx: RequestContext): {
  ip: string;
  userAgent: string;
  country?: string;
  city?: string;
} {
  const { request } = ctx;
  
  return {
    ip: request.headers.get('CF-Connecting-IP') || 'unknown',
    userAgent: request.headers.get('User-Agent') || 'unknown',
    country: request.headers.get('CF-IPCountry') || undefined,
    city: request.headers.get('CF-IPCity') || undefined,
  };
}

/**
 * Generate a secure random API key
 */
export function generateApiKey(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Hash a string using SHA-256 (for API key storage)
 */
export async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a hashed string
 */
export async function verifyHash(input: string, hash: string): Promise<boolean> {
  const inputHash = await hashString(input);
  return inputHash === hash;
}

/**
 * Create a JWT token (simplified implementation)
 */
export async function createJWT(payload: any, secret: string): Promise<string> {
  const header = {
    alg: 'HS256',
    typ: 'JWT',
  };

  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  
  const signature = await signHMAC(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify a JWT token
 */
export async function verifyJWT(token: string, secret: string): Promise<any | null> {
  try {
    const [encodedHeader, encodedPayload, signature] = token.split('.');
    
    if (!encodedHeader || !encodedPayload || !signature) {
      return null;
    }

    const expectedSignature = await signHMAC(`${encodedHeader}.${encodedPayload}`, secret);
    
    if (signature !== expectedSignature) {
      return null;
    }

    const payload = JSON.parse(atob(encodedPayload));
    
    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Sign data with HMAC-SHA256
 */
async function signHMAC(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  const signatureArray = Array.from(new Uint8Array(signature));
  return btoa(String.fromCharCode(...signatureArray));
}
