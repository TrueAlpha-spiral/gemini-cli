/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { bench, describe, vi } from 'vitest';
import { LSTool } from './ls.js';
import { Config } from '../config/config.js';
import { WorkspaceContext } from '../utils/workspaceContext.js';
import { FileDiscoveryService } from '../services/fileDiscoveryService.js';
import fs from 'fs';

// Mock fs
vi.mock('fs', () => ({
  default: {
    statSync: vi.fn(),
    readdirSync: vi.fn(),
  },
  statSync: vi.fn(),
  readdirSync: vi.fn(),
}));

describe('LSTool Performance', () => {
  const mockWorkspaceContext = {
    getDirectories: vi.fn().mockReturnValue(['/home/user/project']),
    isPathWithinWorkspace: vi.fn().mockReturnValue(true),
    addDirectory: vi.fn(),
  } as unknown as WorkspaceContext;

  const mockFileService = {
    shouldGitIgnoreFile: vi.fn().mockReturnValue(false),
    shouldGeminiIgnoreFile: vi.fn().mockReturnValue(false),
  } as unknown as FileDiscoveryService;

  const mockConfig = {
    getTargetDir: vi.fn().mockReturnValue('/home/user/project'),
    getWorkspaceContext: vi.fn().mockReturnValue(mockWorkspaceContext),
    getFileService: vi.fn().mockReturnValue(mockFileService),
    getFileFilteringOptions: vi.fn().mockReturnValue({
      respectGitIgnore: false,
      respectGeminiIgnore: false,
    }),
  } as unknown as Config;

  const tool = new LSTool(mockConfig);
  const testPath = '/home/user/project';
  const fileCount = 10000;
  const ignoreCount = 20;

  // Generate 10,000 file names
  const files = Array.from({ length: fileCount }, (_, i) => `file_${i}.ts`);

  // Generate 20 ignore patterns
  const ignorePatterns = Array.from({ length: ignoreCount }, (_, i) => `ignore_${i}.ts`);

  // Mock fs.readdirSync to return these files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(fs.readdirSync).mockReturnValue(files as any);

  // Mock fs.statSync to always return a file stats object
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  vi.mocked(fs.statSync).mockImplementation((path: any) => {
    if (path === testPath) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return { isDirectory: () => true } as any;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return { isDirectory: () => false, mtime: new Date(), size: 1024 } as any;
  });

  bench('LSTool.execute with 10k files and 20 patterns', async () => {
    await tool.execute(
      { path: testPath, ignore: ignorePatterns },
      new AbortController().signal
    );
  }, { time: 1000 });
});
