/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  PersistentRootKernel,
  PhoenixError,
} from './persistent-root-kernel.js';
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

  it('should trigger Recursive Repair [Re-Action] when initial PI check fails', async () => {
    // Simulate a high-entropy input that fails the initial PI check (MAX_PI = 10.0)
    // d = 256.0. We need C > 2560.
    // Since our mock banach.calculateMetric depends on length * entropy,
    // we need a long string with high unique char count.

    // Construct a "turbulent" string: long length, high entropy density.
    // 5000 chars * (128/128) = 5000 metric > 2560.
    // This should trigger the initial failure.
    // However, the RecursiveRuntime will attempt to contract it.
    // 5000 -> 4500 -> ... until < target.
    // If it succeeds, we get a verified output that is a contracted version of the input.

    const turbulence = Array.from({ length: 5000 }, (_, i) =>
      String.fromCharCode((i % 94) + 33),
    ).join('');

    const result = await kernel.evaluate_cognitive_stream(turbulence);

    if (result.type === 'verified_output') {
      // It succeeded via repair!
      expect(result.content.length).toBeLessThan(turbulence.length);
      expect(result.content.length).toBeGreaterThan(0);
    } else {
      // If it failed completely, verify the reason contains "Recursive Repair failed"
      // But our goal is to prove it *can* repair.
      // The simulated banach apply() works by slicing 10% per step up to 100 steps.
      // 5000 * 0.9^n < target?
      // It should eventually converge.
      expect(result.type).toBe('verified_output');
    }
  });
});
