/**
 * Tests for ServerCard component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ServerCard } from '../ServerCard';
import { MCPServer } from '../../types';

// Mock server data
const mockServer: MCPServer = {
  id: 'test-server',
  name: 'Test MCP Server',
  description: 'A test server for unit testing',
  url: 'https://test-server.com',
  version: '1.0.0',
  tags: ['test', 'mock', 'development'],
  author: {
    name: 'Test Author',
    github: 'testauthor',
    url: 'https://testauthor.com',
  },
  capabilities: ['tools', 'resources'],
  authentication: {
    type: 'api-key',
    required: true,
  },
  rateLimit: {
    requests: 100,
    window: '1m',
  },
  verified: true,
  healthStatus: 'online',
  lastChecked: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// Wrapper component for router context
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

describe('ServerCard', () => {
  it('renders server information correctly', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('Test MCP Server')).toBeInTheDocument();
    expect(screen.getByText('A test server for unit testing')).toBeInTheDocument();
    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
    expect(screen.getByText('Test Author')).toBeInTheDocument();
  });

  it('displays tags correctly', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('test')).toBeInTheDocument();
    expect(screen.getByText('mock')).toBeInTheDocument();
    expect(screen.getByText('development')).toBeInTheDocument();
  });

  it('shows verified badge for verified servers', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('does not show verified badge for unverified servers', () => {
    const unverifiedServer = { ...mockServer, verified: false };
    
    render(
      <RouterWrapper>
        <ServerCard server={unverifiedServer} />
      </RouterWrapper>
    );

    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('displays health status correctly', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    // Health status should be displayed (exact text depends on HealthStatus component)
    const healthElement = screen.getByTestId('health-status');
    expect(healthElement).toBeInTheDocument();
  });

  it('shows authentication requirement', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('API Key Required')).toBeInTheDocument();
  });

  it('displays capabilities', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('tools')).toBeInTheDocument();
    expect(screen.getByText('resources')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const onClickMock = vi.fn();
    
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} onClick={onClickMock} />
      </RouterWrapper>
    );

    const card = screen.getByRole('article');
    fireEvent.click(card);

    expect(onClickMock).toHaveBeenCalledWith(mockServer);
  });

  it('navigates to server detail page on click', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    const detailLink = screen.getByRole('link', { name: /view details/i });
    expect(detailLink).toHaveAttribute('href', '/server/test-server');
  });

  it('opens external URL in new tab', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    const externalLink = screen.getByRole('link', { name: /visit server/i });
    expect(externalLink).toHaveAttribute('href', 'https://test-server.com');
    expect(externalLink).toHaveAttribute('target', '_blank');
    expect(externalLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('handles servers without optional fields', () => {
    const minimalServer: MCPServer = {
      id: 'minimal-server',
      name: 'Minimal Server',
      description: 'A minimal server',
      url: 'https://minimal.com',
      version: '1.0.0',
      tags: ['minimal'],
      author: {
        name: 'Minimal Author',
      },
      verified: false,
      healthStatus: 'unknown',
      lastChecked: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    render(
      <RouterWrapper>
        <ServerCard server={minimalServer} />
      </RouterWrapper>
    );

    expect(screen.getByText('Minimal Server')).toBeInTheDocument();
    expect(screen.getByText('Minimal Author')).toBeInTheDocument();
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('applies correct CSS classes for different health statuses', () => {
    const offlineServer = { ...mockServer, healthStatus: 'offline' as const };
    
    render(
      <RouterWrapper>
        <ServerCard server={offlineServer} />
      </RouterWrapper>
    );

    const healthElement = screen.getByTestId('health-status');
    expect(healthElement).toHaveClass('text-error-600');
  });

  it('is accessible', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Test MCP Server'));
    
    // Check for proper heading structure
    expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
  });

  it('supports keyboard navigation', () => {
    render(
      <RouterWrapper>
        <ServerCard server={mockServer} />
      </RouterWrapper>
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('tabIndex', '0');
    
    // Test keyboard events
    fireEvent.keyDown(card, { key: 'Enter' });
    fireEvent.keyDown(card, { key: ' ' });
  });
});
