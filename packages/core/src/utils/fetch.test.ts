/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, isPrivateIp, FetchError } from './fetch.js';

describe('isPrivateIp', () => {
  it('should identify private IPv4 addresses', () => {
    // 10.0.0.0/8
    expect(isPrivateIp('http://10.0.0.1')).toBe(true);
    expect(isPrivateIp('http://10.255.255.255')).toBe(true);

    // 172.16.0.0/12
    expect(isPrivateIp('http://172.16.0.1')).toBe(true);
    expect(isPrivateIp('http://172.31.255.255')).toBe(true);

    // 192.168.0.0/16
    expect(isPrivateIp('http://192.168.0.1')).toBe(true);
    expect(isPrivateIp('http://192.168.255.255')).toBe(true);

    // 127.0.0.0/8
    expect(isPrivateIp('http://127.0.0.1')).toBe(true);
  });

  it('should identify private IPv6 addresses', () => {
    // Loopback
    expect(isPrivateIp('http://[::1]')).toBe(true);

    // Unique Local Address (fc00::/7)
    expect(isPrivateIp('http://[fc00::1]')).toBe(true);

    // Link-local Address (fe80::/10)
    expect(isPrivateIp('http://[fe80::1]')).toBe(true);
  });

  it('should identify public IP addresses', () => {
    expect(isPrivateIp('http://8.8.8.8')).toBe(false);
    expect(isPrivateIp('http://1.1.1.1')).toBe(false);
    expect(isPrivateIp('http://172.32.0.1')).toBe(false); // Outside 172.16-31 range
    expect(isPrivateIp('http://192.169.0.1')).toBe(false);
  });

  it('should handle domain names', () => {
    expect(isPrivateIp('http://google.com')).toBe(false);
    expect(isPrivateIp('http://example.org')).toBe(false);
    // Localhost should be considered private
    expect(isPrivateIp('http://localhost')).toBe(true);
    expect(isPrivateIp('http://sub.localhost')).toBe(true);
  });

  it('should handle invalid URLs', () => {
    expect(isPrivateIp('not-a-url')).toBe(false);
    expect(isPrivateIp('')).toBe(false);
  });
});

describe('fetchWithTimeout', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should return response when fetch succeeds within timeout', async () => {
    const mockResponse = new Response('ok');
    (fetch as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockResponse,
    );

    const promise = fetchWithTimeout('http://example.com', 1000);

    // Fast-forward time slightly, but less than timeout
    await vi.advanceTimersByTimeAsync(500);

    const response = await promise;
    expect(response).toBe(mockResponse);
    expect(fetch).toHaveBeenCalledWith(
      'http://example.com',
      expect.objectContaining({
        signal: expect.any(AbortSignal),
      }),
    );
  });

  it('should throw FetchError with ETIMEDOUT code when request times out', async () => {
    // Mock fetch to simulate timeout behavior
    (fetch as unknown as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string, options: { signal: AbortSignal }) => {
        return new Promise((_, reject) => {
          if (options.signal.aborted) {
            const error = new Error('The operation was aborted');
            (error as any).code = 'ABORT_ERR';
            reject(error);
          } else {
            options.signal.addEventListener('abort', () => {
              const error = new Error('The operation was aborted');
              (error as any).code = 'ABORT_ERR';
              reject(error);
            });
          }
        });
      },
    );

    const promise = fetchWithTimeout('http://example.com', 1000);

    const validation = expect(promise).rejects.toMatchObject({
      message: 'Request timed out after 1000ms',
      code: 'ETIMEDOUT',
    });

    // Fast-forward time past timeout
    // Using advanceTimersByTimeAsync to ensure promises resolve
    await vi.advanceTimersByTimeAsync(1001);

    await validation;
  });

  it('should throw FetchError when fetch fails with other errors', async () => {
    const error = new Error('Network error');
    (fetch as unknown as ReturnType<typeof vi.fn>).mockRejectedValue(error);

    const promise = fetchWithTimeout('http://example.com', 1000);

    await expect(promise).rejects.toThrow('Network error');
    try {
      await promise;
    } catch (error: any) {
      expect(error).toBeInstanceOf(FetchError);
    }
  });
});
