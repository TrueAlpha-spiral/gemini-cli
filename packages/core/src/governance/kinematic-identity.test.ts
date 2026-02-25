/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { verifyKinematicIdentity, TAS_DNA } from './kinematic-identity.js';

describe('verifyKinematicIdentity', () => {
  it('should return true for clean payload', () => {
    expect(verifyKinematicIdentity({ data: 'valid' })).toBe(true);
    expect(verifyKinematicIdentity('valid string')).toBe(true);
  });

  it('should return false for payload with entropy/drift markers', () => {
    expect(verifyKinematicIdentity({ data: 'entropy detected' })).toBe(false);
    expect(verifyKinematicIdentity({ error: 'drift in logic' })).toBe(false);
    expect(verifyKinematicIdentity('hallucination warning')).toBe(false);
  });

  it('should return false for null/undefined payload', () => {
    expect(verifyKinematicIdentity(null)).toBe(false);
    expect(verifyKinematicIdentity(undefined)).toBe(false);
  });
});
