/**
 * HealthStatus component - Real-time health indicator
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { HealthStatus as HealthStatusType } from '../types';

interface HealthStatusProps {
  status: HealthStatusType;
  lastChecked?: string;
  responseTime?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface HealthSummaryProps {
  totalServers: number;
  onlineServers: number;
  degradedServers: number;
  offlineServers: number;
  lastUpdated: string;
  onRefresh?: () => void;
  loading?: boolean;
  className?: string;
}

export function HealthStatus({ 
  status, 
  lastChecked, 
  responseTime,
  showDetails = false,
  size = 'md',
  className = '' 
}: HealthStatusProps) {
  const getStatusConfig = (status: HealthStatusType) => {
    switch (status) {
      case 'online':
        return {
          icon: CheckCircle,
          label: 'Online',
          color: 'text-success-600 dark:text-success-400',
          bgColor: 'bg-success-100 dark:bg-success-900/30',
          dotColor: 'bg-success-500',
        };
      case 'degraded':
        return {
          icon: AlertCircle,
          label: 'Degraded',
          color: 'text-warning-600 dark:text-warning-400',
          bgColor: 'bg-warning-100 dark:bg-warning-900/30',
          dotColor: 'bg-warning-500',
        };
      case 'offline':
        return {
          icon: AlertCircle,
          label: 'Offline',
          color: 'text-error-600 dark:text-error-400',
          bgColor: 'bg-error-100 dark:bg-error-900/30',
          dotColor: 'bg-error-500',
        };
      default:
        return {
          icon: Minus,
          label: 'Unknown',
          color: 'text-gray-600 dark:text-gray-400',
          bgColor: 'bg-gray-100 dark:bg-gray-800',
          dotColor: 'bg-gray-500',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-3 py-1.5',
    lg: 'text-base px-4 py-2',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const formatResponseTime = (time?: number) => {
    if (!time) return '';
    if (time < 1000) return `${time}ms`;
    return `${(time / 1000).toFixed(1)}s`;
  };

  const formatLastChecked = (timestamp?: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className={`inline-flex items-center gap-2 rounded-full ${config.bgColor} ${sizeClasses[size]} ${className}`}>
      {/* Status indicator dot */}
      <div className={`w-2 h-2 rounded-full ${config.dotColor} animate-pulse`} />
      
      {/* Status icon and label */}
      <Icon className={`${iconSizes[size]} ${config.color}`} />
      <span className={`font-medium ${config.color}`}>
        {config.label}
      </span>

      {/* Additional details */}
      {showDetails && (
        <>
          {responseTime && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {formatResponseTime(responseTime)}
            </span>
          )}
          {lastChecked && (
            <span className="text-gray-500 dark:text-gray-400 text-xs">
              {formatLastChecked(lastChecked)}
            </span>
          )}
        </>
      )}
    </div>
  );
}

export function HealthSummary({
  totalServers,
  onlineServers,
  degradedServers,
  offlineServers,
  lastUpdated,
  onRefresh,
  loading = false,
  className = ''
}: HealthSummaryProps) {
  const [autoRefresh, setAutoRefresh] = useState(false);

  // Auto-refresh every 5 minutes if enabled
  useEffect(() => {
    if (!autoRefresh || !onRefresh) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(interval);
  }, [autoRefresh, onRefresh]);

  const healthPercentage = totalServers > 0 ? (onlineServers / totalServers) * 100 : 0;
  const isHealthy = healthPercentage >= 80;
  const isDegraded = healthPercentage >= 60;

  const getHealthTrend = () => {
    if (isHealthy) return { icon: TrendingUp, color: 'text-success-500', label: 'Healthy' };
    if (isDegraded) return { icon: Minus, color: 'text-warning-500', label: 'Degraded' };
    return { icon: TrendingDown, color: 'text-error-500', label: 'Critical' };
  };

  const trend = getHealthTrend();
  const TrendIcon = trend.icon;

  return (
    <div className={`glass-card dark:glass-card-dark rounded-xl p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary-600 dark:text-primary-400" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Server Health
          </h3>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`text-xs px-2 py-1 rounded transition-colors ${
              autoRefresh
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
            }`}
          >
            Auto-refresh
          </button>
          
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-400 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* Health Overview */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex items-center gap-2">
          <TrendIcon className={`w-5 h-5 ${trend.color}`} />
          <span className={`font-medium ${trend.color}`}>
            {trend.label}
          </span>
        </div>
        
        <div className="text-2xl font-bold text-gray-900 dark:text-white">
          {healthPercentage.toFixed(1)}%
        </div>
        
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {onlineServers} of {totalServers} online
        </div>
      </div>

      {/* Health Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Server Status</span>
          <span>{onlineServers}/{totalServers}</span>
        </div>
        
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
          <div className="h-full flex">
            {/* Online servers */}
            <div 
              className="bg-success-500 transition-all duration-500"
              style={{ width: `${(onlineServers / totalServers) * 100}%` }}
            />
            {/* Degraded servers */}
            <div 
              className="bg-warning-500 transition-all duration-500"
              style={{ width: `${(degradedServers / totalServers) * 100}%` }}
            />
            {/* Offline servers */}
            <div 
              className="bg-error-500 transition-all duration-500"
              style={{ width: `${(offlineServers / totalServers) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600 dark:text-success-400">
            {onlineServers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Online</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-warning-600 dark:text-warning-400">
            {degradedServers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Degraded</div>
        </div>
        
        <div className="text-center">
          <div className="text-2xl font-bold text-error-600 dark:text-error-400">
            {offlineServers}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Offline</div>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 pt-4 border-t border-gray-200 dark:border-gray-700">
        <Clock className="w-3 h-3" />
        <span>
          Last updated: {new Date(lastUpdated).toLocaleString()}
        </span>
      </div>
    </div>
  );
}
