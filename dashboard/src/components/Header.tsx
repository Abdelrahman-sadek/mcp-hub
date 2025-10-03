/**
 * Header component with navigation and theme toggle
 */

import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Home, Search, Plus, Book, Activity } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { useHealthCheck } from '../hooks/useHealthCheck';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const location = useLocation();
  const { healthSummary } = useHealthCheck();

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Browse', href: '/browse', icon: Search },
    { name: 'Add Server', href: '/add', icon: Plus },
    { name: 'Docs', href: '/docs', icon: Book },
  ];

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900 dark:text-white">
                MCP Hub
              </span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`
                    flex items-center space-x-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                      : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Health Status */}
            {healthSummary && (
              <div className="hidden sm:flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-300">
                <div className={`w-2 h-2 rounded-full ${
                  healthSummary.onlineServers === healthSummary.totalServers 
                    ? 'bg-success-500' 
                    : healthSummary.onlineServers > 0 
                    ? 'bg-warning-500' 
                    : 'bg-error-500'
                }`} />
                <span>
                  {healthSummary.onlineServers}/{healthSummary.totalServers} online
                </span>
              </div>
            )}

            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Toggle menu"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`
                      flex items-center space-x-2 px-3 py-2 rounded-lg text-base font-medium transition-colors
                      ${isActive(item.href)
                        ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300'
                        : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              {/* Mobile Health Status */}
              {healthSummary && (
                <div className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-600 dark:text-gray-300">
                  <Activity className="w-4 h-4" />
                  <span>
                    {healthSummary.onlineServers}/{healthSummary.totalServers} servers online
                  </span>
                  <div className={`w-2 h-2 rounded-full ${
                    healthSummary.onlineServers === healthSummary.totalServers 
                      ? 'bg-success-500' 
                      : healthSummary.onlineServers > 0 
                      ? 'bg-warning-500' 
                      : 'bg-error-500'
                  }`} />
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
