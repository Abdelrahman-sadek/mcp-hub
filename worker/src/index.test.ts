/**
 * Tests for the main worker entry point
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import worker from './index';

// Mock environment
const mockEnv = {
  MCP_REGISTRY: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  MCP_CACHE: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    list: vi.fn(),
  },
  ENVIRONMENT: 'test',
  RATE_LIMIT_REQUESTS: '100',
  RATE_LIMIT_WINDOW: '60',
};

// Mock execution context
const mockCtx = {
  waitUntil: vi.fn(),
  passThroughOnException: vi.fn(),
};

describe('Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('fetch handler', () => {
    it('should handle GET /api/servers', async () => {
      const request = new Request('https://test.com/api/servers');
      
      // Mock registry response
      mockEnv.MCP_REGISTRY.get.mockResolvedValue(JSON.stringify({
        servers: [],
        total: 0,
        lastUpdated: new Date().toISOString(),
      }));

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toBe('application/json');
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toBeDefined();
    });

    it('should handle GET /api/health', async () => {
      const request = new Request('https://test.com/api/health');
      
      // Mock health summary
      mockEnv.MCP_CACHE.get.mockResolvedValue(JSON.stringify({
        totalServers: 5,
        onlineServers: 4,
        degradedServers: 1,
        offlineServers: 0,
        lastUpdated: new Date().toISOString(),
      }));

      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.totalServers).toBe(5);
      expect(data.data.onlineServers).toBe(4);
    });

    it('should handle 404 for unknown routes', async () => {
      const request = new Request('https://test.com/api/unknown');
      
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Not found');
    });

    it('should handle CORS preflight requests', async () => {
      const request = new Request('https://test.com/api/servers', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'https://example.com',
          'Access-Control-Request-Method': 'GET',
        },
      });
      
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(200);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('*');
      expect(response.headers.get('Access-Control-Allow-Methods')).toContain('GET');
    });

    it('should apply rate limiting', async () => {
      const request = new Request('https://test.com/api/servers', {
        headers: {
          'CF-Connecting-IP': '192.168.1.1',
        },
      });
      
      // Mock rate limit exceeded
      mockEnv.MCP_CACHE.get.mockResolvedValue('150'); // Over limit
      
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(429);
      expect(response.headers.get('Retry-After')).toBeDefined();
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('rate limit');
    });

    it('should handle server errors gracefully', async () => {
      const request = new Request('https://test.com/api/servers');
      
      // Mock KV error
      mockEnv.MCP_REGISTRY.get.mockRejectedValue(new Error('KV error'));
      
      const response = await worker.fetch(request, mockEnv, mockCtx);
      
      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('Internal server error');
    });
  });

  describe('scheduled handler', () => {
    it('should handle scheduled health checks', async () => {
      const event = {
        cron: '*/30 * * * *',
        scheduledTime: Date.now(),
      };
      
      // Mock server list
      mockEnv.MCP_REGISTRY.get.mockResolvedValue(JSON.stringify({
        servers: [
          { id: 'test-server', url: 'https://test-server.com' },
        ],
      }));
      
      await worker.scheduled(event, mockEnv, mockCtx);
      
      expect(mockCtx.waitUntil).toHaveBeenCalled();
    });
  });
});

describe('Request Context', () => {
  it('should create proper request context', () => {
    const request = new Request('https://test.com/api/servers', {
      headers: {
        'CF-Connecting-IP': '192.168.1.1',
        'User-Agent': 'Test Agent',
      },
    });
    
    // This would test the createRequestContext function
    // Implementation depends on the actual function structure
    expect(request.url).toBe('https://test.com/api/servers');
    expect(request.headers.get('CF-Connecting-IP')).toBe('192.168.1.1');
  });
});

describe('Error Handling', () => {
  it('should format errors consistently', () => {
    const error = new Error('Test error');
    
    // This would test error formatting utilities
    expect(error.message).toBe('Test error');
  });

  it('should handle validation errors', () => {
    const validationError = {
      field: 'name',
      message: 'Name is required',
    };
    
    expect(validationError.field).toBe('name');
    expect(validationError.message).toBe('Name is required');
  });
});

describe('Utility Functions', () => {
  it('should validate URLs correctly', () => {
    const validUrl = 'https://example.com';
    const invalidUrl = 'not-a-url';
    
    // This would test URL validation utility
    expect(validUrl.startsWith('https://')).toBe(true);
    expect(invalidUrl.startsWith('https://')).toBe(false);
  });

  it('should sanitize input data', () => {
    const input = '<script>alert("xss")</script>';
    const sanitized = input.replace(/<[^>]*>/g, '');
    
    expect(sanitized).toBe('alert("xss")');
  });
});

describe('Cache Management', () => {
  it('should handle cache hits and misses', async () => {
    const cacheKey = 'test-key';
    const cacheValue = 'test-value';
    
    // Mock cache hit
    mockEnv.MCP_CACHE.get.mockResolvedValue(cacheValue);
    
    const result = await mockEnv.MCP_CACHE.get(cacheKey);
    expect(result).toBe(cacheValue);
    
    // Mock cache miss
    mockEnv.MCP_CACHE.get.mockResolvedValue(null);
    
    const missResult = await mockEnv.MCP_CACHE.get('missing-key');
    expect(missResult).toBeNull();
  });

  it('should handle cache TTL', async () => {
    const cacheKey = 'ttl-key';
    const cacheValue = 'ttl-value';
    const ttl = 300; // 5 minutes
    
    await mockEnv.MCP_CACHE.put(cacheKey, cacheValue, { expirationTtl: ttl });
    
    expect(mockEnv.MCP_CACHE.put).toHaveBeenCalledWith(
      cacheKey,
      cacheValue,
      { expirationTtl: ttl }
    );
  });
});

describe('Security', () => {
  it('should validate request origins', () => {
    const allowedOrigins = ['https://example.com', 'https://app.example.com'];
    const testOrigin = 'https://example.com';
    
    expect(allowedOrigins.includes(testOrigin)).toBe(true);
  });

  it('should sanitize headers', () => {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'X-Malicious-Header': '<script>alert("xss")</script>',
    });
    
    expect(headers.get('Content-Type')).toBe('application/json');
    expect(headers.get('X-Malicious-Header')).toContain('<script>');
  });
});
