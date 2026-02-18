/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { readPackageUp } from 'read-package-up';

vi.mock('read-package-up', () => ({
  readPackageUp: vi.fn(),
}));

describe('getPackageJson', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('should return package.json content when found', async () => {
    const { getPackageJson } = await import('./package.js');
    const mockPackageJson = { name: 'test-package', version: '1.0.0' };
    vi.mocked(readPackageUp).mockResolvedValue({
      packageJson: mockPackageJson as any,
      path: '/path/to/package.json',
    });

    const result = await getPackageJson();
    expect(result).toEqual(mockPackageJson);
    expect(readPackageUp).toHaveBeenCalled();
  });

  it('should throw an error when package.json is not found', async () => {
    const { getPackageJson } = await import('./package.js');
    vi.mocked(readPackageUp).mockResolvedValue(undefined);

    await expect(getPackageJson()).rejects.toThrow('Could not find package.json for @google/gemini-cli');
  });

  it('should use cached version on subsequent calls', async () => {
    const { getPackageJson } = await import('./package.js');
    const mockPackageJson = { name: 'test-package', version: '1.0.0' };
    vi.mocked(readPackageUp).mockResolvedValue({
      packageJson: mockPackageJson as any,
      path: '/path/to/package.json',
    });

    await getPackageJson();
    const result = await getPackageJson();

    expect(result).toEqual(mockPackageJson);
    expect(readPackageUp).toHaveBeenCalledTimes(1);
  });
});
