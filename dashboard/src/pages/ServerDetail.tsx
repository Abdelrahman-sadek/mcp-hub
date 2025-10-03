/**
 * ServerDetail page - Detailed view of a single MCP server
 */

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  ExternalLink, 
  Shield, 
  Clock, 
  User, 
  Tag,
  Activity,
  Lock,
  Unlock,
  Github,
  Globe,
  Zap,
  Database,
  Code,
  AlertCircle
} from 'lucide-react';
import { MCPServer } from '../types';
import { getServer } from '../utils/api';
import { HealthStatus } from '../components/HealthStatus';
import { useHealthHistory } from '../hooks/useHealthCheck';

export function ServerDetail() {
  const { id } = useParams<{ id: string }>();
  const [server, setServer] = useState<MCPServer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { healthHistory, loadHealthHistory } = useHealthHistory();

  useEffect(() => {
    const fetchServer = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getServer(id);
        setServer(data);
        
        // Load health history
        await loadHealthHistory(id, 7); // Last 7 days
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load server');
      } finally {
        setLoading(false);
      }
    };

    fetchServer();
  }, [id, loadHealthHistory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading server details...</p>
        </div>
      </div>
    );
  }

  if (error || !server) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-error-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Server Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error || 'The requested server could not be found.'}
          </p>
          <Link
            to="/browse"
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Link>
        </div>
      </div>
    );
  }

  const uptime = healthHistory.length > 0 
    ? (healthHistory.filter(h => h.status === 'online').length / healthHistory.length) * 100 
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/browse"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Link>
          
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  {server.name}
                </h1>
                {server.verified && (
                  <div className="flex items-center gap-1 bg-success-100 dark:bg-success-900/30 text-success-700 dark:text-success-300 px-2 py-1 rounded-full text-sm">
                    <Shield className="w-3 h-3" />
                    Verified
                  </div>
                )}
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300">
                {server.description}
              </p>
            </div>
            
            <div className="flex items-center gap-4">
              <HealthStatus 
                status={server.healthStatus}
                lastChecked={server.lastChecked}
                showDetails
                size="lg"
              />
              <a
                href={server.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Visit Server
              </a>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Server Info */}
            <div className="glass-card dark:glass-card-dark rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Server Information
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Version
                  </label>
                  <div className="flex items-center gap-2">
                    <Code className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{server.version}</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Last Updated
                  </label>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">
                      {new Date(server.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Author
                  </label>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="text-gray-900 dark:text-white">{server.author.name}</span>
                    {server.author.github && (
                      <a
                        href={`https://github.com/${server.author.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-600 dark:text-primary-400 hover:text-primary-700"
                      >
                        <Github className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Authentication
                  </label>
                  <div className="flex items-center gap-2">
                    {server.authentication?.required ? (
                      <>
                        <Lock className="w-4 h-4 text-warning-500" />
                        <span className="text-gray-900 dark:text-white">
                          {server.authentication.type}
                        </span>
                      </>
                    ) : (
                      <>
                        <Unlock className="w-4 h-4 text-success-500" />
                        <span className="text-gray-900 dark:text-white">None required</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Capabilities */}
            {server.capabilities && server.capabilities.length > 0 && (
              <div className="glass-card dark:glass-card-dark rounded-xl p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Capabilities
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {server.capabilities.map((capability, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <Zap className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                      <span className="text-gray-900 dark:text-white">{capability}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tags */}
            <div className="glass-card dark:glass-card-dark rounded-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {server.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                  >
                    <Tag className="w-3 h-3" />
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Health Stats */}
            <div className="glass-card dark:glass-card-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Health Statistics
              </h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Uptime (7 days)</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {uptime.toFixed(1)}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-success-500 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${uptime}%` }}
                    />
                  </div>
                </div>
                
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Last Checked</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {new Date(server.lastChecked).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Rate Limits */}
            {server.rateLimit && (
              <div className="glass-card dark:glass-card-dark rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Rate Limits
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Requests</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.rateLimit.requests}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Window</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {server.rateLimit.window}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions */}
            <div className="glass-card dark:glass-card-dark rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <a
                  href={server.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 w-full px-4 py-2 text-left bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/30 transition-colors"
                >
                  <Globe className="w-4 h-4" />
                  Visit Server
                </a>
                
                {server.author.url && (
                  <a
                    href={server.author.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <User className="w-4 h-4" />
                    Author Website
                  </a>
                )}
                
                {server.author.github && (
                  <a
                    href={`https://github.com/${server.author.github}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 w-full px-4 py-2 text-left bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <Github className="w-4 h-4" />
                    GitHub Profile
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
