/**
 * Home page - Landing page with hero section and overview
 */

import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Search, Zap, Shield, Globe, Activity, Server, Users } from 'lucide-react';
import { useHealthCheck } from '../hooks/useHealthCheck';
import { getStats } from '../utils/api';

interface Stats {
  totalServers: number;
  onlineServers: number;
  totalRequests: number;
}

export function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const { healthSummary } = useHealthCheck();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await getStats();
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch stats:', error);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-secondary-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600/10 to-secondary-600/10 dark:from-primary-400/5 dark:to-secondary-400/5" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Activity className="w-4 h-4" />
              {healthSummary ? `${healthSummary.onlineServers}/${healthSummary.totalServers} servers online` : 'Loading status...'}
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              <span className="bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                MCP Hub
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              The central registry and gateway for Model Context Protocol servers.
              Discover, connect, and manage MCP servers with ease.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/browse"
                className="inline-flex items-center px-8 py-4 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-xl"
              >
                Browse Servers
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <Link
                to="/docs"
                className="inline-flex items-center px-8 py-4 glass-card dark:glass-card-dark text-gray-700 dark:text-gray-300 font-semibold rounded-lg hover:bg-white/80 dark:hover:bg-gray-800/80 transition-all duration-200"
              >
                Documentation
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Why Choose MCP Hub?
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
              A comprehensive platform for discovering and managing MCP servers
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center hover:scale-105 transition-transform duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl mb-6 shadow-lg">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Discover Servers
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Browse a curated registry of MCP servers with detailed information,
                capabilities, and real-time health status.
              </p>
            </div>

            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center hover:scale-105 transition-transform duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-secondary-500 to-secondary-600 rounded-xl mb-6 shadow-lg">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Proxy Requests
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Seamlessly proxy requests to MCP servers with built-in authentication,
                rate limiting, and error handling.
              </p>
            </div>

            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center hover:scale-105 transition-transform duration-200">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-success-500 to-success-600 rounded-xl mb-6 shadow-lg">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Health Monitoring
              </h3>
              <p className="text-gray-600 dark:text-gray-300">
                Continuous health monitoring with automated checks and real-time
                status updates for all registered servers.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="py-24 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Growing Ecosystem
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join the expanding MCP community
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-lg mb-4">
                <Server className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              </div>
              <div className="text-4xl font-bold text-primary-600 dark:text-primary-400 mb-2">
                {stats?.totalServers || healthSummary?.totalServers || '5+'}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Registered Servers
              </div>
            </div>

            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-success-100 dark:bg-success-900/30 rounded-lg mb-4">
                <Activity className="w-6 h-6 text-success-600 dark:text-success-400" />
              </div>
              <div className="text-4xl font-bold text-success-600 dark:text-success-400 mb-2">
                {healthSummary ? `${Math.round((healthSummary.onlineServers / healthSummary.totalServers) * 100)}%` : '100%'}
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Uptime Rate
              </div>
            </div>

            <div className="glass-card dark:glass-card-dark rounded-xl p-8 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-secondary-100 dark:bg-secondary-900/30 rounded-lg mb-4">
                <Globe className="w-6 h-6 text-secondary-600 dark:text-secondary-400" />
              </div>
              <div className="text-4xl font-bold text-secondary-600 dark:text-secondary-400 mb-2">
                24/7
              </div>
              <div className="text-gray-600 dark:text-gray-300">
                Health Monitoring
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-primary-600 to-secondary-600 dark:from-primary-700 dark:to-secondary-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-primary-100 mb-8 max-w-2xl mx-auto">
            Explore the MCP ecosystem and discover powerful servers for your applications
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="inline-flex items-center px-8 py-4 bg-white text-primary-600 font-semibold rounded-lg hover:bg-gray-100 transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              Browse Servers
              <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
            <Link
              to="/add"
              className="inline-flex items-center px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-lg transition-all duration-200 border border-white/20 backdrop-blur-sm"
            >
              Add Your Server
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
