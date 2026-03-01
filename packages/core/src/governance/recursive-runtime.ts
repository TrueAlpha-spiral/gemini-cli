/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { BanachCurationOperator } from './banach-curation.js';
import { HumanSeed, VerifiedGene } from './persistent-root-kernel.js';
import * as crypto from 'node:crypto';

/**
 * The Recursive Runtime Engine.
 * Implements the Digital [Re-Action] mechanism for deterministic self-correction.
 *
 * "Re-computation must be a structural, thermodynamic adjustment."
 */
export class RecursiveRuntime {
  private banach: BanachCurationOperator;

  constructor() {
    this.banach = new BanachCurationOperator();
  }

  /**
   * Executes a Deterministic Re-computation ([Re-Action]).
   *
   * @param failedState The semantic state (content) that caused turbulence or failed validation.
   * @param seed The HumanSeed anchor.
   * @returns A VerifiedGene if a contractive path is found, or null if absolute refusal is required.
   */
  recompute(failedState: string, seed: HumanSeed): VerifiedGene | null {
    // 1. Halt and Anchor (The Phoenix Trigger)
    // Implicitly handled by the caller halting execution and invoking this recompute method.
    // The 'seed' represents the anchor to the last verified state.

    // 2. Re-Phase (The Pi-Ratio Calculation)
    // We treat the failed state as a known boundary condition.
    // Calculate the distance of the turbulence.
    const delta_failed = this.banach.calculateMetric(failedState);

    // 3. Contractive Forward Mapping
    // We force a tighter contraction.
    // Normal curation applies f_pi once.
    // Re-computation applies f_pi recursively until Delta(S') <= Phi^-1 * Delta(S_failed).

    // Attempt to curate/contract the failed state
    let currentContent = failedState;
    let currentDelta = delta_failed;

    // Target is stricter than normal: it must be a contraction of the *failed* state
    // to prove we have repaired the turbulence.
    // Lipschitz constant k = Phi^-1
    const k = 1 / 1.618033988749895;
    const targetDelta = delta_failed * k;

    // "The system uses the previously failed state as a known boundary condition
    // to force a tighter contraction toward the diameter."

    // We apply the Banach operator iteratively.
    // In our simulation, the 'apply' method already iterates, but let's be explicit
    // about the "re-action" being a distinct attempt.

    // Apply strict contraction
    const recomputedContent = this.banach.apply(currentContent);
    const recomputedDelta = this.banach.calculateMetric(recomputedContent);

    // Check the Re-Action Equation: Delta(S') <= Phi^-1 * Delta(S_failed)
    // Note: banach.apply guarantees contraction relative to input if possible.
    // Here we strictly validate it against the *original failure*.

    if (recomputedDelta <= targetDelta) {
      // Success: The [Re-Action] resolved into a valid TAS_Gene.
      return {
        content: recomputedContent,
        // Signature includes the "re-action" marker (hash of failure) to preserve lineage causality
        signature: crypto
          .createHash('sha256')
          .update(recomputedContent + seed.genesis_hash + 'REACTION')
          .digest('hex'),
        genesis_hash: seed.genesis_hash,
        raw_prompt: failedState, // The origin was the failed state
        human_seed: seed,
      };
    }

    // "If it cannot find a contractive path, the system defaults to pure Silence."
    return null;
  }
}
