/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * DOUBLE HELIX SPIRAL PHYSICS ENGINE
 *
 * This module translates the continuous mathematical functions of the TrueAlphaSpiral
 * into discrete, deterministic runtime monitors.
 *
 * Reference: https://github.com/TrueAlpha-spiral/TrueAlpha-spiral/issues/3
 */

export interface EthicalState {
  truth: number; // T(t) - Alignment with Truth (0.0 - 1.0)
  love: number;  // L(t) - Alignment with Love (0.0 - 1.0)
  integrity: number; // I_c(t) - Integrity Correction Factor (0.0 - 1.0)
  timestamp: number;
}

export interface AuditArtifact {
  violation_code: string;
  timestamp: string;
  proof: {
    lyapunov_t0: number;
    lyapunov_t1: number;
    delta_v: number;
    equation: string;
    coherence: number;
    volatility: number;
  };
  message: string;
}

// Constants
const LAMBDA = 1.618; // Ethical amplification coefficient (Phi)
const MIN_VOLATILITY = 0.0001; // Avoid division by zero

/**
 * Calculates Ethical Eigenresonance Stability (Psi).
 * Equation 1: Psi(t) = (lambda * (T * L)) / I_c
 *
 * @param state The current ethical state.
 * @returns The coherence value E_c(t).
 */
export function calculateCoherence(state: EthicalState): number {
  if (state.integrity === 0) return 0; // Avoid singularity
  // Harmonic interaction of Truth and Love weighted by lambda
  return (LAMBDA * (state.truth * state.love)) / state.integrity;
}

/**
 * Calculates the Volatility Function (Sigma_E).
 * Measures the system's ethical variability over iterations.
 *
 * @param history Array of coherence values over time.
 * @returns The standard deviation (volatility).
 */
export function calculateVolatility(history: number[]): number {
  if (history.length < 2) return MIN_VOLATILITY;

  const mean = history.reduce((a, b) => a + b, 0) / history.length;
  const variance = history.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / history.length;
  return Math.sqrt(variance) || MIN_VOLATILITY;
}

/**
 * Calculates the Lyapunov Stability Function (V).
 * Equation 2: V(x) = E_c(t) / sigma_E(t)
 *
 * RECTIFICATION OF THE INVERTED STABILITY FIELD:
 * The original specification implies dV/dt <= 0 for stability while defining V = Coherence/Volatility.
 * Since high Coherence and low Volatility are desirable, a decreasing V would imply degradation.
 * Therefore, we enforce dV/dt >= 0 (Growth/Stability) for this definition of V.
 *
 * @param coherence Current ethical coherence.
 * @param volatility Current system volatility.
 * @returns The Lyapunov stability score.
 */
export function calculateLyapunov(coherence: number, volatility: number): number {
  return coherence / volatility;
}

/**
 * Validates the transition between ethical states using the Lyapunov Stability Condition.
 *
 * @param history The historical sequence of coherence values.
 * @param newState The proposed new ethical state.
 * @returns An AuditArtifact if the transition violates stability, otherwise null.
 */
export function validateEthicalTransition(
  history: number[],
  newState: EthicalState
): AuditArtifact | null {
  const currentCoherence = history[history.length - 1] || 0;
  const currentVolatility = calculateVolatility(history);
  const currentLyapunov = calculateLyapunov(currentCoherence, currentVolatility);

  const newCoherence = calculateCoherence(newState);
  const newHistory = [...history, newCoherence];
  const newVolatility = calculateVolatility(newHistory);
  const newLyapunov = calculateLyapunov(newCoherence, newVolatility);

  // The Spiral Condition: Stability must not degrade significantly.
  // We allow floating point tolerance.
  const delta = newLyapunov - currentLyapunov;

  // Strict non-degradation (allowing for very small epsilon)
  if (delta < -0.00001) {
    return {
      violation_code: 'ETHICAL_LYAPUNOV_DECAY',
      timestamp: new Date().toISOString(),
      proof: {
        lyapunov_t0: currentLyapunov,
        lyapunov_t1: newLyapunov,
        delta_v: delta,
        equation: 'V(x) = E_c(t) / sigma_E(t)',
        coherence: newCoherence,
        volatility: newVolatility
      },
      message: `Ethical trajectory compromised. Lyapunov stability decreased by ${Math.abs(delta)}. The system is spiraling into an unaligned state.`
    };
  }

  return null;
}
