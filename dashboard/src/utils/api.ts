/**
 * API client for MCP Hub Worker
 */

import { APIResponse, MCPServer, ServersResponse, SearchFilters, ServerSubmission } from '../types';

// API base URL - will be replaced with actual Cloudflare Worker URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://mcp-hub-worker.your-subdomain.workers.dev';

class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public response?: any
  ) {
    super(message);
    this.name = 'APIError';
  }
}

/**
 * Make HTTP request with error handling
 */
async function makeRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const defaultHeaders = {
    'Content-Type': 'application/json',
  };

  const config: RequestInit = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  try {
    const response = await fetch(url, config);
    const data: APIResponse<T> = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || `HTTP ${response.status}`,
        response.status,
        data
      );
    }

    if (!data.success) {
      throw new APIError(
        data.error || 'API request failed',
        response.status,
        data
      );
    }

    return data.data as T;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }

    // Network or parsing error
    throw new APIError(
      error instanceof Error ? error.message : 'Network error',
      0
    );
  }
}

/**
 * Get all servers with optional filtering
 */
export async function getServers(filters: SearchFilters = {}): Promise<ServersResponse> {
  const params = new URLSearchParams();
  
  if (filters.query) params.append('q', filters.query);
  if (filters.tags?.length) params.append('tags', filters.tags.join(','));
  if (filters.verified !== undefined) params.append('verified', filters.verified.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  if (filters.offset) params.append('offset', filters.offset.toString());

  const queryString = params.toString();
  const endpoint = `/api/servers${queryString ? `?${queryString}` : ''}`;

  return makeRequest<ServersResponse>(endpoint);
}

/**
 * Get a specific server by ID
 */
export async function getServer(id: string): Promise<MCPServer> {
  return makeRequest<MCPServer>(`/api/servers/${id}`);
}

/**
 * Get server schema
 */
export async function getServerSchema(id: string): Promise<any> {
  return makeRequest<any>(`/api/servers/${id}/schema`);
}

/**
 * Get API statistics
 */
export async function getStats(): Promise<{
  totalServers: number;
  onlineServers: number;
  totalRequests: number;
}> {
  return makeRequest<{
    totalServers: number;
    onlineServers: number;
    totalRequests: number;
  }>('/api/stats');
}

/**
 * Check health of all servers
 */
export async function checkHealth(force: boolean = false): Promise<any> {
  const params = force ? '?force=true' : '';
  return makeRequest<any>(`/api/health${params}`);
}

/**
 * Get health status for a specific server
 */
export async function getServerHealth(serverId: string): Promise<any> {
  return makeRequest<any>(`/api/servers/${serverId}/health`);
}

/**
 * Submit a new server for review
 */
export async function submitServer(server: ServerSubmission): Promise<any> {
  return makeRequest<any>('/api/submit', {
    method: 'POST',
    body: JSON.stringify(server),
  });
}

/**
 * Proxy a request to an MCP server
 */
export async function proxyRequest(
  serverId: string,
  method: string,
  path: string,
  headers?: Record<string, string>,
  body?: any
): Promise<any> {
  return makeRequest<any>('/api/proxy', {
    method: 'POST',
    body: JSON.stringify({
      serverId,
      method,
      path,
      headers,
      body,
    }),
  });
}

/**
 * Get servers from local registry file (fallback)
 */
export async function getServersFromRegistry(): Promise<MCPServer[]> {
  try {
    const response = await fetch('/mcp-hub/servers.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const registry = await response.json();
    return registry.servers || [];
  } catch (error) {
    console.error('Failed to fetch servers from registry:', error);
    return [];
  }
}

/**
 * Validate server URL
 */
export async function validateServerUrl(url: string): Promise<{
  valid: boolean;
  error?: string;
  responseTime?: number;
}> {
  try {
    const startTime = Date.now();
    const response = await fetch(url, {
      method: 'HEAD',
      mode: 'no-cors', // Avoid CORS issues for validation
    });
    const responseTime = Date.now() - startTime;

    return {
      valid: true,
      responseTime,
    };
  } catch (error) {
    return {
      valid: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Search servers with debouncing
 */
export function createDebouncedSearch(
  searchFn: (query: string) => Promise<MCPServer[]>,
  delay: number = 300
) {
  let timeoutId: NodeJS.Timeout;

  return (query: string): Promise<MCPServer[]> => {
    return new Promise((resolve, reject) => {
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(async () => {
        try {
          const results = await searchFn(query);
          resolve(results);
        } catch (error) {
          reject(error);
        }
      }, delay);
    });
  };
}

export { APIError };
