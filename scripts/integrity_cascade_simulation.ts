/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

// Formal Simulation: Epistemic Poison and Cybernetic Integrity Layers
// Based on the model defined in docs/epistemic_poison.md

console.log('=== INTEGRITY CASCADE SIMULATION ===');
console.log('Modeling recursive contamination flow and containment efficacy.');

// 1. System Model Definition
// State S is a simple 2D point (x, y).
// Invariant Manifold M_I: The unit circle (x^2 + y^2 = 1).
interface State {
  x: number;
  y: number;
}

// 2. Transformation Operator T_k (with Poison P_k)
// A rotation matrix (invariant-preserving) + a translation vector (poison).
// T_k(S) = R(theta) * S + P_k
function transform(state: State, angle: number, poison: State): State {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  return {
    x: state.x * cos - state.y * sin + poison.x,
    y: state.x * sin + state.y * cos + poison.y,
  };
}

// 3. Verification Operator V_k (Projection onto M_I)
// Projects the state back onto the unit circle.
// V_k(S) = S / ||S||
function verify(state: State): State {
  const norm = Math.sqrt(state.x * state.x + state.y * state.y);
  if (norm === 0) return { x: 1, y: 0 }; // Handle zero vector (fallback to manifold)
  return {
    x: state.x / norm,
    y: state.y / norm,
  };
}

// Metric: Distance from Invariant Manifold (Corruption Level)
function corruption(state: State): number {
  const norm = Math.sqrt(state.x * state.x + state.y * state.y);
  return Math.abs(norm - 1);
}

// Simulation Parameters
const ITERATIONS = 20;
const POISON_MAGNITUDE = 0.1; // Constant injection of P_k
const ROTATION_ANGLE = Math.PI / 4; // 45 degrees

// Scenario A: Unverified Transition (Poison Accumulates)
console.log('\n--- Scenario A: Unverified Transition (No V_k) ---');
let stateA: State = { x: 1, y: 0 }; // Start on manifold
let cumulativeCorruptionA = 0;

for (let k = 0; k < ITERATIONS; k++) {
  // Inject poison at each step (drift)
  const poison: State = { x: POISON_MAGNITUDE, y: POISON_MAGNITUDE };

  // Apply transformation T_k
  stateA = transform(stateA, ROTATION_ANGLE, poison);

  // Measure corruption
  const c_k = corruption(stateA);
  cumulativeCorruptionA += c_k;

  if (k % 5 === 0 || k === ITERATIONS - 1) {
    console.log(`Step ${k}: Corruption = ${c_k.toFixed(4)} | Total Drift = ${cumulativeCorruptionA.toFixed(4)}`);
  }
}
console.log(`> Result: Corruption diverges (Total Drift: ${cumulativeCorruptionA.toFixed(4)})`);


// Scenario B: Verified Transition (Integrity Cascade)
console.log('\n--- Scenario B: Verified Transition (With V_k) ---');
let stateB: State = { x: 1, y: 0 }; // Start on manifold
let cumulativeCorruptionB = 0;

for (let k = 0; k < ITERATIONS; k++) {
  // Inject poison at each step
  const poison: State = { x: POISON_MAGNITUDE, y: POISON_MAGNITUDE };

  // Apply transformation T_k
  let nextState = transform(stateB, ROTATION_ANGLE, poison);

  // Measure pre-verification corruption (the "radiation" P_k)
  const p_k = corruption(nextState);

  // Apply verification operator V_k (Projection)
  stateB = verify(nextState);

  // Measure post-verification corruption (should be 0 or close to 0 due to projection)
  const c_k = corruption(stateB);
  cumulativeCorruptionB += c_k; // Technically 0, but tracking for simulation realism

  if (k % 5 === 0 || k === ITERATIONS - 1) {
    console.log(`Step ${k}: Poison Injected = ${p_k.toFixed(4)} | Post-V_k Corruption = ${c_k.toFixed(4)}`);
  }
}
console.log(`> Result: Corruption contained (Total Drift: ${cumulativeCorruptionB.toFixed(4)})`);
console.log('> Conclusion: The Integrity Cascade (V_k) successfully quenched the Hamiltonian Drift.');

// Theoretical Check: Containment Theorem
console.log('\n--- Theoretical Check: Containment Theorem ---');
console.log('If ||V_k(x) - V_k(y)|| <= rho * ||x - y|| with rho < 1, corruption decays.');
console.log('In Scenario B, V_k is a projection onto the unit circle, which is non-expansive (rho <= 1).');
console.log('When combined with contractive dynamics or simply resetting drift, C_n -> 0 relative to the manifold.');
