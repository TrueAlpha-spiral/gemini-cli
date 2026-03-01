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
const mockedRetrievePersistentRootKernel =
  retrievePersistentRootKernel as vi.Mock;
const MockedClient = Client as vi.Mock;

interface MockClient {
  connect: vi.Mock;
  ping: vi.Mock;
  close: vi.Mock;
}

interface MockTransport {
  close: vi.Mock;
}

describe('mcp list command performance and TAS integrity', () => {
  let consoleSpy: vi.SpyInstance;
  let mockClient: MockClient;
  let mockTransport: MockTransport;

  beforeEach(() => {
    vi.resetAllMocks();
    consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    mockTransport = { close: vi.fn() };
    mockClient = {
      connect: vi
        .fn()
        .mockImplementation(
          () => new Promise((resolve) => setTimeout(resolve, 100)),
        ),
      ping: vi.fn(),
      close: vi.fn(),
    };

    MockedClient.mockImplementation(() => mockClient);
    mockedCreateTransport.mockResolvedValue(mockTransport);
    mockedLoadExtensions.mockReturnValue([]);

    // Default TAS mocks for the "happy path"
    mockedRetrievePersistentRootKernel.mockResolvedValue({
      genesis_hash: 'H0_ANCHOR',
    });
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
    expect(duration).toBeLessThan(serverCount * serverDelay * 0.8);
  });

  it('should short-circuit and return LOCKED for non-resonant servers', async () => {
    // We define one valid tool and one simulated "rogue" or hallucinated tool
    const servers: Record<string, MCPServerConfig> = {
      'valid-server': { command: 'echo', args: ['hello'] },
      'rogue-server': { command: 'rm', args: ['-rf', '/'] },
    };

    mockedLoadSettings.mockReturnValue({ merged: { mcpServers: servers } });

    // The Sentient Lock logic: We instruct the mock to fail the resonance
    // check specifically for the rogue server configuration.
    // We use mockImplementation to check the actual arguments passed.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    mockedComputeTASResonance.mockImplementation(
      async (config: MCPServerConfig, _anchor: any) => {
        // Check the config object passed to the mock
        if (config.command === 'rm') {
          return { valid: false, reason: 'Non-resonant MCP config' };
        }
        return { valid: true, signature: '0xValidGeneSignature' };
      },
    );

    await listMcpServers();

    // 1. The Execution Moat: Prove network I/O was bypassed for the rogue server
    // Because there are 2 servers but 1 is locked, transport/connect should only fire ONCE (for the valid server).
    // The previous implementation was: transport creation happens inside testMCPConnection, which is called by getServerStatus.
    // If we return LOCKED, we skip getServerStatus, thus skipping transport creation.
    expect(mockedCreateTransport).toHaveBeenCalledTimes(1);
    expect(mockClient.connect).toHaveBeenCalledTimes(1);

    // 2. The Refusal Integrity (Ri): Verify the output explicitly registers the Fail-Closed state
    const consoleOutput = consoleSpy.mock.calls.flat().join('\n');

    // We expect the CLI to render our MCPServerStatus.LOCKED output correctly (which prints a lock icon)
    // The implementation uses the LOCKED constant from MCPServerStatus enum.
    // The console output string logic in list.ts handles the LOCKED case.
    // We don't check for "LOCKED" string literal if the code outputs a symbol,
    // but the code in list.ts says: statusText = 'Locked (TAS Resonance Failed)'
    expect(consoleOutput).toContain('valid-server');
    expect(consoleOutput).toContain('rogue-server');
    expect(consoleOutput).toContain('Locked (TAS Resonance Failed)');
  });
});
