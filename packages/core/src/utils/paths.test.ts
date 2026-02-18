/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  escapePath,
  unescapePath,
  getProjectHash,
  tildeifyPath,
  shortenPath,
  makeRelative,
  getProjectTempDir,
  getUserCommandsDir,
  getProjectCommandsDir,
  resolveCanonicalPath,
} from './paths.js';
import os from 'node:os';
import path from 'node:path';

describe('escapePath', () => {
  it('should escape spaces', () => {
    expect(escapePath('my file.txt')).toBe('my\\ file.txt');
  });

  it('should escape tabs', () => {
    expect(escapePath('file\twith\ttabs.txt')).toBe('file\\\twith\\\ttabs.txt');
  });

  it('should escape parentheses', () => {
    expect(escapePath('file(1).txt')).toBe('file\\(1\\).txt');
  });

  it('should escape square brackets', () => {
    expect(escapePath('file[backup].txt')).toBe('file\\[backup\\].txt');
  });

  it('should escape curly braces', () => {
    expect(escapePath('file{temp}.txt')).toBe('file\\{temp\\}.txt');
  });

  it('should escape semicolons', () => {
    expect(escapePath('file;name.txt')).toBe('file\\;name.txt');
  });

  it('should escape ampersands', () => {
    expect(escapePath('file&name.txt')).toBe('file\\&name.txt');
  });

  it('should escape pipes', () => {
    expect(escapePath('file|name.txt')).toBe('file\\|name.txt');
  });

  it('should escape asterisks', () => {
    expect(escapePath('file*.txt')).toBe('file\\*.txt');
  });

  it('should escape question marks', () => {
    expect(escapePath('file?.txt')).toBe('file\\?.txt');
  });

  it('should escape dollar signs', () => {
    expect(escapePath('file$name.txt')).toBe('file\\$name.txt');
  });

  it('should escape backticks', () => {
    expect(escapePath('file`name.txt')).toBe('file\\`name.txt');
  });

  it('should escape single quotes', () => {
    expect(escapePath("file'name.txt")).toBe("file\\'name.txt");
  });

  it('should escape double quotes', () => {
    expect(escapePath('file"name.txt')).toBe('file\\"name.txt');
  });

  it('should escape hash symbols', () => {
    expect(escapePath('file#name.txt')).toBe('file\\#name.txt');
  });

  it('should escape exclamation marks', () => {
    expect(escapePath('file!name.txt')).toBe('file\\!name.txt');
  });

  it('should escape tildes', () => {
    expect(escapePath('file~name.txt')).toBe('file\\~name.txt');
  });

  it('should escape less than and greater than signs', () => {
    expect(escapePath('file<name>.txt')).toBe('file\\<name\\>.txt');
  });

  it('should handle multiple special characters', () => {
    expect(escapePath('my file (backup) [v1.2].txt')).toBe(
      'my\\ file\\ \\(backup\\)\\ \\[v1.2\\].txt',
    );
  });

  it('should not double-escape already escaped characters', () => {
    expect(escapePath('my\\ file.txt')).toBe('my\\ file.txt');
    expect(escapePath('file\\(name\\).txt')).toBe('file\\(name\\).txt');
  });

  it('should handle escaped backslashes correctly', () => {
    // Double backslash (escaped backslash) followed by space should escape the space
    expect(escapePath('path\\\\ file.txt')).toBe('path\\\\\\ file.txt');
    // Triple backslash (escaped backslash + escaping backslash) followed by space should not double-escape
    expect(escapePath('path\\\\\\ file.txt')).toBe('path\\\\\\ file.txt');
    // Quadruple backslash (two escaped backslashes) followed by space should escape the space
    expect(escapePath('path\\\\\\\\ file.txt')).toBe('path\\\\\\\\\\ file.txt');
  });

  it('should handle complex escaped backslash scenarios', () => {
    // Escaped backslash before special character that needs escaping
    expect(escapePath('file\\\\(test).txt')).toBe('file\\\\\\(test\\).txt');
    // Multiple escaped backslashes
    expect(escapePath('path\\\\\\\\with space.txt')).toBe(
      'path\\\\\\\\with\\ space.txt',
    );
  });

  it('should handle paths without special characters', () => {
    expect(escapePath('normalfile.txt')).toBe('normalfile.txt');
    expect(escapePath('path/to/normalfile.txt')).toBe('path/to/normalfile.txt');
  });

  it('should handle complex real-world examples', () => {
    expect(escapePath('My Documents/Project (2024)/file [backup].txt')).toBe(
      'My\\ Documents/Project\\ \\(2024\\)/file\\ \\[backup\\].txt',
    );
    expect(escapePath('file with $special &chars!.txt')).toBe(
      'file\\ with\\ \\$special\\ \\&chars\\!.txt',
    );
  });

  it('should handle empty strings', () => {
    expect(escapePath('')).toBe('');
  });

  it('should handle paths with only special characters', () => {
    expect(escapePath(' ()[]{};&|*?$`\'"#!~<>')).toBe(
      '\\ \\(\\)\\[\\]\\{\\}\\;\\&\\|\\*\\?\\$\\`\\\'\\"\\#\\!\\~\\<\\>',
    );
  });
});

describe('unescapePath', () => {
  it('should unescape spaces', () => {
    expect(unescapePath('my\\ file.txt')).toBe('my file.txt');
  });

  it('should unescape tabs', () => {
    expect(unescapePath('file\\\twith\\\ttabs.txt')).toBe(
      'file\twith\ttabs.txt',
    );
  });

  it('should unescape parentheses', () => {
    expect(unescapePath('file\\(1\\).txt')).toBe('file(1).txt');
  });

  it('should unescape square brackets', () => {
    expect(unescapePath('file\\[backup\\].txt')).toBe('file[backup].txt');
  });

  it('should unescape curly braces', () => {
    expect(unescapePath('file\\{temp\\}.txt')).toBe('file{temp}.txt');
  });

  it('should unescape multiple special characters', () => {
    expect(unescapePath('my\\ file\\ \\(backup\\)\\ \\[v1.2\\].txt')).toBe(
      'my file (backup) [v1.2].txt',
    );
  });

  it('should handle paths without escaped characters', () => {
    expect(unescapePath('normalfile.txt')).toBe('normalfile.txt');
    expect(unescapePath('path/to/normalfile.txt')).toBe(
      'path/to/normalfile.txt',
    );
  });

  it('should handle all special characters', () => {
    expect(
      unescapePath(
        '\\ \\(\\)\\[\\]\\{\\}\\;\\&\\|\\*\\?\\$\\`\\\'\\"\\#\\!\\~\\<\\>',
      ),
    ).toBe(' ()[]{};&|*?$`\'"#!~<>');
  });

  it('should be the inverse of escapePath', () => {
    const testCases = [
      'my file.txt',
      'file(1).txt',
      'file[backup].txt',
      'My Documents/Project (2024)/file [backup].txt',
      'file with $special &chars!.txt',
      ' ()[]{};&|*?$`\'"#!~<>',
      'file\twith\ttabs.txt',
    ];

    testCases.forEach((testCase) => {
      expect(unescapePath(escapePath(testCase))).toBe(testCase);
    });
  });

  it('should handle empty strings', () => {
    expect(unescapePath('')).toBe('');
  });

  it('should not affect backslashes not followed by special characters', () => {
    expect(unescapePath('file\\name.txt')).toBe('file\\name.txt');
    expect(unescapePath('path\\to\\file.txt')).toBe('path\\to\\file.txt');
  });

  it('should handle escaped backslashes in unescaping', () => {
    // Should correctly unescape when there are escaped backslashes
    expect(unescapePath('path\\\\\\ file.txt')).toBe('path\\\\ file.txt');
    expect(unescapePath('path\\\\\\\\\\ file.txt')).toBe(
      'path\\\\\\\\ file.txt',
    );
    expect(unescapePath('file\\\\\\(test\\).txt')).toBe('file\\\\(test).txt');
  });
});

describe('getProjectHash', () => {
  it('should return a 64-character hex string', () => {
    const hash = getProjectHash('/path/to/project');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should return the same hash for the same input', () => {
    const hash1 = getProjectHash('/path/to/project');
    const hash2 = getProjectHash('/path/to/project');
    expect(hash1).toBe(hash2);
  });

  it('should return different hashes for different inputs', () => {
    const hash1 = getProjectHash('/path/to/project');
    const hash2 = getProjectHash('/other/path');
    expect(hash1).not.toBe(hash2);
  });

  it('should handle empty strings', () => {
    const hash = getProjectHash('');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle paths with special characters', () => {
    const hash = getProjectHash('/path with spaces/and!@#$%^&*()');
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });

  it('should handle extremely long paths', () => {
    const longPath = '/a'.repeat(2048);
    const hash = getProjectHash(longPath);
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe('tildeifyPath', () => {
  beforeEach(() => {
    vi.spyOn(os, 'homedir').mockReturnValue('/home/user');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should replace home directory with tilde', () => {
    expect(tildeifyPath('/home/user/project/file.txt')).toBe(
      '~/project/file.txt',
    );
  });

  it('should not replace if path does not start with home directory', () => {
    expect(tildeifyPath('/other/path/file.txt')).toBe('/other/path/file.txt');
  });

  it('should handle path exactly equal to home directory', () => {
    expect(tildeifyPath('/home/user')).toBe('~');
  });
});

describe('shortenPath', () => {
  it('should not shorten path if it is within maxLen', () => {
    const filePath = '/path/to/file.txt';
    expect(shortenPath(filePath, 30)).toBe(filePath);
  });

  it('should shorten long paths with ellipses', () => {
    const filePath = '/path/to/a/very/long/directory/structure/file.txt';
    const shortened = shortenPath(filePath, 20);
    expect(shortened.length).toBeLessThanOrEqual(20);
    expect(shortened).toContain('...');
  });

  it('should prioritize the start and end segments', () => {
    const filePath = '/home/user/projects/my-awesome-project/src/index.ts';
    const shortened = shortenPath(filePath, 30);
    expect(shortened).toMatch(/^\/home\/user\/.*index\.ts$/);
  });

  it('should handle paths with only one segment after root', () => {
    const filePath = '/verylongfilename.txt';
    const shortened = shortenPath(filePath, 10);
    expect(shortened).toBe('very...t.txt');
  });
});

describe('makeRelative', () => {
  it('should calculate relative path correctly', () => {
    const target = '/app/project/src/index.ts';
    const root = '/app/project';
    // Use path.join to make it platform-independent in expectations if needed,
    // but here we expect 'src/index.ts'
    expect(makeRelative(target, root)).toBe(path.join('src', 'index.ts'));
  });

  it('should return "." if target and root are the same', () => {
    const target = '/app/project';
    const root = '/app/project';
    expect(makeRelative(target, root)).toBe('.');
  });

  it('should handle different depths', () => {
    const target = '/app/project';
    const root = '/app/project/src';
    expect(makeRelative(target, root)).toBe('..');
  });
});

describe('resolveCanonicalPath', () => {
  it('should resolve relative path within root', () => {
    const rootDir = '/app/project';
    const filePath = './src/index.ts';
    const resolved = resolveCanonicalPath(filePath, rootDir);
    expect(resolved).toBe(path.resolve(rootDir, filePath));
  });

  it('should throw for path outside root', () => {
    const rootDir = '/app/project';
    const filePath = '../secret.txt';
    expect(() => resolveCanonicalPath(filePath, rootDir)).toThrow(
      'TAS_VIOLATION: Path Trajectory Out of Bounds',
    );
  });

  it('should throw for sibling directory with similar prefix', () => {
    const rootDir = '/app/project';
    const filePath = '../project-secrets/key.txt';
    expect(() => resolveCanonicalPath(filePath, rootDir)).toThrow(
      'TAS_VIOLATION: Path Trajectory Out of Bounds',
    );
  });

  it('should work with absolute paths within root', () => {
    const rootDir = '/app/project';
    const filePath = '/app/project/src/main.ts';
    const resolved = resolveCanonicalPath(filePath, rootDir);
    expect(resolved).toBe(filePath);
  });
});

describe('path construction utilities', () => {
  beforeEach(() => {
    vi.spyOn(os, 'homedir').mockReturnValue('/home/user');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('getProjectTempDir should return correct path', () => {
    const projectRoot = '/app/project';
    const hash = getProjectHash(projectRoot);
    const expected = path.join('/home/user', '.gemini', 'tmp', hash);
    expect(getProjectTempDir(projectRoot)).toBe(expected);
  });

  it('getUserCommandsDir should return correct path', () => {
    const expected = path.join('/home/user', '.gemini', 'commands');
    expect(getUserCommandsDir()).toBe(expected);
  });

  it('getProjectCommandsDir should return correct path', () => {
    const projectRoot = '/app/project';
    const expected = path.join(projectRoot, '.gemini', 'commands');
    expect(getProjectCommandsDir(projectRoot)).toBe(expected);
  });
});
