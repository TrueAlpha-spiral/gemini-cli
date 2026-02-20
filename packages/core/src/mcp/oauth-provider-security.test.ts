/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi } from 'vitest';

// Mock dependencies AT THE TOP
const mockOpenBrowserSecurely = vi.hoisted(() => vi.fn());
vi.mock('../utils/secure-browser-launcher.js', () => ({
  openBrowserSecurely: mockOpenBrowserSecurely,
}));
vi.mock('node:crypto');
vi.mock('./oauth-token-storage.js');

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as http from 'node:http';
import * as crypto from 'node:crypto';
import {
  MCPOAuthProvider,
  MCPOAuthConfig,
  OAuthTokenResponse,
} from './oauth-provider.js';
import { MCPOAuthTokenStorage, MCPOAuthToken } from './oauth-token-storage.js';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Define a reusable mock server with .listen, .close, and .on methods
const mockHttpServer = vi.hoisted(() => ({
  listen: vi.fn(),
  close: vi.fn(),
  on: vi.fn(),
}));
vi.mock('node:http', () => ({
  createServer: vi.fn(() => mockHttpServer),
}));

describe('MCPOAuthProvider Security', () => {
  const mockConfig: MCPOAuthConfig = {
    enabled: true,
    clientId: 'test-client-id',
    clientSecret: 'test-client-secret',
    authorizationUrl: 'https://auth.example.com/authorize',
    tokenUrl: 'https://auth.example.com/token',
    scopes: ['read', 'write'],
    redirectUri: 'http://localhost:7777/oauth/callback',
    audiences: ['https://api.example.com'],
  };

  const mockToken: MCPOAuthToken = {
    accessToken: 'access_token_1234567890_sensitive_part',
    refreshToken: 'refresh_token_456',
    tokenType: 'Bearer',
    scope: 'read write',
    expiresAt: Date.now() + 3600000,
  };

  const mockTokenResponse: OAuthTokenResponse = {
    access_token: 'access_token_1234567890_sensitive_part',
    token_type: 'Bearer',
    expires_in: 3600,
    refresh_token: 'refresh_token_456',
    scope: 'read write',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockOpenBrowserSecurely.mockClear();

    // Mock console.log to spy on calls
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'warn').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});

    // Mock crypto functions
    vi.mocked(crypto.randomBytes).mockImplementation((size: number) => {
      if (size === 32) return Buffer.from('code_verifier_mock_32_bytes_long');
      if (size === 16) return Buffer.from('state_mock_16_by');
      return Buffer.alloc(size);
    });

    vi.mocked(crypto.createHash).mockReturnValue({
      update: vi.fn().mockReturnThis(),
      digest: vi.fn().mockReturnValue('code_challenge_mock'),
    } as unknown as crypto.Hash);

    // Mock token storage
    vi.mocked(MCPOAuthTokenStorage.saveToken).mockResolvedValue(undefined);
    // Important: we need getToken to return the token so the vulnerable code block executes
    vi.mocked(MCPOAuthTokenStorage.getToken).mockResolvedValue({
      serverName: 'test-server',
      token: mockToken,
      updatedAt: Date.now(),
      clientId: mockConfig.clientId,
      tokenUrl: mockConfig.tokenUrl,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should NOT log sensitive token information during authentication', async () => {
    // Mock HTTP server callback
    let callbackHandler: unknown;
    vi.mocked(http.createServer).mockImplementation((handler) => {
      callbackHandler = handler;
      return mockHttpServer as unknown as http.Server;
    });

    mockHttpServer.listen.mockImplementation((port, callback) => {
      callback?.();
      // Simulate OAuth callback
      setTimeout(() => {
        const mockReq = {
          url: '/oauth/callback?code=auth_code_123&state=c3RhdGVfbW9ja18xNl9ieQ', // state_mock_16_by in base64url (approx)
        };
        const mockRes = {
          writeHead: vi.fn(),
          end: vi.fn(),
        };
        (callbackHandler as (req: unknown, res: unknown) => void)(
          mockReq,
          mockRes,
        );
      }, 10);
    });

    // Mock token exchange
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockTokenResponse),
    });

    await MCPOAuthProvider.authenticate(
      'test-server',
      mockConfig,
    );

    // Get all arguments passed to console.log
    const logCalls = vi.mocked(console.log).mock.calls.map(args => args.join(' '));

    // Check that none of the log messages contain the access token or its substring
    const tokenPart = mockToken.accessToken.substring(0, 20);

    const logsWithToken = logCalls.filter(msg => msg.includes(tokenPart));

    // This expectation should fail before the fix
    expect(logsWithToken, `Found logs containing token substring: ${JSON.stringify(logsWithToken)}`).toHaveLength(0);

    const logsWithFullToken = logCalls.filter(msg => msg.includes(mockToken.accessToken));
    expect(logsWithFullToken, `Found logs containing full token: ${JSON.stringify(logsWithFullToken)}`).toHaveLength(0);
  });
});
