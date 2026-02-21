/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { isBinary } from './textUtils.js';

describe('isBinary', () => {
  it('should return false for null input', () => {
    expect(isBinary(null)).toBe(false);
  });

  it('should return false for undefined input', () => {
    expect(isBinary(undefined)).toBe(false);
  });

  it('should return false for empty buffer', () => {
    expect(isBinary(Buffer.alloc(0))).toBe(false);
  });

  it('should return false for text content (no null bytes)', () => {
    const text = Buffer.from('Hello, world! This is a text file.');
    expect(isBinary(text)).toBe(false);
  });

  it('should return true for binary content (contains null bytes)', () => {
    const binary = Buffer.from('Hello\0World');
    expect(isBinary(binary)).toBe(true);
  });

  it('should return true if null byte is within the sample size', () => {
    const data = Buffer.alloc(1024, 'a');
    data[500] = 0; // Null byte at index 500 (within default 512)
    expect(isBinary(data)).toBe(true);
  });

  it('should return false if null byte is outside the default sample size', () => {
    const data = Buffer.alloc(1024, 'a');
    data[600] = 0; // Null byte at index 600 (outside default 512)
    expect(isBinary(data)).toBe(false);
  });

  it('should support custom sample size', () => {
    const data = Buffer.alloc(100, 'a');
    data[50] = 0;

    // With small sample size, it shouldn't reach the null byte
    expect(isBinary(data, 20)).toBe(false);

    // With large enough sample size, it should find it
    expect(isBinary(data, 60)).toBe(true);
  });

  it('should handle buffer smaller than sample size', () => {
    const data = Buffer.from('Short\0Buffer');
    // Sample size 512 is larger than buffer length
    expect(isBinary(data, 512)).toBe(true);
  });
});
