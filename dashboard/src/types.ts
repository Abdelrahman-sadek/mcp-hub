/**
 * TypeScript types for MCP Hub Dashboard
 */

export interface MCPServer {
  id: string;
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
  verified: boolean;
  healthStatus: 'online' | 'offline' | 'degraded' | 'unknown';
  lastChecked: string;
  capabilities?: string[];
  authentication?: {
    type: 'none' | 'api-key' | 'oauth';
    required: boolean;
  };
  rateLimit?: {
    requests: number;
    window: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Registry {
  version: string;
  lastUpdated: string;
  servers: MCPServer[];
  stats: {
    totalServers: number;
    onlineServers: number;
    totalRequests: number;
  };
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationInfo {
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface ServersResponse {
  servers: MCPServer[];
  pagination: PaginationInfo;
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
    type: 'none' | 'api-key' | 'oauth';
    required: boolean;
  };
}

export interface HealthCheckResult {
  serverId: string;
  status: 'online' | 'offline' | 'degraded';
  responseTime?: number;
  error?: string;
  timestamp: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  primary: string;
  secondary: string;
}

export interface AppState {
  theme: Theme;
  servers: MCPServer[];
  loading: boolean;
  error: string | null;
  filters: SearchFilters;
  selectedServer: MCPServer | null;
}

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface LoadingState {
  servers: boolean;
  serverDetail: boolean;
  healthCheck: boolean;
  submission: boolean;
}

export type HealthStatus = 'online' | 'offline' | 'degraded' | 'unknown';

export type AuthenticationType = 'none' | 'api-key' | 'oauth';

export type SortOption = 'name' | 'created' | 'updated' | 'health';

export type SortOrder = 'asc' | 'desc';
