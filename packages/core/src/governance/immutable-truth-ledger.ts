/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'node:crypto';
import { VerifiedGene } from './persistent-root-kernel.js';
import { SnarkProof } from './zk-snark.js';

/**
 * Represents the Zero-Knowledge Metadata for a committed gene.
 * "The Vintage Log, not the liquid."
 */
export interface GeneReceipt {
  /**
   * The Form Hash (H_f): SHA256(Content + H_0 + T).
   * Proof of content integrity without revealing content.
   */
  form_hash: string;

  /**
   * The Function Score (H_u): Ethical alignment score (0.0 - 1.0).
   */
  function_score: number;

  /**
   * The Geometry (H_a): Turning radius/curvature of the reasoning path.
   * "No free lunch scaling."
   */
  geometry_curvature: number;

  /**
   * The ZK-Proof: Mathematical guarantee of causal link and absence of hallucination.
   */
  zk_proof: SnarkProof;

  /**
   * Timestamp of the commitment.
   */
  timestamp: number;
}

/**
 * Represents a Negative Proof (Refusal).
 * "Mapping the Void."
 */
export interface RefusalReceipt {
  /**
   * The node where the trajectory was violated.
   */
  node_id: string;

  /**
   * The reason for refusal (e.g., "Trajectory violation").
   */
  reason: string;

  /**
   * The required curvature that was violated.
   */
  violation_delta: number;

  /**
   * Timestamp of the refusal.
   */
  timestamp: number;
}

/**
 * The Immutable Truth Ledger (ITL).
 * Records the epistemic lineage of TAS_Genes.
 */
export class ImmutableTruthLedger {
  // In a real system, this would be a connection to a decentralized ledger (blockchain/DAG).
  // For this simulation, we log to an in-memory array or console.
  private ledger: (GeneReceipt | RefusalReceipt)[] = [];

  /**
   * Commits a verified gene receipt to the ledger.
   * "The Vintage Log."
   */
  async commitReceipt(gene: VerifiedGene, proof: SnarkProof): Promise<GeneReceipt> {
    // 1. Calculate Form Hash (H_f)
    const formHash = crypto
      .createHash('sha256')
      .update(gene.content + gene.genesis_hash + Date.now().toString())
      .digest('hex');

    // 2. Simulate Function Score and Geometry
    // In a real TKE, these would be calculated during the curation phase.
    const receipt: GeneReceipt = {
      form_hash: formHash,
      function_score: 0.982, // Simulated high alignment
      geometry_curvature: 0.618, // Golden Ratio curvature
      zk_proof: proof,
      timestamp: Date.now(),
    };

    this.ledger.push(receipt);
    // console.log(`[ITL] Committed Gene Receipt: ${formHash.substring(0, 8)}`);
    return receipt;
  }

  /**
   * Commits a refusal (Negative Proof) to the ledger.
   * "Proves the system is capable of saying 'No'."
   */
  async commitRefusal(reason: string, delta: number): Promise<RefusalReceipt> {
    const receipt: RefusalReceipt = {
      node_id: crypto.randomUUID(),
      reason: reason,
      violation_delta: delta,
      timestamp: Date.now(),
    };

    this.ledger.push(receipt);
    // console.log(`[ITL] Committed Refusal: ${reason}`);
    return receipt;
  }

  /**
   * Retrieves the current ledger state (for testing/auditing).
   */
  getLedger(): ReadonlyArray<GeneReceipt | RefusalReceipt> {
    return this.ledger;
  }
}
