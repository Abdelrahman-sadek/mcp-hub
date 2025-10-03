/**
 * MCP Hub Cloudflare Worker
 * Main entry point for the MCP Meta-Server
 */

import { handleRequest } from './router';
import { Env, RequestContext } from './types';
import { checkAllServersHealth } from './health';

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // Create request context
    const requestContext: RequestContext = {
      request,
      env,
      ctx,
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      userAgent: request.headers.get('User-Agent') || 'unknown',
    };

    try {
      // Handle the request through the router
      const response = await handleRequest(requestContext);

      // Add CORS headers
      const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key',
        'Access-Control-Max-Age': '86400',
      };

      // Handle preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: corsHeaders,
        });
      }

      // Add CORS headers to response
      Object.entries(corsHeaders).forEach(([key, value]) => {
        response.headers.set(key, value);
      });

      // Add security headers
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'DENY');
      response.headers.set('X-XSS-Protection', '1; mode=block');
      response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

      // Add CSP header
      response.headers.set(
        'Content-Security-Policy',
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https:;"
      );

      return response;
    } catch (error) {
      console.error('Worker error:', error);

      return new Response(
        JSON.stringify({
          success: false,
          error: 'Internal server error',
          message: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  },

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Cron trigger fired: ${event.cron} at ${new Date(event.scheduledTime * 1000).toISOString()}`);

    try {
      // Create request context for scheduled tasks
      const requestContext: RequestContext = {
        request: new Request('https://internal/scheduled'),
        env,
        ctx,
        ip: 'internal',
        userAgent: 'MCP-Hub-Scheduler/1.0',
      };

      // Perform health checks
      const healthResults = await checkAllServersHealth(requestContext);

      console.log(`Health check completed: ${healthResults.length} servers checked`);

      // Log summary
      const summary = {
        online: healthResults.filter(r => r.status === 'online').length,
        degraded: healthResults.filter(r => r.status === 'degraded').length,
        offline: healthResults.filter(r => r.status === 'offline').length,
      };

      console.log(`Health summary: ${summary.online} online, ${summary.degraded} degraded, ${summary.offline} offline`);

      // TODO: Send notifications for critical servers
      const criticalServers = healthResults.filter(r => r.status === 'offline');
      if (criticalServers.length > 0) {
        console.warn(`Critical servers detected: ${criticalServers.map(s => s.serverId).join(', ')}`);
      }

    } catch (error) {
      console.error('Scheduled task error:', error);
    }
  },
};

// Export types for external use
export * from './types';
