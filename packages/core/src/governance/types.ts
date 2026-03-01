/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Represents the authority performing a sovereign action.
 * Must include a revocation capability (revocation_ref).
 */
export interface SovereignAuthority {
  actor_id: string;
  /**
   * Pointer to revocation record or revocation key ID.
   * This is critical for SOV-LEAD-001 compliance:
   * "Authority = revocation + anchoring"
   */
  revocation_ref: string;
}

/**
 * Represents the anchor binding the action to an immutable history.
 *
 * Enforces the Semantic Continuity Law:
 * "Each broadcast inherits from its frame of truth; no act is detached from its history."
 */
export interface SovereignAnchor {
  parent_hash: string;
  payload_hash: string;
  block_hash?: string;
}

/**
 * Represents the cryptographic proof parameters.
 */
export interface SovereignProof {
  threshold_tau: number;
}

/**
 * Represents the verification metrics.
 */
export interface SovereignVerification {
  phi_score: number;
}

/**
 * A full sovereign action structure.
 */
export interface SovereignAction {
  authority: SovereignAuthority;
  anchor: SovereignAnchor;
  proof: SovereignProof;
  verification: SovereignVerification;
}
