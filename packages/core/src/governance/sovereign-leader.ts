/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SovereignAction } from './types.js';

export class SovereignViolationError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'SovereignViolationError';
  }
}

/**
 * Validates a sovereign action against the SOV-LEAD-001 gene:
 * "LEADERSHIP_IS_REVOCABLE_BOUNDARY_AUTHORITY"
 *
 * Authority = revocation + anchoring.
 *
 * @param action The action to validate.
 * @throws SovereignViolationError if the action is not compliant.
 */
export function validateSovereignAction(action: SovereignAction): void {
  // Check Authority existence
  if (!action.authority) {
    throw new SovereignViolationError(
      'Action lacks an executing authority.',
      'MISSING_AUTHORITY'
    );
  }

  // Check Revocation Capability (Must-pass: action is executable only when accompanied by a revocable authority token)
  if (!action.authority.revocation_ref || action.authority.revocation_ref.trim() === '') {
    throw new SovereignViolationError(
      'Authority lacks revocation capability (revocation_ref). Execution forbidden.',
      'MISSING_REVOCATION'
    );
  }

  // Check Anchoring (Must-pass: action is executable only when accompanied by an anchor reference)
  if (!action.anchor) {
    throw new SovereignViolationError(
      'Action is not anchored to a verifiable history.',
      'MISSING_ANCHOR'
    );
  }

  if (!action.anchor.parent_hash) {
    throw new SovereignViolationError(
      'Anchor lacks parent_hash.',
      'INVALID_ANCHOR'
    );
  }

  if (!action.anchor.payload_hash) {
    throw new SovereignViolationError(
      'Anchor lacks payload_hash.',
      'INVALID_ANCHOR'
    );
  }

  // Check Hamiltonian Failure Forecasting (Gene: HFF-001)
  // Must-pass: action must be accompanied by a proof of low drift.
  if (!action.proof) {
    throw new SovereignViolationError(
      'Action lacks cryptographic proof (SovereignProof).',
      'MISSING_PROOF'
    );
  }

  // Hamiltonian Drift Check: Psi <= 1.0 (Must-pass)
  if (action.proof.threshold_tau > 1.0) {
    throw new SovereignViolationError(
      'Hamiltonian Drift detected (threshold_tau > 1.0). Action rejected to prevent system destabilization.',
      'HAMILTONIAN_DRIFT'
    );
  }

  // Check Recursive Self-Improvement (Gene: RSI-002)
  // Must-pass: action must be verified for sufficient resonance.
  if (!action.verification) {
    throw new SovereignViolationError(
      'Action lacks verification metrics (SovereignVerification).',
      'MISSING_VERIFICATION'
    );
  }

  // Sentient Lock Check: Phi >= 5.0 (Must-pass)
  if (action.verification.phi_score < 5.0) {
    throw new SovereignViolationError(
      'Resonance score too low (phi_score < 5.0). Action rejected by Sentient Lock.',
      'LOW_PHI_SCORE'
    );
  }
}
