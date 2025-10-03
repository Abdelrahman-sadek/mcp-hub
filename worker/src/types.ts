/**
 * TypeScript types and interfaces for MCP Hub
 */

export interface MCPServer {
  id: string;                    // Unique identifier (slug)
  name: string;                  // Display name
  description: string;           // Short description (max 200 chars)
  url: string;                   // MCP server endpoint URL
  version: string;               // Semantic version (e.g., "1.0.0")
  tags: string[];                // Categories: ["docs", "ai", "data", etc.]
  author: {
    name: string;
    url?: string;
    github?: string;
  };
  verified: boolean;             // Manually verified by maintainers
  healthStatus: "online" | "offline" | "degraded" | "unknown";
  lastChecked: string;           // ISO 8601 timestamp
  capabilities?: string[];       // Supported MCP methods
  authentication?: {
    type: "none" | "api-key" | "oauth";
    required: boolean;
  };
  rateLimit?: {
    requests: number;
    window: string;              // e.g., "1h", "1d"
  };
  createdAt: string;
  updatedAt: string;
}

export interface Registry {
  version: string;               // Registry schema version
  lastUpdated: string;
  servers: MCPServer[];
  stats: {
    totalServers: number;
    onlineServers: number;
    totalRequests: number;
  };
}

export interface FederatedSchema {
  servers: {
    [serverId: string]: {
      methods: string[];
      version: string;
    };
  };
  unifiedMethods: string[];      // All unique methods
  conflicts: {
    method: string;
    servers: string[];
  }[];
}

export interface ProxyRequest {
  serverId: string;              // Target server from registry
  method: string;                // HTTP method
  path: string;                  // Path on target server
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  success: boolean;
  data?: any;
  error?: string;
  statusCode: number;
  headers?: Record<string, string>;
}

export interface HealthCheckResult {
  serverId: string;
  status: "online" | "offline" | "degraded";
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  window: string;
}

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
}

export interface RequestContext {
  request: Request;
  env: Env;
  ctx: ExecutionContext;
  ip?: string;
  userAgent?: string;
  rateLimitKey?: string;
}

export interface Env {
  MCP_REGISTRY: KVNamespace;
  MCP_CACHE: KVNamespace;
  GITHUB_TOKEN?: string;
  ADMIN_API_KEY?: string;
}

export interface ScheduledEvent {
  cron: string;
  scheduledTime: number;
}

export interface ProxyRequest {
  serverId: string;
  path: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
}

export interface ProxyResponse {
  success: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: string;
  responseTime: number;
  error?: string;
}

export interface SearchFilters {
  query?: string;
  tags?: string[];
  verified?: boolean;
  healthStatus?: string[];
  sortBy?: 'name' | 'created' | 'updated' | 'health';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

export interface ServerSubmission {
  name: string;
  description: string;
  url: string;
  version: string;
  tags: string[];
  author: {
    name: string;
    url?: string;
    github?: string;
  };
  authentication?: {
    type: "none" | "api-key" | "oauth";
    required: boolean;
  };
}
