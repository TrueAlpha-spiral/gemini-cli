/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { sovereignFetch } from './sovereign-transport.js';
import { PhoenixError } from './persistent-root-kernel.js';
import { fetchWithTimeout } from '../utils/fetch.js';
import { verifyKinematicIdentity } from './kinematic-identity.js';

// Mock dependencies
vi.mock('../utils/fetch.js', () => ({
  fetchWithTimeout: vi.fn(),
}));

vi.mock('./kinematic-identity.js', () => ({
  verifyKinematicIdentity: vi.fn(),
  TAS_DNA: 'TAS_DNA_CURSIVE_INVARIANT',
}));

describe('sovereignFetch', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('should return verified response when payload is valid', async () => {
    // Arrange
    const mockResponse = new Response(JSON.stringify({ data: 'valid' }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    (fetchWithTimeout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    (verifyKinematicIdentity as unknown as ReturnType<typeof vi.fn>).mockReturnValue(true);

    // Act
    const result = await sovereignFetch('http://example.com', 1000);

    // Assert
    expect(result).toBeInstanceOf(Response);
    expect(await result.json()).toEqual({ data: 'valid' });
    expect(verifyKinematicIdentity).toHaveBeenCalledWith({ data: 'valid' }, 'TAS_DNA_CURSIVE_INVARIANT');
  });

  it('should throw PhoenixError when payload fails kinematic verification', async () => {
    // Arrange
    const mockResponse = new Response(JSON.stringify({ drift: 'detected' }), { status: 200 });

    (fetchWithTimeout as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);
    (verifyKinematicIdentity as unknown as ReturnType<typeof vi.fn>).mockReturnValue(false);

    // Act & Assert
    await expect(sovereignFetch('http://example.com', 1000)).rejects.toThrow(PhoenixError);
    await expect(sovereignFetch('http://example.com', 1000)).rejects.toThrow(
      'Lineage Entropy exceeded: Mathematical Resonance failure.'
    );
  });
});
