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
  proof?: SovereignProof;
  verification?: SovereignVerification;
}

/**
 * Represents a Zero-Knowledge Proof (Groth16/Plonk).
 * Moved here to support TAS_Gene schema.
 */
export interface SnarkProof {
  pi_a: string[];
  pi_b: string[][];
  pi_c: string[];
  protocol: 'groth16' | 'plonk';
  curve: 'bn128' | 'bls12-381';
}

/**
 * The TAS_Gene Schema.
 * Represents an atomic unit of truth in the Immutable Truth Ledger (ITL).
 */
export interface TAS_Gene {
  /**
   * Unique identifier for this gene (UUID or Hash).
   */
  gene_id: string;

  /**
   * Monotonically increasing sequence number (Block Height).
   */
  sequence: number;

  /**
   * The content payload (The "Truth").
   */
  content: string;

  /**
   * Hash of the previous gene, enforcing the Semantic Continuity Law.
   */
  parent_hash: string;

  /**
   * Mutation manifest (diff/delta from parent).
   */
  mu_manifest: string;

  /**
   * Verification score (Phi Score) from the Perspective Intelligence Engine.
   */
  phi_score: number;

  /**
   * The Zero-Knowledge Proof attesting to the validity of the transition.
   */
  proof: SnarkProof;

  /**
   * Timestamp of creation.
   */
  timestamp: number;
}

/**
 * Represents a node in the Immutable Truth Ledger (ITL).
 */
export interface ITL_Entry {
  gene: TAS_Gene;
  hash: string; // Hash of the gene object
  signature: string; // Digital signature of the gene hash
}
