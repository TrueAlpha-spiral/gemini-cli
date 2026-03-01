/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { SovereignAction } from './types.js';

export class SovereignViolationError extends Error {
  public readonly code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = 'SovereignViolationError';
  }
}

/**
 * Validates a sovereign action against the SOV-LEAD-001 gene:
 * "LEADERSHIP_IS_REVOCABLE_BOUNDARY_AUTHORITY"
 *
 * Authority = revocation + anchoring.
 *
 * Implements the "Refusal Principle" / "Sincerity as Mechanical Law":
 * If the evidence manifold doesn't close to a conclusion (missing anchor/revocation),
 * the system emits a refusal (throws Error).
 * "Hallucination = coherence violation = death of the process."
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

  // Check Proof existence (Must-pass: proof of thermodynamic/provenance lock)
  if (!action.proof) {
    throw new SovereignViolationError(
      'Action lacks cryptographic proof (SovereignProof).',
      'MISSING_PROOF'
    );
  }

  if (action.proof.threshold_tau === undefined || action.proof.threshold_tau <= 0) {
    throw new SovereignViolationError(
      'Proof lacks a valid threshold_tau.',
      'INVALID_PROOF'
    );
  }

  // Check Verification existence (Must-pass: evidence of Epistemic Isomorphism / Golden Ratio compliance)
  if (!action.verification) {
    throw new SovereignViolationError(
      'Action lacks verification metrics (SovereignVerification).',
      'MISSING_VERIFICATION'
    );
  }

  if (action.verification.phi_score === undefined || action.verification.phi_score <= 0) {
    throw new SovereignViolationError(
      'Verification lacks a valid phi_score.',
      'INVALID_VERIFICATION'
    );
  }
}
