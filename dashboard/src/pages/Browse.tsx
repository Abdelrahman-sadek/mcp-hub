/**
 * Browse page - Server browser with grid layout
 */

import React, { useState, useEffect } from 'react';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ServerCard } from '../components/ServerCard';
import { SearchBar } from '../components/SearchBar';
import { HealthSummary } from '../components/HealthStatus';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { MCPServer, SearchFilters, ServersResponse } from '../types';
import { getServers, getServersFromRegistry } from '../utils/api';

export function Browse() {
  const [servers, setServers] = useState<MCPServer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFilters>({
    limit: 20,
    offset: 0,
    sortBy: 'name',
    sortOrder: 'asc',
  });
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);

  // Health checking hook
  const { healthSummary, loading: healthLoading, refreshHealth } = useHealthCheck(5 * 60 * 1000); // Auto-refresh every 5 minutes

  // Load servers
  const loadServers = async (newFilters: SearchFilters = filters, append = false) => {
    try {
      setLoading(true);
      setError(null);

      let response: ServersResponse;
      
      try {
        // Try to fetch from API first
        response = await getServers(newFilters);
      } catch (apiError) {
        console.warn('API unavailable, falling back to registry file:', apiError);
        
        // Fallback to local registry file
        const registryServers = await getServersFromRegistry();
        
        // Apply client-side filtering
        let filteredServers = registryServers;
        
        if (newFilters.query) {
          const query = newFilters.query.toLowerCase();
          filteredServers = filteredServers.filter(server =>
            server.name.toLowerCase().includes(query) ||
            server.description.toLowerCase().includes(query) ||
            server.tags.some(tag => tag.toLowerCase().includes(query))
          );
        }
        
        if (newFilters.verified !== undefined) {
          filteredServers = filteredServers.filter(server => server.verified === newFilters.verified);
        }
        
        if (newFilters.healthStatus?.length) {
          filteredServers = filteredServers.filter(server =>
            newFilters.healthStatus!.includes(server.healthStatus)
          );
        }
        
        // Apply sorting
        if (newFilters.sortBy) {
          filteredServers.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (newFilters.sortBy) {
              case 'name':
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
                break;
              case 'created':
                aValue = new Date(a.createdAt).getTime();
                bValue = new Date(b.createdAt).getTime();
                break;
              case 'updated':
                aValue = new Date(a.updatedAt).getTime();
                bValue = new Date(b.updatedAt).getTime();
                break;
              case 'health':
                const healthOrder = { online: 0, degraded: 1, offline: 2, unknown: 3 };
                aValue = healthOrder[a.healthStatus as keyof typeof healthOrder];
                bValue = healthOrder[b.healthStatus as keyof typeof healthOrder];
                break;
              default:
                aValue = a.name.toLowerCase();
                bValue = b.name.toLowerCase();
            }
            
            if (aValue < bValue) return newFilters.sortOrder === 'asc' ? -1 : 1;
            if (aValue > bValue) return newFilters.sortOrder === 'asc' ? 1 : -1;
            return 0;
          });
        }
        
        // Apply pagination
        const offset = newFilters.offset || 0;
        const limit = newFilters.limit || 20;
        const paginatedServers = filteredServers.slice(offset, offset + limit);
        
        response = {
          servers: paginatedServers,
          pagination: {
            total: filteredServers.length,
            limit,
            offset,
            hasMore: offset + limit < filteredServers.length,
          },
        };
      }

      if (append) {
        setServers(prev => [...prev, ...response.servers]);
      } else {
        setServers(response.servers);
      }
      
      setHasMore(response.pagination.hasMore);
      setTotal(response.pagination.total);
    } catch (err) {
      console.error('Failed to load servers:', err);
      setError(err instanceof Error ? err.message : 'Failed to load servers');
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    loadServers();
  }, []);

  // Handle filter changes
  const handleFiltersChange = (newFilters: SearchFilters) => {
    const updatedFilters = { ...newFilters, offset: 0 };
    setFilters(updatedFilters);
    loadServers(updatedFilters);
  };

  // Load more servers
  const loadMore = () => {
    const newFilters = { ...filters, offset: (filters.offset || 0) + (filters.limit || 20) };
    setFilters(newFilters);
    loadServers(newFilters, true);
  };

  // Refresh servers
  const refresh = () => {
    loadServers(filters);
  };

  if (loading && servers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary-600 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Loading servers...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && servers.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <AlertCircle className="w-8 h-8 text-error-500 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400 mb-4">{error}</p>
              <button onClick={refresh} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Browse MCP Servers
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Discover and connect to Model Context Protocol servers
              </p>
            </div>
            <button
              onClick={refresh}
              disabled={loading}
              className="btn-outline flex items-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {/* Search and Filters */}
          <SearchBar
            filters={filters}
            onFiltersChange={handleFiltersChange}
            placeholder="Search servers by name, description, or tags..."
          />

          {/* Results Summary */}
          <div className="flex items-center justify-between mt-4 text-sm text-gray-600 dark:text-gray-400">
            <span>
              Showing {servers.length} of {total} servers
            </span>
            {error && (
              <span className="text-warning-600 dark:text-warning-400">
                Using cached data
              </span>
            )}
          </div>
        </div>

        {/* Health Summary */}
        {healthSummary && (
          <div className="mb-8">
            <HealthSummary
              totalServers={healthSummary.totalServers}
              onlineServers={healthSummary.onlineServers}
              degradedServers={healthSummary.degradedServers}
              offlineServers={healthSummary.offlineServers}
              lastUpdated={healthSummary.lastUpdated}
              onRefresh={refreshHealth}
              loading={healthLoading}
            />
          </div>
        )}

        {/* Server Grid */}
        {servers.length > 0 ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {servers.map((server) => (
                <ServerCard key={server.id} server={server} />
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="text-center">
                <button
                  onClick={loadMore}
                  disabled={loading}
                  className="btn-primary flex items-center gap-2 mx-auto"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    'Load More'
                  )}
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="glass-card dark:glass-card-dark rounded-xl p-8 max-w-md mx-auto">
              <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No servers found
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Try adjusting your search criteria or filters.
              </p>
              <button
                onClick={() => handleFiltersChange({ limit: 20, offset: 0 })}
                className="btn-primary"
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
