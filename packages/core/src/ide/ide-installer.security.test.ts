/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';
import { getIdeInstaller, IdeInstaller } from './ide-installer.js';
import * as child_process from 'child_process';
import * as fs from 'fs';
import * as os from 'os';
import { glob } from 'glob';
import { DetectedIde } from './detect-ide.js';

// Mocks
vi.mock('child_process');
vi.mock('fs');
vi.mock('os');
vi.mock('glob', () => ({
  glob: {
    sync: vi.fn(),
  },
}));

describe('ide-installer security', () => {
  let installer: IdeInstaller;
  const mockVsixPath = 'malicious"; rm -rf /; echo ".vsix';

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mocks setup
    vi.mocked(os.homedir).mockReturnValue('/home/user');
    vi.mocked(fs.existsSync).mockReturnValue(true); // Simulate found VS Code

    // Mock glob to return our malicious file
    vi.mocked(glob.sync).mockReturnValue([mockVsixPath]);

    // Mock execSync for findVsCodeCommand to succeed
    vi.mocked(child_process.execSync).mockImplementation((cmd) => {
      if (typeof cmd === 'string' && (cmd.includes('where.exe') || cmd.includes('command -v'))) {
        return 'code'; // Simulate finding code in PATH
      }
      return '';
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should not execute shell command with unsanitized filename', async () => {
    installer = getIdeInstaller(DetectedIde.VSCode)!;

    // We expect install() to use execFileSync instead of execSync for the actual installation
    // But currently the vulnerable code uses execSync.
    // So this test is expected to fail or we can assert that execSync IS called with malicious string
    // to prove vulnerability first?
    // The task is to "Create reproduction/security test".
    // Usually this means a test that demonstrates the fix.
    // But I can also write it to assert the DESIRED behavior (fail now, pass later).

    // Let's assert the DESIRED behavior: execFileSync should be called.

    try {
      await installer.install();
    } catch (e) {
      // Ignore errors from the implementation (e.g. if execSync throws)
    }

    // Check if execSync was called with the malicious payload
    // The vulnerable code does: `"${commandPath}" --install-extension "${vsixPath}" --force`
    // commandPath is 'code' (from our mock above? No, wait.)

    // In findVsCodeCommand:
    // It returns VSCODE_COMMAND constant ('code' or 'code.cmd') if execSync succeeds.
    // So commandPath is 'code' (on linux).

    const expectedCommandStart = '"code" --install-extension';

    const execSyncCalls = vi.mocked(child_process.execSync).mock.calls;
    const dangerousCall = execSyncCalls.find(call => {
      const cmd = call[0] as string;
      return cmd.includes(mockVsixPath);
    });

    // If vulnerability exists, dangerousCall will be defined.
    // We want to assert that it is NOT defined (after fix).
    // For now, let's just log it to see.
    if (dangerousCall) {
      console.log('Vulnerability detected: execSync called with:', dangerousCall[0]);
    }

    // After fix, we expect execFileSync to be called
    expect(child_process.execFileSync).toHaveBeenCalledWith(
      expect.stringContaining('code'), // The executable
      ['--install-extension', mockVsixPath, '--force'], // The arguments array
      expect.objectContaining({ stdio: 'pipe' }) // Options
    );
  });
});
