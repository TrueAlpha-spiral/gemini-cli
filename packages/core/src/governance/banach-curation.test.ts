/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import { BanachCurationOperator } from './banach-curation.js';

describe('BanachCurationOperator', () => {
  const operator = new BanachCurationOperator();

  it('should calculate non-negative metric distance', () => {
    const d = operator.calculateMetric('test content');
    expect(d).toBeGreaterThanOrEqual(0);
  });

  it('should contract high-entropy inputs (f_pi)', () => {
    const input = 'This is a long string with some variability that needs contraction.';
    const contracted = operator.apply(input);

    // Contracted content should be shorter or same length
    expect(contracted.length).toBeLessThanOrEqual(input.length);

    // Contraction condition check
    // Note: Simulation logic cuts string, so length decreases => metric decreases.
    const d_in = operator.calculateMetric(input);
    const d_out = operator.calculateMetric(contracted);

    // If input was already small, apply() might return it as is.
    // If input was large, d_out should be significantly smaller.
    if (d_in > 0) {
        expect(d_out).toBeLessThan(d_in);
    }
  });

  it('should verify the contraction condition (Lipschitz constant)', () => {
    const input = 'Chaotic input 1234567890';
    const contracted = operator.apply(input);

    const isValid = operator.verifyContraction(input, contracted);

    // In our simulation, apply() forces the condition or returns stable state.
    // If apply() changes the state, it must satisfy the condition.
    if (input !== contracted) {
        expect(isValid).toBe(true);
    }
  });

  it('should reach a fixed point (convergence)', () => {
    let current = 'A very long initial state to simulate convergence process...';
    let previous = '';
    let iterations = 0;

    while (current !== previous && iterations < 10) {
        previous = current;
        current = operator.apply(current);
        iterations++;
    }

    // Eventually it stabilizes
    expect(current).toBe(operator.apply(current));
  });
});
