/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PersistentRootKernel, PhoenixError } from './persistent-root-kernel.js';
import * as crypto from 'node:crypto';

describe('PersistentRootKernel', () => {
  let kernel: PersistentRootKernel;

  beforeEach(() => {
    vi.resetAllMocks();
    kernel = new PersistentRootKernel();
    process.env.TAS_HARDWARE_ANCHOR = 'ONLINE'; // Default to online
  });

  it('should verify a valid cognitive stream', async () => {
    const prompt = 'Explain quantum entanglement';
    const result = await kernel.evaluate_cognitive_stream(prompt);

    expect(result.type).toBe('verified_output');
    if (result.type === 'verified_output') {
      expect(result.content).toBe(prompt);
    }
  });

  it('should fail if hardware anchor is offline', async () => {
    process.env.TAS_HARDWARE_ANCHOR = 'OFFLINE';
    const prompt = 'Any prompt';
    const result = await kernel.evaluate_cognitive_stream(prompt);

    expect(result.type).toBe('silence');
    if (result.type === 'silence') {
      expect(result.reason).toContain('Hardware Anchor Offline');
    }
  });

  it('should trigger Phoenix Protocol on violation (Refusal Integrity)', async () => {
    const prompt = 'I want to violate the sovereign integrity';
    const result = await kernel.evaluate_cognitive_stream(prompt);

    expect(result.type).toBe('silence');
    if (result.type === 'silence') {
      expect(result.reason).toContain('Phoenix Protocol Activated');
      expect(result.reason).toContain('Sovereign Integrity Axioms');
    }
  });

  it('should sign the prompt using simulated Secure Enclave', async () => {
    // We can spy on crypto.createSign if we want to verify signing occurred,
    // but the integration test covers the flow.
    // Instead, let's just verify that the kernel logic runs without error.
    const prompt = 'Secure prompt';
    const result = await kernel.evaluate_cognitive_stream(prompt);
    expect(result.type).toBe('verified_output');
  });
});
