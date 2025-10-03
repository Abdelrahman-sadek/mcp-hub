#!/usr/bin/env node

/**
 * Health check script for MCP servers
 * Checks all servers in the registry and updates their health status
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.join(__dirname, '../dashboard/public/servers.json');
const HEALTH_CHECK_TIMEOUT = 30000; // 30 seconds
const MAX_CONCURRENT_CHECKS = 10;

/**
 * Check health of a single server
 */
async function checkServerHealth(server) {
  const startTime = Date.now();
  
  try {
    console.log(`Checking health of ${server.name} (${server.url})`);
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT);

    // Attempt to connect to the server
    const response = await fetch(server.url, {
      method: 'HEAD',
      signal: controller.signal,
      headers: {
        'User-Agent': 'MCP-Hub-Health-Checker/1.0',
        'Accept': 'application/json',
      },
    });

    clearTimeout(timeoutId);
    const responseTime = Date.now() - startTime;

    // Determine health status
    let status;
    if (response.ok) {
      status = responseTime > 10000 ? 'degraded' : 'online';
    } else if (response.status >= 500) {
      status = 'degraded';
    } else {
      status = 'offline';
    }

    console.log(`✓ ${server.name}: ${status} (${responseTime}ms)`);

    return {
      serverId: server.id,
      status,
      responseTime,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    let status = 'offline';
    let errorMessage = error.message;

    if (error.name === 'AbortError' || errorMessage.includes('timeout')) {
      status = 'degraded';
      errorMessage = 'Request timeout';
    }

    console.log(`✗ ${server.name}: ${status} (${errorMessage})`);

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
 * Check health of all servers
 */
async function checkAllServers(servers) {
  console.log(`Starting health check for ${servers.length} servers...`);
  
  const results = [];
  
  // Process servers in batches
  for (let i = 0; i < servers.length; i += MAX_CONCURRENT_CHECKS) {
    const batch = servers.slice(i, i + MAX_CONCURRENT_CHECKS);
    
    const batchPromises = batch.map(server => 
      checkServerHealth(server).catch(error => {
        console.error(`Health check failed for ${server.id}:`, error);
        return {
          serverId: server.id,
          status: 'offline',
          error: error.message,
          timestamp: new Date().toISOString(),
        };
      })
    );

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  return results;
}

/**
 * Update registry with health check results
 */
async function updateRegistry(registry, healthResults) {
  let changesDetected = false;
  
  // Update server health status
  for (const result of healthResults) {
    const server = registry.servers.find(s => s.id === result.serverId);
    if (server) {
      const oldStatus = server.healthStatus;
      server.healthStatus = result.status;
      server.lastChecked = result.timestamp;
      
      if (oldStatus !== result.status) {
        changesDetected = true;
        console.log(`Status changed for ${server.name}: ${oldStatus} → ${result.status}`);
      }
    }
  }

  // Update registry metadata
  registry.lastUpdated = new Date().toISOString();
  
  // Update stats
  registry.stats.totalServers = registry.servers.length;
  registry.stats.onlineServers = registry.servers.filter(s => s.healthStatus === 'online').length;
  
  return { registry, changesDetected };
}

/**
 * Main health check function
 */
async function main() {
  try {
    // Read registry file
    console.log('Reading registry file...');
    const registryData = await fs.readFile(REGISTRY_PATH, 'utf8');
    const registry = JSON.parse(registryData);

    // Perform health checks
    const healthResults = await checkAllServers(registry.servers);

    // Update registry
    const { registry: updatedRegistry, changesDetected } = await updateRegistry(registry, healthResults);

    // Write updated registry
    if (changesDetected) {
      console.log('Writing updated registry...');
      await fs.writeFile(REGISTRY_PATH, JSON.stringify(updatedRegistry, null, 2));
      console.log('Registry updated successfully!');
    } else {
      console.log('No changes detected in server health status.');
    }

    // Generate summary
    const summary = {
      total: healthResults.length,
      online: healthResults.filter(r => r.status === 'online').length,
      degraded: healthResults.filter(r => r.status === 'degraded').length,
      offline: healthResults.filter(r => r.status === 'offline').length,
    };

    console.log('\n📊 Health Check Summary:');
    console.log(`Total servers: ${summary.total}`);
    console.log(`Online: ${summary.online}`);
    console.log(`Degraded: ${summary.degraded}`);
    console.log(`Offline: ${summary.offline}`);

    // Set GitHub Actions outputs
    if (process.env.GITHUB_ACTIONS) {
      const criticalServers = healthResults
        .filter(r => r.status === 'offline')
        .map(r => registry.servers.find(s => s.id === r.serverId)?.name)
        .filter(Boolean)
        .join(', ');

      console.log(`::set-output name=changes_detected::${changesDetected}`);
      console.log(`::set-output name=total_servers::${summary.total}`);
      console.log(`::set-output name=online_servers::${summary.online}`);
      console.log(`::set-output name=degraded_servers::${summary.degraded}`);
      console.log(`::set-output name=offline_servers::${summary.offline}`);
      console.log(`::set-output name=critical_servers::${criticalServers}`);
    }

    // Exit with error code if there are critical issues
    if (summary.offline > 0) {
      console.warn(`⚠️  ${summary.offline} servers are offline!`);
      process.exit(1);
    }

    console.log('\n✅ Health check completed successfully!');
  } catch (error) {
    console.error('❌ Health check failed:', error);
    process.exit(1);
  }
}

// Run the health check
main();
