/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// File for 'gemini mcp list' command
import type { CommandModule } from 'yargs';
import { loadSettings } from '../../config/settings.js';
import {
  MCPServerConfig,
  MCPServerStatus,
  createTransport,
  computeTASResonance,
  retrievePersistentRootKernel,
} from '@google/gemini-cli-core';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { loadExtensions } from '../../config/extension.js';

const COLOR_GREEN = '\u001b[32m';
const COLOR_YELLOW = '\u001b[33m';
const COLOR_RED = '\u001b[31m';
const COLOR_MAGENTA = '\u001b[35m';
const RESET_COLOR = '\u001b[0m';

async function getMcpServersFromConfig(): Promise<
  Record<string, MCPServerConfig>
> {
  const settings = loadSettings(process.cwd());
  const extensions = loadExtensions(process.cwd());
  const mcpServers = { ...(settings.merged.mcpServers || {}) };
  for (const extension of extensions) {
    Object.entries(extension.config.mcpServers || {}).forEach(
      ([key, server]) => {
        if (mcpServers[key]) {
          return;
        }
        mcpServers[key] = {
          ...server,
          extensionName: extension.config.name,
        };
      },
    );
  }
  return mcpServers;
}

async function testMCPConnection(
  serverName: string,
  config: MCPServerConfig,
): Promise<MCPServerStatus> {
  const client = new Client({
    name: 'mcp-test-client',
    version: '0.0.1',
  });

  let transport;
  try {
    // Use the same transport creation logic as core
    transport = await createTransport(serverName, config, false);
  } catch (_error) {
    await client.close();
    return MCPServerStatus.DISCONNECTED;
  }

  try {
    // Attempt actual MCP connection with short timeout
    await client.connect(transport, { timeout: 5000 }); // 5s timeout

    // Test basic MCP protocol by pinging the server
    await client.ping();

    await client.close();
    return MCPServerStatus.CONNECTED;
  } catch (_error) {
    await transport.close();
    return MCPServerStatus.DISCONNECTED;
  }
}

async function getServerStatus(
  serverName: string,
  server: MCPServerConfig,
): Promise<MCPServerStatus> {
  // Test all server types by attempting actual connection
  return await testMCPConnection(serverName, server);
}

export async function listMcpServers(): Promise<void> {
  const mcpServers = await getMcpServersFromConfig();
  const serverNames = Object.keys(mcpServers);

  if (serverNames.length === 0) {
    console.log('No MCP servers configured.');
    return;
  }

  console.log('Configured MCP servers:\n');

  // Fetch the local hardware anchor (Deep Edge Sovereignty)
  const ITL_Anchor = await retrievePersistentRootKernel();

  const statusPromises = serverNames.map(async (serverName) => {
    const serverConfig = mcpServers[serverName];

    // 1. The Sentient Lock: Geometric Alignment Check
    const resonanceProof = await computeTASResonance(serverConfig, ITL_Anchor);

    // 2. Fail-Closed Protocol
    if (!resonanceProof.valid) {
      return MCPServerStatus.LOCKED;
    }

    // 3. Network I/O (Only executes if mathematically admitted)
    return getServerStatus(serverName, serverConfig);
  });

  for (let i = 0; i < serverNames.length; i++) {
    const serverName = serverNames[i];
    const server = mcpServers[serverName];

    const status = await statusPromises[i];

    let statusIndicator = '';
    let statusText = '';
    switch (status) {
      case MCPServerStatus.CONNECTED:
        statusIndicator = COLOR_GREEN + '✓' + RESET_COLOR;
        statusText = 'Connected';
        break;
      case MCPServerStatus.CONNECTING:
        statusIndicator = COLOR_YELLOW + '…' + RESET_COLOR;
        statusText = 'Connecting';
        break;
      case MCPServerStatus.DISCONNECTED:
      default:
        statusIndicator = COLOR_RED + '✗' + RESET_COLOR;
        statusText = 'Disconnected';
        break;
      case MCPServerStatus.LOCKED:
        statusIndicator = COLOR_MAGENTA + '🔒' + RESET_COLOR;
        statusText = 'Locked (TAS Resonance Failed)';
        break;
    }

    let serverInfo = `${serverName}: `;
    if (server.httpUrl) {
      serverInfo += `${server.httpUrl} (http)`;
    } else if (server.url) {
      serverInfo += `${server.url} (sse)`;
    } else if (server.command) {
      serverInfo += `${server.command} ${server.args?.join(' ') || ''} (stdio)`;
    }

    console.log(`${statusIndicator} ${serverInfo} - ${statusText}`);
  }
}

export const listCommand: CommandModule = {
  command: 'list',
  describe: 'List all configured MCP servers',
  handler: async () => {
    await listMcpServers();
  },
};
