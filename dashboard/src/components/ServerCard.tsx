/**
 * ServerCard component - Individual server display card
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  ExternalLink,
  Shield,
  Clock,
  User,
  Tag,
  Activity,
  Lock,
  Unlock,
  Github
} from 'lucide-react';
import { MCPServer } from '../types';
import { HealthStatus } from './HealthStatus';

interface ServerCardProps {
  server: MCPServer;
  className?: string;
}

export function ServerCard({ server, className = '' }: ServerCardProps) {
  const getHealthStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-success-500';
      case 'offline':
        return 'bg-error-500';
      case 'degraded':
        return 'bg-warning-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getHealthStatusText = (status: string) => {
    switch (status) {
      case 'online':
        return 'Online';
      case 'offline':
        return 'Offline';
      case 'degraded':
        return 'Degraded';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`glass-card dark:glass-card-dark rounded-xl p-6 hover:shadow-2xl transition-all duration-300 hover:scale-[1.02] ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Link 
              to={`/server/${server.id}`}
              className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {server.name}
            </Link>
            {server.verified && (
              <Shield className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            )}
          </div>
          <p className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2">
            {server.description}
          </p>
        </div>
        
        {/* Health Status */}
        <div className="ml-4">
          <HealthStatus
            status={server.healthStatus}
            lastChecked={server.lastChecked}
            size="sm"
          />
        </div>
      </div>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {server.tags.slice(0, 4).map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 text-xs font-medium rounded-full"
          >
            <Tag className="w-3 h-3" />
            {tag}
          </span>
        ))}
        {server.tags.length > 4 && (
          <span className="inline-flex items-center px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs font-medium rounded-full">
            +{server.tags.length - 4} more
          </span>
        )}
      </div>

      {/* Capabilities */}
      {server.capabilities && server.capabilities.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Capabilities
            </span>
          </div>
          <div className="flex flex-wrap gap-1">
            {server.capabilities.slice(0, 3).map((capability) => (
              <span
                key={capability}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded"
              >
                {capability}
              </span>
            ))}
            {server.capabilities.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-xs rounded">
                +{server.capabilities.length - 3}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          {/* Author */}
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{server.author.name}</span>
            {server.author.github && (
              <a
                href={`https://github.com/${server.author.github}`}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-1 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                <Github className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Version */}
          <div className="flex items-center gap-1">
            <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              v{server.version}
            </span>
          </div>

          {/* Authentication */}
          <div className="flex items-center gap-1">
            {server.authentication?.required ? (
              <Lock className="w-4 h-4 text-warning-500" />
            ) : (
              <Unlock className="w-4 h-4 text-success-500" />
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Link
            to={`/server/${server.id}`}
            className="btn-outline text-sm px-3 py-1.5"
          >
            View Details
          </Link>
          <a
            href={server.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1"
          >
            <ExternalLink className="w-4 h-4" />
            Connect
          </a>
        </div>
      </div>

      {/* Last Updated */}
      <div className="flex items-center gap-1 mt-2 text-xs text-gray-400 dark:text-gray-500">
        <Clock className="w-3 h-3" />
        <span>Updated {formatDate(server.updatedAt)}</span>
      </div>
    </div>
  );
}
