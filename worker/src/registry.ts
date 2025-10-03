/**
 * Server registry management for MCP Hub
 */

import { RequestContext, Registry, MCPServer, ValidationError } from './types';
import { getCachedData, setCachedData } from './cache';

const REGISTRY_CACHE_KEY = 'registry';
const REGISTRY_CACHE_TTL = 300; // 5 minutes
const GITHUB_REGISTRY_URL = 'https://raw.githubusercontent.com/YOUR_USERNAME/mcp-hub/main/dashboard/public/servers.json';

/**
 * Get the complete registry from cache or GitHub
 */
export async function getRegistry(ctx: RequestContext): Promise<Registry> {
  try {
    // Try to get from cache first
    const cached = await getCachedData<Registry>(ctx, REGISTRY_CACHE_KEY);
    if (cached) {
      return cached;
    }

    // Fetch from GitHub if not in cache
    const registry = await fetchRegistryFromGitHub();
    
    // Cache the result
    await setCachedData(ctx, REGISTRY_CACHE_KEY, registry, REGISTRY_CACHE_TTL);
    
    return registry;
  } catch (error) {
    console.error('Failed to get registry:', error);
    
    // Return fallback registry
    return createFallbackRegistry();
  }
}

/**
 * Get a specific server by ID
 */
export async function getServer(ctx: RequestContext, id: string): Promise<MCPServer | null> {
  try {
    const registry = await getRegistry(ctx);
    return registry.servers.find(server => server.id === id) || null;
  } catch (error) {
    console.error('Failed to get server:', error);
    return null;
  }
}

/**
 * Validate a server object against the schema
 */
export function validateServer(server: any): ValidationError[] {
  const errors: ValidationError[] = [];

  // Required fields
  if (!server.id || typeof server.id !== 'string') {
    errors.push({
      field: 'id',
      message: 'ID is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!server.name || typeof server.name !== 'string') {
    errors.push({
      field: 'name',
      message: 'Name is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!server.description || typeof server.description !== 'string') {
    errors.push({
      field: 'description',
      message: 'Description is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  } else if (server.description.length > 200) {
    errors.push({
      field: 'description',
      message: 'Description must be 200 characters or less',
      code: 'MAX_LENGTH',
    });
  }

  if (!server.url || typeof server.url !== 'string') {
    errors.push({
      field: 'url',
      message: 'URL is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  } else if (!isValidUrl(server.url)) {
    errors.push({
      field: 'url',
      message: 'URL must be a valid HTTPS URL',
      code: 'INVALID_URL',
    });
  }

  if (!server.version || typeof server.version !== 'string') {
    errors.push({
      field: 'version',
      message: 'Version is required and must be a string',
      code: 'REQUIRED_FIELD',
    });
  } else if (!isValidSemver(server.version)) {
    errors.push({
      field: 'version',
      message: 'Version must be a valid semantic version (e.g., 1.0.0)',
      code: 'INVALID_VERSION',
    });
  }

  if (!Array.isArray(server.tags)) {
    errors.push({
      field: 'tags',
      message: 'Tags must be an array',
      code: 'INVALID_TYPE',
    });
  } else if (server.tags.length === 0) {
    errors.push({
      field: 'tags',
      message: 'At least one tag is required',
      code: 'REQUIRED_FIELD',
    });
  }

  if (!server.author || typeof server.author !== 'object') {
    errors.push({
      field: 'author',
      message: 'Author is required and must be an object',
      code: 'REQUIRED_FIELD',
    });
  } else {
    if (!server.author.name || typeof server.author.name !== 'string') {
      errors.push({
        field: 'author.name',
        message: 'Author name is required and must be a string',
        code: 'REQUIRED_FIELD',
      });
    }
  }

  return errors;
}

/**
 * Update health status for a server
 */
export async function updateHealthStatus(
  ctx: RequestContext,
  serverId: string,
  status: 'online' | 'offline' | 'degraded'
): Promise<boolean> {
  try {
    // This would typically update the registry in KV storage
    // For now, we'll just log the update
    console.log(`Health status update: ${serverId} -> ${status}`);
    
    // TODO: Implement actual health status update in KV storage
    return true;
  } catch (error) {
    console.error('Failed to update health status:', error);
    return false;
  }
}

/**
 * Search servers with filters
 */
export async function searchServers(
  ctx: RequestContext,
  query?: string,
  tags?: string[],
  verified?: boolean
): Promise<MCPServer[]> {
  try {
    const registry = await getRegistry(ctx);
    let servers = registry.servers;

    if (query) {
      const searchTerm = query.toLowerCase();
      servers = servers.filter(server =>
        server.name.toLowerCase().includes(searchTerm) ||
        server.description.toLowerCase().includes(searchTerm) ||
        server.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (tags && tags.length > 0) {
      servers = servers.filter(server =>
        tags.some(tag => server.tags.includes(tag))
      );
    }

    if (verified !== undefined) {
      servers = servers.filter(server => server.verified === verified);
    }

    return servers;
  } catch (error) {
    console.error('Failed to search servers:', error);
    return [];
  }
}

/**
 * Fetch registry from GitHub
 */
async function fetchRegistryFromGitHub(): Promise<Registry> {
  const response = await fetch(GITHUB_REGISTRY_URL);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch registry: ${response.status}`);
  }

  const registry = await response.json() as any;

  // Validate registry structure
  if (!registry.version || !registry.servers || !Array.isArray(registry.servers)) {
    throw new Error('Invalid registry format');
  }

  return registry as Registry;
}

/**
 * Create a fallback registry when GitHub is unavailable
 */
function createFallbackRegistry(): Registry {
  return {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
    servers: [
      {
        id: 'example-mcp',
        name: 'Example MCP Server',
        description: 'A sample MCP server for demonstration purposes',
        url: 'https://example.com/mcp',
        version: '1.0.0',
        tags: ['example', 'demo'],
        author: {
          name: 'MCP Hub Team',
          github: 'mcp-hub',
        },
        verified: true,
        healthStatus: 'unknown',
        lastChecked: new Date().toISOString(),
        capabilities: ['query', 'chat', 'tools'],
        authentication: {
          type: 'none',
          required: false,
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ],
    stats: {
      totalServers: 1,
      onlineServers: 0,
      totalRequests: 0,
    },
  };
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate semantic version format
 */
function isValidSemver(version: string): boolean {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}
