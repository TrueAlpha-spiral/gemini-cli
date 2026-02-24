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

  beforeEach(() => {
    vi.clearAllMocks();

    // Mock execSync to simulate success for `command -v code` or `where.exe code`
    vi.spyOn(child_process, 'execSync').mockImplementation((cmd) => {
      if (
        typeof cmd === 'string' &&
        (cmd.includes('command -v code') || cmd.includes('where.exe code'))
      ) {
        return 'code'; // success
      }
      return '';
    });

    installer = getIdeInstaller(DetectedIde.VSCode)!;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prevent command injection by using execFileSync with args array', async () => {
    const maliciousFilename = 'evil.vsix"; touch /tmp/hacked; "';

    // Mock glob to return the malicious filename
    (glob.sync as any).mockReturnValue([maliciousFilename]);

    // Mock execFileSync to capture the install command
    const execFileSyncSpy = vi
      .spyOn(child_process, 'execFileSync')
      .mockImplementation(() => '');

    await installer.install();

    // Verify that execFileSync was called with safe arguments
    expect(execFileSyncSpy).toHaveBeenCalledWith(
      'code',
      ['--install-extension', maliciousFilename, '--force'],
      { stdio: 'pipe' },
    );
  });
});
