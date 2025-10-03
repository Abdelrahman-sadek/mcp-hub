/**
 * AddServer page - Form for submitting new MCP servers
 */

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Plus, AlertCircle, CheckCircle, Info } from 'lucide-react';
import { submitServer } from '../utils/api';
import { validateServer, ValidationError } from '../utils/validation';

interface ServerFormData {
  name: string;
  description: string;
  url: string;
  version: string;
  tags: string;
  authorName: string;
  authorUrl: string;
  authorGithub: string;
  capabilities: string;
  authType: 'none' | 'api-key' | 'oauth';
  authRequired: boolean;
  rateLimitRequests: string;
  rateLimitWindow: string;
}

export function AddServer() {
  const [formData, setFormData] = useState<ServerFormData>({
    name: '',
    description: '',
    url: '',
    version: '1.0.0',
    tags: '',
    authorName: '',
    authorUrl: '',
    authorGithub: '',
    capabilities: '',
    authType: 'none',
    authRequired: false,
    rateLimitRequests: '',
    rateLimitWindow: '',
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Prepare server data
    const serverData = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      url: formData.url.trim(),
      version: formData.version.trim(),
      tags: formData.tags.split(',').map(tag => tag.trim()).filter(Boolean),
      author: {
        name: formData.authorName.trim(),
        url: formData.authorUrl.trim() || undefined,
        github: formData.authorGithub.trim() || undefined,
      },
      capabilities: formData.capabilities.split(',').map(cap => cap.trim()).filter(Boolean),
      authentication: formData.authType !== 'none' ? {
        type: formData.authType,
        required: formData.authRequired,
      } : undefined,
      rateLimit: formData.rateLimitRequests && formData.rateLimitWindow ? {
        requests: parseInt(formData.rateLimitRequests),
        window: formData.rateLimitWindow,
      } : undefined,
    };

    // Validate
    const validationErrors = validateServer(serverData);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    // Submit
    try {
      setIsSubmitting(true);
      setSubmitStatus('idle');
      
      const result = await submitServer(serverData);
      
      if (result.success) {
        setSubmitStatus('success');
        setSubmitMessage(result.message || 'Server submitted successfully! It will be reviewed before being added to the registry.');
        
        // Reset form
        setFormData({
          name: '',
          description: '',
          url: '',
          version: '1.0.0',
          tags: '',
          authorName: '',
          authorUrl: '',
          authorGithub: '',
          capabilities: '',
          authType: 'none',
          authRequired: false,
          rateLimitRequests: '',
          rateLimitWindow: '',
        });
      } else {
        setSubmitStatus('error');
        setSubmitMessage(result.message || 'Failed to submit server. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage(error instanceof Error ? error.message : 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/browse"
            className="inline-flex items-center text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Browse
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Add MCP Server
          </h1>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            Submit your MCP server to be included in the registry
          </p>
        </div>

        {/* Info Banner */}
        <div className="glass-card dark:glass-card-dark rounded-xl p-6 mb-8 border-l-4 border-primary-500">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-primary-600 dark:text-primary-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Submission Guidelines
              </h3>
              <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
                <li>• Your server must implement the Model Context Protocol specification</li>
                <li>• Provide a clear description of your server's capabilities</li>
                <li>• Ensure your server is accessible via HTTPS</li>
                <li>• All submissions are reviewed before being added to the registry</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <div className="glass-card dark:glass-card-dark rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Basic Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Server Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="My Awesome MCP Server"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="version" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Version *
                </label>
                <input
                  type="text"
                  id="version"
                  name="version"
                  value={formData.version}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="1.0.0"
                  required
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="A brief description of what your MCP server does..."
                required
              />
            </div>
            
            <div className="mt-6">
              <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Server URL *
              </label>
              <input
                type="url"
                id="url"
                name="url"
                value={formData.url}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://your-server.com"
                required
              />
            </div>
            
            <div className="mt-6">
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags *
              </label>
              <input
                type="text"
                id="tags"
                name="tags"
                value={formData.tags}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="ai, tools, productivity (comma-separated)"
                required
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Separate tags with commas. Use lowercase letters, numbers, and hyphens only.
              </p>
            </div>
          </div>

          {/* Author Information */}
          <div className="glass-card dark:glass-card-dark rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Author Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="authorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Author Name *
                </label>
                <input
                  type="text"
                  id="authorName"
                  name="authorName"
                  value={formData.authorName}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="Your Name"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="authorGithub" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub Username
                </label>
                <input
                  type="text"
                  id="authorGithub"
                  name="authorGithub"
                  value={formData.authorGithub}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="yourusername"
                />
              </div>
            </div>
            
            <div className="mt-6">
              <label htmlFor="authorUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Author Website
              </label>
              <input
                type="url"
                id="authorUrl"
                name="authorUrl"
                value={formData.authorUrl}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="https://your-website.com"
              />
            </div>
          </div>

          {/* Technical Details */}
          <div className="glass-card dark:glass-card-dark rounded-xl p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Technical Details
            </h2>
            
            <div className="space-y-6">
              <div>
                <label htmlFor="capabilities" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Capabilities
                </label>
                <input
                  type="text"
                  id="capabilities"
                  name="capabilities"
                  value={formData.capabilities}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="tools, resources, prompts (comma-separated)"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="authType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Authentication Type
                  </label>
                  <select
                    id="authType"
                    name="authType"
                    value={formData.authType}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="none">None</option>
                    <option value="api-key">API Key</option>
                    <option value="oauth">OAuth</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="authRequired"
                    name="authRequired"
                    checked={formData.authRequired}
                    onChange={handleInputChange}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="authRequired" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    Authentication Required
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Validation Errors */}
          {errors.length > 0 && (
            <div className="glass-card dark:glass-card-dark rounded-xl p-6 border-l-4 border-error-500">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-error-900 dark:text-error-100 mb-2">
                    Please fix the following errors:
                  </h3>
                  <ul className="text-sm text-error-700 dark:text-error-300 space-y-1">
                    {errors.map((error, index) => (
                      <li key={index}>• {error.message}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Submit Status */}
          {submitStatus !== 'idle' && (
            <div className={`glass-card dark:glass-card-dark rounded-xl p-6 border-l-4 ${
              submitStatus === 'success' ? 'border-success-500' : 'border-error-500'
            }`}>
              <div className="flex items-start gap-3">
                {submitStatus === 'success' ? (
                  <CheckCircle className="w-5 h-5 text-success-600 dark:text-success-400 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-error-600 dark:text-error-400 mt-0.5" />
                )}
                <div>
                  <p className={`text-sm ${
                    submitStatus === 'success' 
                      ? 'text-success-700 dark:text-success-300' 
                      : 'text-error-700 dark:text-error-300'
                  }`}>
                    {submitMessage}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center px-6 py-3 bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Server
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
