/**
 * Schema federation system for MCP servers
 * Fetches, merges, and manages schemas from multiple MCP servers
 */

import { RequestContext, MCPServer } from './types';
import { getRegistry } from './registry';
import { setCachedData, getCachedData } from './cache';

const SCHEMA_FETCH_TIMEOUT = 15000; // 15 seconds
const SCHEMA_CACHE_TTL = 3600; // 1 hour
const MAX_SCHEMA_SIZE = 1024 * 1024; // 1MB per schema

export interface MCPSchema {
  serverId: string;
  serverName: string;
  version: string;
  namespace?: string;
  tools?: ToolDefinition[];
  resources?: ResourceDefinition[];
  prompts?: PromptDefinition[];
  capabilities?: string[];
  lastFetched: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema?: any;
  outputSchema?: any;
  namespace?: string;
}

export interface ResourceDefinition {
  name: string;
  description: string;
  uri: string;
  mimeType?: string;
  namespace?: string;
}

export interface PromptDefinition {
  name: string;
  description: string;
  arguments?: any[];
  namespace?: string;
}

export interface FederatedSchema {
  version: string;
  servers: string[];
  tools: ToolDefinition[];
  resources: ResourceDefinition[];
  prompts: PromptDefinition[];
  capabilities: string[];
  namespaces: string[];
  conflicts: SchemaConflict[];
  lastUpdated: string;
}

export interface SchemaConflict {
  type: 'tool' | 'resource' | 'prompt';
  name: string;
  servers: string[];
  resolution: 'namespace' | 'rename' | 'merge';
}

/**
 * Fetch schema from a single MCP server
 */
export async function fetchServerSchema(
  ctx: RequestContext,
  server: MCPServer
): Promise<MCPSchema | null> {
  try {
    // Check cache first
    const cacheKey = `schema:${server.id}`;
    const cached = await getCachedData<MCPSchema>(ctx, cacheKey);
    
    if (cached && isSchemaFresh(cached)) {
      return cached;
    }

    console.log(`Fetching schema for server: ${server.name}`);

    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), SCHEMA_FETCH_TIMEOUT);

    try {
      // Attempt to fetch schema from server
      const schemaUrl = new URL('/schema', server.url);
      const response = await fetch(schemaUrl.toString(), {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'MCP-Hub-Schema-Fetcher/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn(`Failed to fetch schema for ${server.name}: ${response.status}`);
        return null;
      }

      const schemaText = await response.text();
      
      // Check schema size
      if (schemaText.length > MAX_SCHEMA_SIZE) {
        console.warn(`Schema too large for ${server.name}: ${schemaText.length} bytes`);
        return null;
      }

      const schemaData = JSON.parse(schemaText);
      
      // Validate and normalize schema
      const schema: MCPSchema = {
        serverId: server.id,
        serverName: server.name,
        version: schemaData.version || '1.0.0',
        namespace: schemaData.namespace || server.id,
        tools: normalizeTools(schemaData.tools || [], server.id),
        resources: normalizeResources(schemaData.resources || [], server.id),
        prompts: normalizePrompts(schemaData.prompts || [], server.id),
        capabilities: schemaData.capabilities || [],
        lastFetched: new Date().toISOString(),
      };

      // Cache the schema
      await setCachedData(ctx, cacheKey, schema, SCHEMA_CACHE_TTL);

      return schema;
    } catch (fetchError) {
      clearTimeout(timeoutId);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        console.warn(`Schema fetch timeout for ${server.name}`);
      } else {
        console.warn(`Schema fetch error for ${server.name}:`, fetchError);
      }
      
      return null;
    }
  } catch (error) {
    console.error(`Failed to fetch schema for ${server.id}:`, error);
    return null;
  }
}

/**
 * Fetch schemas from all servers and create federated schema
 */
export async function createFederatedSchema(ctx: RequestContext): Promise<FederatedSchema> {
  try {
    // Check cache first
    const cacheKey = 'federated_schema';
    const cached = await getCachedData<FederatedSchema>(ctx, cacheKey);
    
    if (cached && isFederatedSchemaFresh(cached)) {
      return cached;
    }

    console.log('Creating federated schema...');

    // Get all servers
    const registry = await getRegistry(ctx);
    const onlineServers = registry.servers.filter(s => s.healthStatus === 'online');

    // Fetch schemas from all online servers
    const schemaPromises = onlineServers.map(server => 
      fetchServerSchema(ctx, server).catch(error => {
        console.error(`Failed to fetch schema for ${server.id}:`, error);
        return null;
      })
    );

    const schemas = (await Promise.all(schemaPromises)).filter(Boolean) as MCPSchema[];

    // Create federated schema
    const federatedSchema = mergeSchemas(schemas);

    // Cache the federated schema
    await setCachedData(ctx, cacheKey, federatedSchema, SCHEMA_CACHE_TTL);

    console.log(`Federated schema created with ${schemas.length} server schemas`);
    return federatedSchema;
  } catch (error) {
    console.error('Failed to create federated schema:', error);
    
    // Return empty federated schema as fallback
    return {
      version: '1.0.0',
      servers: [],
      tools: [],
      resources: [],
      prompts: [],
      capabilities: [],
      namespaces: [],
      conflicts: [],
      lastUpdated: new Date().toISOString(),
    };
  }
}

/**
 * Merge multiple schemas into a federated schema
 */
function mergeSchemas(schemas: MCPSchema[]): FederatedSchema {
  const allTools: ToolDefinition[] = [];
  const allResources: ResourceDefinition[] = [];
  const allPrompts: PromptDefinition[] = [];
  const allCapabilities = new Set<string>();
  const allNamespaces = new Set<string>();
  const conflicts: SchemaConflict[] = [];

  // Collect all items from schemas
  for (const schema of schemas) {
    allTools.push(...(schema.tools || []));
    allResources.push(...(schema.resources || []));
    allPrompts.push(...(schema.prompts || []));
    
    schema.capabilities?.forEach(cap => allCapabilities.add(cap));
    if (schema.namespace) {
      allNamespaces.add(schema.namespace);
    }
  }

  // Detect and resolve conflicts
  const { tools: resolvedTools, conflicts: toolConflicts } = resolveToolConflicts(allTools);
  const { resources: resolvedResources, conflicts: resourceConflicts } = resolveResourceConflicts(allResources);
  const { prompts: resolvedPrompts, conflicts: promptConflicts } = resolvePromptConflicts(allPrompts);

  conflicts.push(...toolConflicts, ...resourceConflicts, ...promptConflicts);

  return {
    version: '1.0.0',
    servers: schemas.map(s => s.serverId),
    tools: resolvedTools,
    resources: resolvedResources,
    prompts: resolvedPrompts,
    capabilities: Array.from(allCapabilities),
    namespaces: Array.from(allNamespaces),
    conflicts,
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Resolve tool name conflicts
 */
function resolveToolConflicts(tools: ToolDefinition[]): {
  tools: ToolDefinition[];
  conflicts: SchemaConflict[];
} {
  const toolMap = new Map<string, ToolDefinition[]>();
  const conflicts: SchemaConflict[] = [];

  // Group tools by name
  for (const tool of tools) {
    const key = tool.name;
    if (!toolMap.has(key)) {
      toolMap.set(key, []);
    }
    toolMap.get(key)!.push(tool);
  }

  const resolvedTools: ToolDefinition[] = [];

  // Resolve conflicts
  for (const [name, toolList] of toolMap.entries()) {
    if (toolList.length === 1) {
      resolvedTools.push(toolList[0]);
    } else {
      // Conflict detected - resolve by namespacing
      const servers = toolList.map(t => t.namespace || 'unknown');
      conflicts.push({
        type: 'tool',
        name,
        servers,
        resolution: 'namespace',
      });

      // Add namespaced versions
      for (const tool of toolList) {
        resolvedTools.push({
          ...tool,
          name: `${tool.namespace || 'unknown'}:${tool.name}`,
        });
      }
    }
  }

  return { tools: resolvedTools, conflicts };
}

/**
 * Resolve resource name conflicts
 */
function resolveResourceConflicts(resources: ResourceDefinition[]): {
  resources: ResourceDefinition[];
  conflicts: SchemaConflict[];
} {
  const resourceMap = new Map<string, ResourceDefinition[]>();
  const conflicts: SchemaConflict[] = [];

  // Group resources by name
  for (const resource of resources) {
    const key = resource.name;
    if (!resourceMap.has(key)) {
      resourceMap.set(key, []);
    }
    resourceMap.get(key)!.push(resource);
  }

  const resolvedResources: ResourceDefinition[] = [];

  // Resolve conflicts
  for (const [name, resourceList] of resourceMap.entries()) {
    if (resourceList.length === 1) {
      resolvedResources.push(resourceList[0]);
    } else {
      // Conflict detected - resolve by namespacing
      const servers = resourceList.map(r => r.namespace || 'unknown');
      conflicts.push({
        type: 'resource',
        name,
        servers,
        resolution: 'namespace',
      });

      // Add namespaced versions
      for (const resource of resourceList) {
        resolvedResources.push({
          ...resource,
          name: `${resource.namespace || 'unknown'}:${resource.name}`,
        });
      }
    }
  }

  return { resources: resolvedResources, conflicts };
}

/**
 * Resolve prompt name conflicts
 */
function resolvePromptConflicts(prompts: PromptDefinition[]): {
  prompts: PromptDefinition[];
  conflicts: SchemaConflict[];
} {
  const promptMap = new Map<string, PromptDefinition[]>();
  const conflicts: SchemaConflict[] = [];

  // Group prompts by name
  for (const prompt of prompts) {
    const key = prompt.name;
    if (!promptMap.has(key)) {
      promptMap.set(key, []);
    }
    promptMap.get(key)!.push(prompt);
  }

  const resolvedPrompts: PromptDefinition[] = [];

  // Resolve conflicts
  for (const [name, promptList] of promptMap.entries()) {
    if (promptList.length === 1) {
      resolvedPrompts.push(promptList[0]);
    } else {
      // Conflict detected - resolve by namespacing
      const servers = promptList.map(p => p.namespace || 'unknown');
      conflicts.push({
        type: 'prompt',
        name,
        servers,
        resolution: 'namespace',
      });

      // Add namespaced versions
      for (const prompt of promptList) {
        resolvedPrompts.push({
          ...prompt,
          name: `${prompt.namespace || 'unknown'}:${prompt.name}`,
        });
      }
    }
  }

  return { prompts: resolvedPrompts, conflicts };
}

/**
 * Normalize tool definitions
 */
function normalizeTools(tools: any[], namespace: string): ToolDefinition[] {
  return tools.map(tool => ({
    name: tool.name || 'unnamed',
    description: tool.description || '',
    inputSchema: tool.inputSchema,
    outputSchema: tool.outputSchema,
    namespace,
  }));
}

/**
 * Normalize resource definitions
 */
function normalizeResources(resources: any[], namespace: string): ResourceDefinition[] {
  return resources.map(resource => ({
    name: resource.name || 'unnamed',
    description: resource.description || '',
    uri: resource.uri || '',
    mimeType: resource.mimeType,
    namespace,
  }));
}

/**
 * Normalize prompt definitions
 */
function normalizePrompts(prompts: any[], namespace: string): PromptDefinition[] {
  return prompts.map(prompt => ({
    name: prompt.name || 'unnamed',
    description: prompt.description || '',
    arguments: prompt.arguments || [],
    namespace,
  }));
}

/**
 * Check if schema is fresh (less than 1 hour old)
 */
function isSchemaFresh(schema: MCPSchema): boolean {
  const lastFetched = new Date(schema.lastFetched);
  const now = new Date();
  const ageInMs = now.getTime() - lastFetched.getTime();
  return ageInMs < SCHEMA_CACHE_TTL * 1000;
}

/**
 * Check if federated schema is fresh (less than 1 hour old)
 */
function isFederatedSchemaFresh(schema: FederatedSchema): boolean {
  const lastUpdated = new Date(schema.lastUpdated);
  const now = new Date();
  const ageInMs = now.getTime() - lastUpdated.getTime();
  return ageInMs < SCHEMA_CACHE_TTL * 1000;
}
