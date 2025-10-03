#!/usr/bin/env node

/**
 * Registry validation script for MCP servers
 * Validates the servers.json file against the schema
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const REGISTRY_PATH = path.join(__dirname, '../dashboard/public/servers.json');

/**
 * Validate URL format
 */
function isValidUrl(url) {
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
function isValidSemver(version) {
  const semverRegex = /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;
  return semverRegex.test(version);
}

/**
 * Validate GitHub username format
 */
function isValidGitHubUsername(username) {
  const githubUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;
  return githubUsernameRegex.test(username);
}

/**
 * Validate a single server object
 */
function validateServer(server, index) {
  const errors = [];

  // Required fields
  if (!server.id || typeof server.id !== 'string') {
    errors.push(`Server ${index}: ID is required and must be a string`);
  } else if (!/^[a-z0-9-]+$/.test(server.id)) {
    errors.push(`Server ${index}: ID must contain only lowercase letters, numbers, and hyphens`);
  }

  if (!server.name || typeof server.name !== 'string') {
    errors.push(`Server ${index}: Name is required and must be a string`);
  } else if (server.name.length < 3 || server.name.length > 100) {
    errors.push(`Server ${index}: Name must be between 3 and 100 characters`);
  }

  if (!server.description || typeof server.description !== 'string') {
    errors.push(`Server ${index}: Description is required and must be a string`);
  } else if (server.description.length < 10 || server.description.length > 200) {
    errors.push(`Server ${index}: Description must be between 10 and 200 characters`);
  }

  if (!server.url || typeof server.url !== 'string') {
    errors.push(`Server ${index}: URL is required and must be a string`);
  } else if (!isValidUrl(server.url)) {
    errors.push(`Server ${index}: URL must be a valid HTTPS URL`);
  }

  if (!server.version || typeof server.version !== 'string') {
    errors.push(`Server ${index}: Version is required and must be a string`);
  } else if (!isValidSemver(server.version)) {
    errors.push(`Server ${index}: Version must be a valid semantic version (e.g., 1.0.0)`);
  }

  if (!Array.isArray(server.tags)) {
    errors.push(`Server ${index}: Tags must be an array`);
  } else if (server.tags.length === 0) {
    errors.push(`Server ${index}: At least one tag is required`);
  } else if (server.tags.length > 10) {
    errors.push(`Server ${index}: Maximum 10 tags allowed`);
  } else {
    server.tags.forEach((tag, tagIndex) => {
      if (typeof tag !== 'string') {
        errors.push(`Server ${index}: Tag ${tagIndex} must be a string`);
      } else if (tag.length < 2 || tag.length > 20) {
        errors.push(`Server ${index}: Tag "${tag}" must be between 2 and 20 characters`);
      } else if (!/^[a-z0-9-]+$/.test(tag)) {
        errors.push(`Server ${index}: Tag "${tag}" can only contain lowercase letters, numbers, and hyphens`);
      }
    });
  }

  if (!server.author || typeof server.author !== 'object') {
    errors.push(`Server ${index}: Author is required and must be an object`);
  } else {
    if (!server.author.name || typeof server.author.name !== 'string') {
      errors.push(`Server ${index}: Author name is required and must be a string`);
    } else if (server.author.name.length < 2 || server.author.name.length > 100) {
      errors.push(`Server ${index}: Author name must be between 2 and 100 characters`);
    }

    if (server.author.url && !isValidUrl(server.author.url)) {
      errors.push(`Server ${index}: Author URL must be a valid HTTPS URL`);
    }

    if (server.author.github && !isValidGitHubUsername(server.author.github)) {
      errors.push(`Server ${index}: Author GitHub username is invalid`);
    }
  }

  if (typeof server.verified !== 'boolean') {
    errors.push(`Server ${index}: Verified must be a boolean`);
  }

  if (!['online', 'offline', 'degraded', 'unknown'].includes(server.healthStatus)) {
    errors.push(`Server ${index}: Health status must be one of: online, offline, degraded, unknown`);
  }

  if (!server.lastChecked || typeof server.lastChecked !== 'string') {
    errors.push(`Server ${index}: Last checked is required and must be a string`);
  } else {
    try {
      new Date(server.lastChecked);
    } catch {
      errors.push(`Server ${index}: Last checked must be a valid ISO 8601 timestamp`);
    }
  }

  if (!server.createdAt || typeof server.createdAt !== 'string') {
    errors.push(`Server ${index}: Created at is required and must be a string`);
  } else {
    try {
      new Date(server.createdAt);
    } catch {
      errors.push(`Server ${index}: Created at must be a valid ISO 8601 timestamp`);
    }
  }

  if (!server.updatedAt || typeof server.updatedAt !== 'string') {
    errors.push(`Server ${index}: Updated at is required and must be a string`);
  } else {
    try {
      new Date(server.updatedAt);
    } catch {
      errors.push(`Server ${index}: Updated at must be a valid ISO 8601 timestamp`);
    }
  }

  // Optional fields validation
  if (server.capabilities && !Array.isArray(server.capabilities)) {
    errors.push(`Server ${index}: Capabilities must be an array`);
  }

  if (server.authentication) {
    if (typeof server.authentication !== 'object') {
      errors.push(`Server ${index}: Authentication must be an object`);
    } else {
      if (!['none', 'api-key', 'oauth'].includes(server.authentication.type)) {
        errors.push(`Server ${index}: Authentication type must be one of: none, api-key, oauth`);
      }
      if (typeof server.authentication.required !== 'boolean') {
        errors.push(`Server ${index}: Authentication required must be a boolean`);
      }
    }
  }

  if (server.rateLimit) {
    if (typeof server.rateLimit !== 'object') {
      errors.push(`Server ${index}: Rate limit must be an object`);
    } else {
      if (typeof server.rateLimit.requests !== 'number' || server.rateLimit.requests <= 0) {
        errors.push(`Server ${index}: Rate limit requests must be a positive number`);
      }
      if (typeof server.rateLimit.window !== 'string') {
        errors.push(`Server ${index}: Rate limit window must be a string`);
      }
    }
  }

  return errors;
}

/**
 * Validate the entire registry
 */
function validateRegistry(registry) {
  const errors = [];

  // Validate registry structure
  if (!registry.version || typeof registry.version !== 'string') {
    errors.push('Registry version is required and must be a string');
  }

  if (!registry.lastUpdated || typeof registry.lastUpdated !== 'string') {
    errors.push('Registry lastUpdated is required and must be a string');
  } else {
    try {
      new Date(registry.lastUpdated);
    } catch {
      errors.push('Registry lastUpdated must be a valid ISO 8601 timestamp');
    }
  }

  if (!Array.isArray(registry.servers)) {
    errors.push('Registry servers must be an array');
    return errors; // Can't continue without servers array
  }

  if (!registry.stats || typeof registry.stats !== 'object') {
    errors.push('Registry stats is required and must be an object');
  } else {
    if (typeof registry.stats.totalServers !== 'number') {
      errors.push('Registry stats totalServers must be a number');
    }
    if (typeof registry.stats.onlineServers !== 'number') {
      errors.push('Registry stats onlineServers must be a number');
    }
    if (typeof registry.stats.totalRequests !== 'number') {
      errors.push('Registry stats totalRequests must be a number');
    }
  }

  // Validate servers
  const serverIds = new Set();
  registry.servers.forEach((server, index) => {
    // Check for duplicate IDs
    if (server.id && serverIds.has(server.id)) {
      errors.push(`Duplicate server ID: ${server.id}`);
    } else if (server.id) {
      serverIds.add(server.id);
    }

    // Validate individual server
    const serverErrors = validateServer(server, index);
    errors.push(...serverErrors);
  });

  // Validate stats consistency
  if (registry.stats && registry.servers) {
    if (registry.stats.totalServers !== registry.servers.length) {
      errors.push(`Stats totalServers (${registry.stats.totalServers}) doesn't match actual server count (${registry.servers.length})`);
    }

    const actualOnlineServers = registry.servers.filter(s => s.healthStatus === 'online').length;
    if (registry.stats.onlineServers !== actualOnlineServers) {
      errors.push(`Stats onlineServers (${registry.stats.onlineServers}) doesn't match actual online server count (${actualOnlineServers})`);
    }
  }

  return errors;
}

/**
 * Main validation function
 */
async function main() {
  try {
    console.log('🔍 Validating registry file...');
    
    // Read registry file
    const registryData = await fs.readFile(REGISTRY_PATH, 'utf8');
    let registry;
    
    try {
      registry = JSON.parse(registryData);
    } catch (parseError) {
      console.error('❌ Invalid JSON format:', parseError.message);
      process.exit(1);
    }

    // Validate registry
    const errors = validateRegistry(registry);

    if (errors.length === 0) {
      console.log('✅ Registry validation passed!');
      console.log(`📊 Registry contains ${registry.servers.length} servers`);
      
      // Print summary
      const summary = {
        total: registry.servers.length,
        online: registry.servers.filter(s => s.healthStatus === 'online').length,
        degraded: registry.servers.filter(s => s.healthStatus === 'degraded').length,
        offline: registry.servers.filter(s => s.healthStatus === 'offline').length,
        verified: registry.servers.filter(s => s.verified).length,
      };
      
      console.log(`   - Online: ${summary.online}`);
      console.log(`   - Degraded: ${summary.degraded}`);
      console.log(`   - Offline: ${summary.offline}`);
      console.log(`   - Verified: ${summary.verified}`);
    } else {
      console.error('❌ Registry validation failed:');
      errors.forEach(error => console.error(`   - ${error}`));
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Validation failed:', error.message);
    process.exit(1);
  }
}

// Run validation
main();
