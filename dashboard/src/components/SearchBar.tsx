/**
 * SearchBar component - Search and filter functionality
 */

import React, { useState, useEffect } from 'react';
import { Search, X, Filter, SortAsc, SortDesc } from 'lucide-react';
import { SearchFilters, SortOption, SortOrder } from '../types';

interface SearchBarProps {
  filters: SearchFilters;
  onFiltersChange: (filters: SearchFilters) => void;
  placeholder?: string;
  className?: string;
}

export function SearchBar({ 
  filters, 
  onFiltersChange, 
  placeholder = "Search servers...",
  className = '' 
}: SearchBarProps) {
  const [query, setQuery] = useState(filters.query || '');
  const [showFilters, setShowFilters] = useState(false);

  // Debounce search query
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onFiltersChange({ ...filters, query: query || undefined });
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  const handleClearSearch = () => {
    setQuery('');
    onFiltersChange({ ...filters, query: undefined });
  };

  const handleSortChange = (sortBy: SortOption) => {
    const newSortOrder: SortOrder = 
      filters.sortBy === sortBy && filters.sortOrder === 'asc' ? 'desc' : 'asc';
    
    onFiltersChange({
      ...filters,
      sortBy,
      sortOrder: newSortOrder,
    });
  };

  const handleVerifiedToggle = () => {
    onFiltersChange({
      ...filters,
      verified: filters.verified === true ? undefined : true,
    });
  };

  const handleHealthStatusToggle = (status: string) => {
    const currentStatuses = filters.healthStatus || [];
    const newStatuses = currentStatuses.includes(status)
      ? currentStatuses.filter(s => s !== status)
      : [...currentStatuses, status];
    
    onFiltersChange({
      ...filters,
      healthStatus: newStatuses.length > 0 ? newStatuses : undefined,
    });
  };

  const clearAllFilters = () => {
    setQuery('');
    onFiltersChange({
      limit: filters.limit,
      offset: 0,
    });
  };

  const hasActiveFilters = !!(
    filters.query ||
    filters.verified ||
    filters.healthStatus?.length ||
    filters.tags?.length
  );

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Main Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="input-field pl-10 pr-20"
        />
        <div className="absolute inset-y-0 right-0 flex items-center gap-2 pr-3">
          {query && (
            <button
              onClick={handleClearSearch}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <X className="h-4 w-4 text-gray-400" />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`p-1 rounded transition-colors ${
              showFilters || hasActiveFilters
                ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400'
            }`}
          >
            <Filter className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Advanced Filters */}
      {showFilters && (
        <div className="glass-card dark:glass-card-dark rounded-lg p-4 space-y-4 animate-slide-up">
          {/* Sort Options */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Sort by
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'name' as SortOption, label: 'Name' },
                { key: 'created' as SortOption, label: 'Created' },
                { key: 'updated' as SortOption, label: 'Updated' },
                { key: 'health' as SortOption, label: 'Health' },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => handleSortChange(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    filters.sortBy === key
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {label}
                  {filters.sortBy === key && (
                    filters.sortOrder === 'asc' ? (
                      <SortAsc className="w-4 h-4" />
                    ) : (
                      <SortDesc className="w-4 h-4" />
                    )
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Verification Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Verification Status
            </label>
            <button
              onClick={handleVerifiedToggle}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filters.verified === true
                  ? 'bg-success-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              Verified Only
            </button>
          </div>

          {/* Health Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Health Status
            </label>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'online', label: 'Online', color: 'success' },
                { key: 'degraded', label: 'Degraded', color: 'warning' },
                { key: 'offline', label: 'Offline', color: 'error' },
                { key: 'unknown', label: 'Unknown', color: 'gray' },
              ].map(({ key, label, color }) => {
                const isActive = filters.healthStatus?.includes(key);
                return (
                  <button
                    key={key}
                    onClick={() => handleHealthStatusToggle(key)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? `bg-${color}-600 text-white`
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={clearAllFilters}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
