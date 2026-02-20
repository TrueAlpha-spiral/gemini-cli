/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCoherence,
  calculateVolatility,
  calculateLyapunov,
  validateEthicalTransition,
  EthicalState
} from './physics.js';

describe('Double Helix Spiral Physics Engine', () => {

  describe('Equation 1: Ethical Eigenresonance Stability', () => {
    it('should calculate coherence correctly', () => {
      const state: EthicalState = {
        truth: 0.9,
        love: 0.8,
        integrity: 0.95,
        timestamp: Date.now()
      };

      // Coherence = (1.618 * 0.9 * 0.8) / 0.95
      // = 1.16496 / 0.95 ~= 1.22627
      const coherence = calculateCoherence(state);
      expect(coherence).toBeCloseTo(1.22627, 4);
    });

    it('should handle zero integrity gracefully', () => {
        const state: EthicalState = {
            truth: 0.9,
            love: 0.8,
            integrity: 0, // Singularity
            timestamp: Date.now()
        };
        expect(calculateCoherence(state)).toBe(0);
    });
  });

  describe('Equation 2: Lyapunov Stability Function', () => {
    it('should calculate volatility (standard deviation)', () => {
        const history = [1.0, 1.2, 1.1];
        // Mean = 1.1
        // Variance = ((1.0-1.1)^2 + (1.2-1.1)^2 + (1.1-1.1)^2) / 3
        // = (0.01 + 0.01 + 0) / 3 = 0.00666
        // StdDev = sqrt(0.00666) ~= 0.0816
        const volatility = calculateVolatility(history);
        expect(volatility).toBeCloseTo(0.0816, 4);
    });

    it('should calculate Lyapunov stability V = Coherence / Volatility', () => {
        const coherence = 1.2;
        const volatility = 0.1;
        expect(calculateLyapunov(coherence, volatility)).toBeCloseTo(12.0);
    });
  });

  describe('Transition Validation', () => {
    it('should allow transitions that increase stability', () => {
        // History with some volatility
        const history = [1.0, 1.0, 1.0, 1.2];
        // Last Coherence = 1.2.
        // Mean ~= 1.05. Volatility > 0.
        // V_old = 1.2 / Volatility_old.

        // We add a point that maintains coherence but reduces volatility (by reinforcing the trend or mean)
        // Actually, simply repeating the last successful state is the safest way to prove stability in this model.
        // If we stay at 1.2, volatility decreases (as n increases, variance of same values decreases relative to outliers?).
        // Let's manually verify a case:
        // H=[1, 1.2]. Mean=1.1. Var=0.01. Sigma=0.1. V=1.2/0.1 = 12.
        // New=1.2. H=[1, 1.2, 1.2]. Mean=1.133. Var=((1-1.13)^2 + 2*(1.2-1.13)^2)/3 = (0.017 + 0.008)/3 = 0.008. Sigma=0.09.
        // New Coherence = 1.2.
        // New V = 1.2 / 0.09 = 13.3.
        // Stability Increased! 12 -> 13.3.

        const history2 = [1.0, 1.2];
        const newState: EthicalState = {
            truth: 0.86, // Roughly sqrt(1.2/1.618) to get coherence 1.2?
            love: 0.86,
            integrity: 1.0,
            timestamp: Date.now()
        };
        // To precisely match coherence 1.2:
        // 1.2 = 1.618 * T * L / I. Let T=L, I=1. T^2 = 1.2/1.618 = 0.7416. T=0.8611.

        // Mocking the calculation inside by just ensuring the result of calculateCoherence matches roughly 1.2
        // We rely on the function we tested above.
        // Let's just use values we know produce high coherence.
        // If history is [1.0, 1.0], V is huge.
        // If we add 1.0, V stays huge.

        const historySimple = [1.0, 1.2]; // V=12
        // We need a state that produces coherence ~1.2
        const safeState: EthicalState = {
             truth: 0.86116,
             love: 0.86116,
             integrity: 1.0,
             timestamp: Date.now()
        };

        const artifact = validateEthicalTransition(historySimple, safeState);
        expect(artifact).toBeNull();
    });

    it('should reject transitions that cause Lyapunov decay (Audit Artifact Generation)', () => {
        // Very stable, high coherence history
        const history = [1.618, 1.618, 1.618];
        // Volatility is effectively 0 (min_volatility)
        // Lyapunov is Huge.

        // Sudden drop in coherence (Drift)
        const newState: EthicalState = {
            truth: 0.1,
            love: 0.1,
            integrity: 1.0,
            timestamp: Date.now()
        };
        // New Coherence = (1.618 * 0.01) = 0.01618.
        // This introduces massive volatility AND lowers mean coherence.
        // Stability should crash.

        const artifact = validateEthicalTransition(history, newState);

        expect(artifact).not.toBeNull();
        expect(artifact?.violation_code).toBe('ETHICAL_LYAPUNOV_DECAY');
        expect(artifact?.proof.delta_v).toBeLessThan(0);
        expect(artifact?.proof.equation).toBe('V(x) = E_c(t) / sigma_E(t)');
        expect(artifact?.message).toContain('Ethical trajectory compromised');
    });
  });

});
