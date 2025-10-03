/**
 * Docs page - Documentation and API reference
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Book, 
  Code, 
  Server, 
  Zap, 
  Shield, 
  Activity,
  ExternalLink,
  Copy,
  CheckCircle
} from 'lucide-react';

export function Docs() {
  const [copiedCode, setCopiedCode] = React.useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const CodeBlock = ({ children, language, id }: { children: string; language: string; id: string }) => (
    <div className="relative">
      <div className="flex items-center justify-between bg-gray-800 px-4 py-2 rounded-t-lg">
        <span className="text-sm text-gray-300">{language}</span>
        <button
          onClick={() => copyToClipboard(children, id)}
          className="flex items-center gap-1 text-sm text-gray-300 hover:text-white transition-colors"
        >
          {copiedCode === id ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy
            </>
          )}
        </button>
      </div>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded-b-lg overflow-x-auto">
        <code>{children}</code>
      </pre>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            MCP Hub Documentation
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Learn how to use MCP Hub to discover, connect, and manage Model Context Protocol servers
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Link
            to="/browse"
            className="glass-card dark:glass-card-dark rounded-xl p-6 text-center hover:scale-105 transition-transform duration-200"
          >
            <Server className="w-8 h-8 text-primary-600 dark:text-primary-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Browse Servers</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Explore available MCP servers
            </p>
          </Link>

          <Link
            to="/add"
            className="glass-card dark:glass-card-dark rounded-xl p-6 text-center hover:scale-105 transition-transform duration-200"
          >
            <Zap className="w-8 h-8 text-secondary-600 dark:text-secondary-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Add Server</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Submit your MCP server
            </p>
          </Link>

          <a
            href="https://github.com/YOUR_USERNAME/mcp-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="glass-card dark:glass-card-dark rounded-xl p-6 text-center hover:scale-105 transition-transform duration-200"
          >
            <Code className="w-8 h-8 text-success-600 dark:text-success-400 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">GitHub</h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              View source code
            </p>
          </a>
        </div>

        {/* Table of Contents */}
        <div className="glass-card dark:glass-card-dark rounded-xl p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Table of Contents
          </h2>
          <nav className="space-y-2">
            <a href="#getting-started" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              1. Getting Started
            </a>
            <a href="#api-reference" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              2. API Reference
            </a>
            <a href="#proxy-usage" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              3. Proxy Usage
            </a>
            <a href="#health-monitoring" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              4. Health Monitoring
            </a>
            <a href="#schema-federation" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              5. Schema Federation
            </a>
            <a href="#contributing" className="block text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300">
              6. Contributing
            </a>
          </nav>
        </div>

        {/* Getting Started */}
        <section id="getting-started" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Book className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Getting Started
            </h2>
            
            <div className="prose prose-gray dark:prose-invert max-w-none">
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                MCP Hub is a central registry and gateway for Model Context Protocol (MCP) servers. 
                It provides discovery, health monitoring, and proxy capabilities for MCP servers.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                What is MCP?
              </h3>
              <p className="text-gray-600 dark:text-gray-300 mb-6">
                The Model Context Protocol (MCP) is an open standard for connecting AI assistants 
                to external data sources and tools. MCP servers provide capabilities like tools, 
                resources, and prompts that can be used by AI applications.
              </p>

              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Key Features
              </h3>
              <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2 mb-6">
                <li><strong>Server Discovery:</strong> Browse and search available MCP servers</li>
                <li><strong>Health Monitoring:</strong> Real-time health status and uptime tracking</li>
                <li><strong>Proxy Gateway:</strong> Secure request proxying with authentication</li>
                <li><strong>Schema Federation:</strong> Unified schema from multiple servers</li>
                <li><strong>Rate Limiting:</strong> Built-in protection against abuse</li>
              </ul>
            </div>
          </div>
        </section>

        {/* API Reference */}
        <section id="api-reference" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Code className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              API Reference
            </h2>

            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Base URL
                </h3>
                <CodeBlock language="text" id="base-url">
https://mcp-hub-worker.your-subdomain.workers.dev
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  List Servers
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get a list of all registered MCP servers with optional filtering.
                </p>
                <CodeBlock language="http" id="list-servers">
GET /api/servers?search=ai&verified=true&health=online&limit=20&offset=0
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Get Server Details
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Retrieve detailed information about a specific server.
                </p>
                <CodeBlock language="http" id="get-server">
GET /api/servers/{server-id}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Health Check
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  Get health status for all servers or force a new check.
                </p>
                <CodeBlock language="http" id="health-check">
GET /api/health?force=true
                </CodeBlock>
              </div>
            </div>
          </div>
        </section>

        {/* Proxy Usage */}
        <section id="proxy-usage" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Zap className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Proxy Usage
            </h2>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                The proxy endpoint allows you to make requests to MCP servers through MCP Hub, 
                providing authentication, rate limiting, and error handling.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Proxy Request
                </h3>
                <CodeBlock language="javascript" id="proxy-request">
{`const response = await fetch('/api/proxy', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    serverId: 'example-server',
    path: '/tools/list',
    method: 'GET',
    headers: {
      'Authorization': 'Bearer your-token'
    }
  })
});

const data = await response.json();`}
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Response Format
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  The proxy returns the original server response with additional headers:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li><code>X-Proxy-Response-Time</code>: Response time in milliseconds</li>
                  <li><code>X-Proxy-Server-Id</code>: ID of the proxied server</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Health Monitoring */}
        <section id="health-monitoring" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Health Monitoring
            </h2>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                MCP Hub continuously monitors the health of all registered servers, 
                providing real-time status updates and uptime statistics.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Health Status Types
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-success-500 rounded-full"></div>
                    <span className="text-gray-900 dark:text-white font-medium">Online</span>
                    <span className="text-gray-600 dark:text-gray-300">- Server is responding normally</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-warning-500 rounded-full"></div>
                    <span className="text-gray-900 dark:text-white font-medium">Degraded</span>
                    <span className="text-gray-600 dark:text-gray-300">- Server is slow or returning errors</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-error-500 rounded-full"></div>
                    <span className="text-gray-900 dark:text-white font-medium">Offline</span>
                    <span className="text-gray-600 dark:text-gray-300">- Server is not responding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                    <span className="text-gray-900 dark:text-white font-medium">Unknown</span>
                    <span className="text-gray-600 dark:text-gray-300">- Health status not yet determined</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Monitoring Schedule
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Automated checks every 30 minutes</li>
                  <li>Backup checks every 6 hours</li>
                  <li>Manual checks available via API</li>
                  <li>GitHub Actions integration for notifications</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Schema Federation */}
        <section id="schema-federation" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <Shield className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Schema Federation
            </h2>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                MCP Hub can fetch and merge schemas from multiple MCP servers, 
                providing a unified view of available tools, resources, and prompts.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Get Federated Schema
                </h3>
                <CodeBlock language="http" id="federated-schema">
GET /api/schema?refresh=true
                </CodeBlock>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Conflict Resolution
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  When multiple servers provide tools, resources, or prompts with the same name, 
                  MCP Hub automatically resolves conflicts by:
                </p>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-1">
                  <li>Adding namespace prefixes to conflicting items</li>
                  <li>Tracking conflict information in the schema</li>
                  <li>Providing resolution details for debugging</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Contributing */}
        <section id="contributing" className="mb-12">
          <div className="glass-card dark:glass-card-dark rounded-xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
              <ExternalLink className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              Contributing
            </h2>

            <div className="space-y-6">
              <p className="text-gray-600 dark:text-gray-300">
                MCP Hub is open source and welcomes contributions from the community.
              </p>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Ways to Contribute
                </h3>
                <ul className="list-disc list-inside text-gray-600 dark:text-gray-300 space-y-2">
                  <li><strong>Submit MCP Servers:</strong> Add your server to the registry</li>
                  <li><strong>Report Issues:</strong> Help us improve by reporting bugs</li>
                  <li><strong>Feature Requests:</strong> Suggest new features or improvements</li>
                  <li><strong>Code Contributions:</strong> Submit pull requests with fixes or features</li>
                  <li><strong>Documentation:</strong> Help improve our documentation</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Links
                </h3>
                <div className="space-y-2">
                  <a
                    href="https://github.com/YOUR_USERNAME/mcp-hub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    GitHub Repository
                  </a>
                  <a
                    href="https://github.com/YOUR_USERNAME/mcp-hub/issues"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Issue Tracker
                  </a>
                  <a
                    href="https://modelcontextprotocol.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300"
                  >
                    <ExternalLink className="w-4 h-4" />
                    MCP Specification
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
