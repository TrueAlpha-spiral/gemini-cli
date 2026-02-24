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

describe('ide-installer', () => {
  describe('getIdeInstaller', () => {
    it('should return a VsCodeInstaller for "vscode"', () => {
      const installer = getIdeInstaller(DetectedIde.VSCode);
      expect(installer).not.toBeNull();
      // A more specific check might be needed if we export the class
      expect(installer).toBeInstanceOf(Object);
    });

    it('should return null for an unknown IDE', () => {
      const installer = getIdeInstaller('unknown' as DetectedIde);
      expect(installer).toBeNull();
    });
  });

  describe('VsCodeInstaller', () => {
    let installer: IdeInstaller;

    beforeEach(() => {
      vi.resetAllMocks();
      // We get a new installer for each test to reset the find command logic
      vi.spyOn(child_process, 'execSync').mockImplementation(() => '');
      vi.spyOn(fs, 'existsSync').mockReturnValue(false);
      vi.spyOn(os, 'homedir').mockReturnValue('/home/user');
      vi.mocked(os.platform).mockReturnValue('linux');
      vi.mocked(glob.sync).mockReturnValue([]);
      installer = getIdeInstaller(DetectedIde.VSCode)!;
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    describe('install', () => {
      it('should return a failure message if VS Code is not installed', async () => {
        vi.spyOn(child_process, 'execSync').mockImplementation(() => {
          throw new Error('Command not found');
        });
        vi.spyOn(fs, 'existsSync').mockReturnValue(false);
        // Re-create the installer so it re-runs findVsCodeCommand
        installer = getIdeInstaller(DetectedIde.VSCode)!;
        const result = await installer.install();
        expect(result.success).toBe(false);
        expect(result.message).toContain('VS Code CLI not found');
      });

      it('should return success if VS Code is installed and VSIX is found', async () => {
        // Mock finding VS Code
        vi.spyOn(child_process, 'execSync').mockImplementation((cmd) => {
          if (typeof cmd === 'string' && (cmd.includes('where.exe') || cmd.includes('command -v'))) {
            return 'code';
          }
          return '';
        });

        // Mock finding VSIX
        vi.mocked(glob.sync).mockReturnValue(['test.vsix']);

        // Mock execFileSync success
        vi.spyOn(child_process, 'execFileSync').mockReturnValue(Buffer.from(''));

        // Re-create installer
        installer = getIdeInstaller(DetectedIde.VSCode)!;

        const result = await installer.install();

        expect(result.success).toBe(true);
        expect(result.message).toContain('successfully');
        expect(child_process.execFileSync).toHaveBeenCalledWith(
          expect.stringContaining('code'),
          ['--install-extension', 'test.vsix', '--force'],
          expect.objectContaining({ stdio: 'pipe' })
        );
      });

      it('should return failure if installation fails', async () => {
         // Mock finding VS Code
         vi.spyOn(child_process, 'execSync').mockImplementation((cmd) => {
          if (typeof cmd === 'string' && (cmd.includes('where.exe') || cmd.includes('command -v'))) {
            return 'code';
          }
          return '';
        });

        // Mock finding VSIX
        vi.mocked(glob.sync).mockReturnValue(['test.vsix']);

        // Mock execFileSync failure
        vi.spyOn(child_process, 'execFileSync').mockImplementation(() => {
          throw new Error('Installation failed');
        });

        installer = getIdeInstaller(DetectedIde.VSCode)!;

        const result = await installer.install();

        expect(result.success).toBe(false);
        expect(result.message).toContain('Failed to install');
      });

      it('should execute via cmd.exe on Windows for .cmd files', async () => {
        // Mock platform as win32
        vi.mocked(os.platform).mockReturnValue('win32');

        // Mock execSync to fail (not in PATH) so it searches locations
        vi.spyOn(child_process, 'execSync').mockImplementation(() => {
          throw new Error('not found');
        });

        // Mock fs.existsSync to find the Windows path
        vi.spyOn(fs, 'existsSync').mockReturnValue(true);

        // Mock finding VSIX
        vi.mocked(glob.sync).mockReturnValue(['test.vsix']);

        // Mock execFileSync success
        vi.spyOn(child_process, 'execFileSync').mockReturnValue(
          Buffer.from(''),
        );

        // Re-create installer
        installer = getIdeInstaller(DetectedIde.VSCode)!;

        const result = await installer.install();

        expect(result.success).toBe(true);
        expect(child_process.execFileSync).toHaveBeenCalledWith(
          expect.stringMatching(/cmd\.exe$/), // Should be cmd.exe
          [
            '/c',
            expect.stringMatching(/code\.cmd$/),
            '--install-extension',
            'test.vsix',
            '--force',
          ],
          expect.objectContaining({ stdio: 'pipe' }),
        );
      });
    });
  });
});
