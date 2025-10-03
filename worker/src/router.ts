/**
 * Request routing logic for MCP Hub API
 */

import { RequestContext, APIResponse } from './types';
import { getRegistry, getServer } from './registry';
import { checkRateLimit } from './auth';

export async function handleRequest(ctx: RequestContext): Promise<Response> {
  const { request } = ctx;
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method;

  // Apply rate limiting
  const rateLimitResult = await checkRateLimit(ctx);
  if (!rateLimitResult.allowed) {
    return createErrorResponse(
      'Rate limit exceeded',
      429,
      {
        'X-RateLimit-Limit': rateLimitResult.limit.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': rateLimitResult.reset.toString(),
      }
    );
  }

  // Add rate limit headers to all responses
  const rateLimitHeaders = {
    'X-RateLimit-Limit': rateLimitResult.limit.toString(),
    'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
    'X-RateLimit-Reset': rateLimitResult.reset.toString(),
  };

  try {
    // Route handling
    if (path.startsWith('/api/')) {
      return await handleAPIRequest(ctx, path, method, rateLimitHeaders);
    }

    // Health check endpoint
    if (path === '/health' || path === '/') {
      return createSuccessResponse(
        { status: 'healthy', timestamp: new Date().toISOString() },
        rateLimitHeaders
      );
    }

    // 404 for unknown routes
    return createErrorResponse('Not found', 404, rateLimitHeaders);
  } catch (error) {
    console.error('Router error:', error);
    return createErrorResponse(
      'Internal server error',
      500,
      rateLimitHeaders
    );
  }
}

async function handleAPIRequest(
  ctx: RequestContext,
  path: string,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  const pathParts = path.split('/').filter(Boolean);
  
  // Remove 'api' from path parts
  pathParts.shift();

  switch (pathParts[0]) {
    case 'servers':
      return await handleServersEndpoint(ctx, pathParts, method, rateLimitHeaders);
    
    case 'health':
      return await handleHealthEndpoint(ctx, method, rateLimitHeaders);
    
    case 'stats':
      return await handleStatsEndpoint(ctx, method, rateLimitHeaders);
    
    case 'proxy':
      return await handleProxyEndpoint(ctx, method, rateLimitHeaders);
    
    case 'submit':
      return await handleSubmitEndpoint(ctx, method, rateLimitHeaders);

    case 'schema':
      return await handleFederatedSchemaEndpoint(ctx, method, rateLimitHeaders);

    default:
      return createErrorResponse('API endpoint not found', 404, rateLimitHeaders);
  }
}

async function handleServersEndpoint(
  ctx: RequestContext,
  pathParts: string[],
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  try {
    if (pathParts.length === 1) {
      // GET /api/servers - List all servers
      const url = new URL(ctx.request.url);
      const query = url.searchParams.get('q') || '';
      const tags = url.searchParams.get('tags')?.split(',') || [];
      const verified = url.searchParams.get('verified') === 'true';
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const offset = parseInt(url.searchParams.get('offset') || '0');

      const registry = await getRegistry(ctx);
      let servers = registry.servers;

      // Apply filters
      if (query) {
        const searchTerm = query.toLowerCase();
        servers = servers.filter(server => 
          server.name.toLowerCase().includes(searchTerm) ||
          server.description.toLowerCase().includes(searchTerm) ||
          server.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      }

      if (tags.length > 0) {
        servers = servers.filter(server =>
          tags.some(tag => server.tags.includes(tag))
        );
      }

      if (verified) {
        servers = servers.filter(server => server.verified);
      }

      // Apply pagination
      const total = servers.length;
      servers = servers.slice(offset, offset + limit);

      return createSuccessResponse(
        {
          servers,
          pagination: {
            total,
            limit,
            offset,
            hasMore: offset + limit < total,
          },
        },
        rateLimitHeaders
      );
    } else if (pathParts.length === 2) {
      // GET /api/servers/:id - Get specific server
      const serverId = pathParts[1];
      const server = await getServer(ctx, serverId);
      
      if (!server) {
        return createErrorResponse('Server not found', 404, rateLimitHeaders);
      }

      return createSuccessResponse(server, rateLimitHeaders);
    } else if (pathParts.length === 3 && pathParts[2] === 'schema') {
      // GET /api/servers/:id/schema - Get server schema (placeholder)
      const serverId = pathParts[1];
      const server = await getServer(ctx, serverId);
      
      if (!server) {
        return createErrorResponse('Server not found', 404, rateLimitHeaders);
      }

      // TODO: Implement schema federation
      return createSuccessResponse(
        {
          serverId,
          schema: {
            methods: server.capabilities || [],
            version: server.version,
          },
        },
        rateLimitHeaders
      );
    }

    return createErrorResponse('Invalid servers endpoint', 400, rateLimitHeaders);
  } catch (error) {
    console.error('Servers endpoint error:', error);
    return createErrorResponse('Failed to fetch servers', 500, rateLimitHeaders);
  }
}

async function handleHealthEndpoint(
  ctx: RequestContext,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  try {
    const { getHealthSummary, checkAllServersHealth } = await import('./health');

    // Check if we should force a new health check
    const url = new URL(ctx.request.url);
    const forceCheck = url.searchParams.get('force') === 'true';

    if (forceCheck) {
      // Perform immediate health check
      const results = await checkAllServersHealth(ctx);

      const summary = {
        totalServers: results.length,
        onlineServers: results.filter(r => r.status === 'online').length,
        degradedServers: results.filter(r => r.status === 'degraded').length,
        offlineServers: results.filter(r => r.status === 'offline').length,
        lastUpdated: new Date().toISOString(),
        results: results,
      };

      return createSuccessResponse(summary, rateLimitHeaders);
    } else {
      // Return cached health summary
      const summary = await getHealthSummary(ctx);

      if (!summary) {
        return createSuccessResponse(
          {
            message: 'No health data available. Run health check first.',
            timestamp: new Date().toISOString(),
          },
          rateLimitHeaders
        );
      }

      return createSuccessResponse(summary, rateLimitHeaders);
    }
  } catch (error) {
    console.error('Health endpoint error:', error);
    return createErrorResponse('Failed to check server health', 500, rateLimitHeaders);
  }
}

async function handleStatsEndpoint(
  ctx: RequestContext,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  try {
    const registry = await getRegistry(ctx);
    return createSuccessResponse(registry.stats, rateLimitHeaders);
  } catch (error) {
    console.error('Stats endpoint error:', error);
    return createErrorResponse('Failed to fetch stats', 500, rateLimitHeaders);
  }
}

async function handleFederatedSchemaEndpoint(
  ctx: RequestContext,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'GET') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  try {
    const { createFederatedSchema } = await import('./schema-federation');

    // Check if we should force a refresh
    const url = new URL(ctx.request.url);
    const forceRefresh = url.searchParams.get('refresh') === 'true';

    if (forceRefresh) {
      // Clear cache and fetch fresh schema
      const { env } = ctx;
      await env.MCP_CACHE.delete('federated_schema');
    }

    const federatedSchema = await createFederatedSchema(ctx);

    return createSuccessResponse(federatedSchema, rateLimitHeaders);
  } catch (error) {
    console.error('Federated schema endpoint error:', error);
    return createErrorResponse('Failed to get federated schema', 500, rateLimitHeaders);
  }
}

async function handleProxyEndpoint(
  ctx: RequestContext,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  try {
    const { proxyRequest } = await import('./proxy');

    // Parse request body
    const requestBody = await ctx.request.json();
    const { serverId, path, method: targetMethod, headers, body } = requestBody;

    // Validate required fields
    if (!serverId || !path || !targetMethod) {
      return createErrorResponse('Missing required fields: serverId, path, method', 400, rateLimitHeaders);
    }

    // Validate method
    const allowedMethods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
    if (!allowedMethods.includes(targetMethod.toUpperCase())) {
      return createErrorResponse(`Method ${targetMethod} not allowed`, 400, rateLimitHeaders);
    }

    // Proxy the request
    const result = await proxyRequest(
      ctx,
      serverId,
      path,
      targetMethod,
      headers || {},
      body
    );

    if (result.success) {
      return new Response(result.body, {
        status: result.status,
        statusText: result.statusText,
        headers: {
          ...rateLimitHeaders,
          'Content-Type': result.headers['content-type'] || 'application/json',
          'X-Proxy-Response-Time': result.responseTime.toString(),
          'X-Proxy-Server-Id': serverId,
        },
      });
    } else {
      return createErrorResponse(result.error || 'Proxy request failed', result.status, rateLimitHeaders);
    }
  } catch (error) {
    console.error('Proxy endpoint error:', error);
    return createErrorResponse('Failed to proxy request', 500, rateLimitHeaders);
  }
}

async function handleSubmitEndpoint(
  ctx: RequestContext,
  method: string,
  rateLimitHeaders: Record<string, string>
): Promise<Response> {
  if (method !== 'POST') {
    return createErrorResponse('Method not allowed', 405, rateLimitHeaders);
  }

  // TODO: Implement server submission
  return createSuccessResponse(
    {
      message: 'Submit endpoint - implementation pending',
      timestamp: new Date().toISOString(),
    },
    rateLimitHeaders
  );
}

function createSuccessResponse<T>(
  data: T,
  additionalHeaders: Record<string, string> = {}
): Response {
  const response: APIResponse<T> = {
    success: true,
    data,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}

function createErrorResponse(
  error: string,
  status: number = 400,
  additionalHeaders: Record<string, string> = {}
): Response {
  const response: APIResponse = {
    success: false,
    error,
    timestamp: new Date().toISOString(),
  };

  return new Response(JSON.stringify(response), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...additionalHeaders,
    },
  });
}
