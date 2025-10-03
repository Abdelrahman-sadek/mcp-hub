/**
 * Custom hook for health checking functionality
 */

import { useState, useEffect, useCallback } from 'react';
import { checkHealth } from '../utils/api';
import { HealthCheckResult } from '../types';

interface HealthSummary {
  totalServers: number;
  onlineServers: number;
  degradedServers: number;
  offlineServers: number;
  lastUpdated: string;
}

interface UseHealthCheckReturn {
  healthSummary: HealthSummary | null;
  loading: boolean;
  error: string | null;
  refreshHealth: () => Promise<void>;
  lastRefresh: Date | null;
}

export function useHealthCheck(autoRefreshInterval?: number): UseHealthCheckReturn {
  const [healthSummary, setHealthSummary] = useState<HealthSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const refreshHealth = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const healthData = await checkHealth();
      
      // Transform the API response to match our interface
      if (healthData && typeof healthData === 'object') {
        const summary: HealthSummary = {
          totalServers: healthData.totalServers || 0,
          onlineServers: healthData.onlineServers || 0,
          degradedServers: healthData.degradedServers || 0,
          offlineServers: healthData.offlineServers || 0,
          lastUpdated: healthData.lastUpdated || new Date().toISOString(),
        };
        
        setHealthSummary(summary);
        setLastRefresh(new Date());
      }
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err instanceof Error ? err.message : 'Failed to check server health');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refreshHealth();
  }, [refreshHealth]);

  // Auto-refresh if interval is provided
  useEffect(() => {
    if (!autoRefreshInterval) return;

    const interval = setInterval(() => {
      refreshHealth();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [autoRefreshInterval, refreshHealth]);

  return {
    healthSummary,
    loading,
    error,
    refreshHealth,
    lastRefresh,
  };
}

interface UseServerHealthReturn {
  serverHealth: Record<string, HealthCheckResult>;
  loading: boolean;
  error: string | null;
  getServerHealth: (serverId: string) => HealthCheckResult | null;
  refreshServerHealth: (serverId: string) => Promise<void>;
}

export function useServerHealth(): UseServerHealthReturn {
  const [serverHealth, setServerHealth] = useState<Record<string, HealthCheckResult>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getServerHealth = useCallback((serverId: string): HealthCheckResult | null => {
    return serverHealth[serverId] || null;
  }, [serverHealth]);

  const refreshServerHealth = useCallback(async (serverId: string) => {
    try {
      setLoading(true);
      setError(null);

      // This would typically call an API endpoint for individual server health
      // For now, we'll simulate it
      const mockHealthResult: HealthCheckResult = {
        serverId,
        status: 'online', // This would come from the API
        responseTime: Math.random() * 1000,
        timestamp: new Date().toISOString(),
      };

      setServerHealth(prev => ({
        ...prev,
        [serverId]: mockHealthResult,
      }));
    } catch (err) {
      console.error(`Failed to check health for server ${serverId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to check server health');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    serverHealth,
    loading,
    error,
    getServerHealth,
    refreshServerHealth,
  };
}

interface UseHealthHistoryReturn {
  healthHistory: HealthCheckResult[];
  loading: boolean;
  error: string | null;
  loadHealthHistory: (serverId: string, days?: number) => Promise<void>;
}

export function useHealthHistory(): UseHealthHistoryReturn {
  const [healthHistory, setHealthHistory] = useState<HealthCheckResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadHealthHistory = useCallback(async (serverId: string, days: number = 7) => {
    try {
      setLoading(true);
      setError(null);

      // This would typically call an API endpoint for health history
      // For now, we'll generate mock data
      const mockHistory: HealthCheckResult[] = [];
      const now = new Date();
      
      for (let i = 0; i < days * 24; i++) { // Hourly checks for the specified days
        const timestamp = new Date(now.getTime() - (i * 60 * 60 * 1000));
        const statuses: ('online' | 'degraded' | 'offline')[] = ['online', 'degraded', 'offline'];
        const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
        
        // Bias towards online status (80% online, 15% degraded, 5% offline)
        let status: 'online' | 'degraded' | 'offline';
        const rand = Math.random();
        if (rand < 0.8) status = 'online';
        else if (rand < 0.95) status = 'degraded';
        else status = 'offline';

        mockHistory.push({
          serverId,
          status,
          responseTime: status === 'online' ? Math.random() * 2000 : Math.random() * 10000,
          timestamp: timestamp.toISOString(),
        });
      }

      setHealthHistory(mockHistory.reverse()); // Oldest first
    } catch (err) {
      console.error(`Failed to load health history for server ${serverId}:`, err);
      setError(err instanceof Error ? err.message : 'Failed to load health history');
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    healthHistory,
    loading,
    error,
    loadHealthHistory,
  };
}

/**
 * Calculate uptime percentage from health history
 */
export function calculateUptime(healthHistory: HealthCheckResult[]): number {
  if (healthHistory.length === 0) return 0;
  
  const onlineCount = healthHistory.filter(h => h.status === 'online').length;
  return (onlineCount / healthHistory.length) * 100;
}

/**
 * Get health status color class
 */
export function getHealthStatusColor(status: string): string {
  switch (status) {
    case 'online':
      return 'text-success-600 dark:text-success-400';
    case 'degraded':
      return 'text-warning-600 dark:text-warning-400';
    case 'offline':
      return 'text-error-600 dark:text-error-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
}

/**
 * Format response time for display
 */
export function formatResponseTime(time?: number): string {
  if (!time) return 'N/A';
  if (time < 1000) return `${Math.round(time)}ms`;
  return `${(time / 1000).toFixed(1)}s`;
}

/**
 * Format relative time for last checked
 */
export function formatLastChecked(timestamp?: string): string {
  if (!timestamp) return 'Never';
  
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
  
  return date.toLocaleDateString();
}
