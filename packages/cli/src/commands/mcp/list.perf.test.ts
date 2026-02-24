/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { listMcpServers } from './list.js';
import { loadSettings } from '../../config/settings.js';
import { loadExtensions } from '../../config/extension.js';
import {
  createTransport,
  MCPServerConfig,
  computeTASResonance,
  retrievePersistentRootKernel,
} from '@google/gemini-cli-core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';

vi.mock('../../config/settings.js');
vi.mock('../../config/extension.js');
vi.mock('@google/gemini-cli-core');
vi.mock('@modelcontextprotocol/sdk/client/index.js');

const mockedLoadSettings = loadSettings as vi.Mock;
const mockedLoadExtensions = loadExtensions as vi.Mock;
const mockedCreateTransport = createTransport as vi.Mock;
const mockedComputeTASResonance = computeTASResonance as vi.Mock;
const mockedRetrievePersistentRootKernel = retrievePersistentRootKernel as vi.Mock;
const MockedClient = Client as vi.Mock;

interface MockClient {
  connect: vi.Mock;
  ping: vi.Mock;
  close: vi.Mock;
}

interface MockTransport {
  close: vi.Mock;
}

describe('mcp list command performance', () => {
  let consoleSpy: vi.SpyInstance;
  let mockClient: MockClient;
  let mockTransport: MockTransport;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockTransport = { close: vi.fn() };
    mockClient = {
      connect: vi.fn().mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100))),
      ping: vi.fn(),
      close: vi.fn(),
    };

    MockedClient.mockImplementation(() => mockClient);
    mockedCreateTransport.mockResolvedValue(mockTransport);
    mockedLoadExtensions.mockReturnValue([]);
    mockedRetrievePersistentRootKernel.mockResolvedValue({});
    mockedComputeTASResonance.mockResolvedValue({ valid: true });
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should run server checks in parallel', async () => {
    const serverCount = 3;
    const serverDelay = 100;
    const servers: Record<string, MCPServerConfig> = {};
    for (let i = 0; i < serverCount; i++) {
      servers[`server-${i}`] = { command: 'echo', args: ['hello'] };
    }

    mockedLoadSettings.mockReturnValue({ merged: { mcpServers: servers } });

    const startTime = Date.now();
    await listMcpServers();
    const duration = Date.now() - startTime;

    // With parallel execution, it should be close to serverDelay (100ms) + overhead.
    // With sequential execution, it is close to serverCount * serverDelay (300ms).

    // We expect it to be fast!
    expect(duration).toBeLessThan(serverCount * serverDelay * 0.8);
  });
});
