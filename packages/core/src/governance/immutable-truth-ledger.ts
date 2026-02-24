/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'crypto';
import { TAS_Gene, ITL_Entry } from './types.js';
import { PhoenixError, PhoenixErrorCode } from '../utils/phoenix-error.js';

/**
 * The Immutable Truth Ledger (ITL) Node.
 * Manages the append-only history of Sovereign Actions and enforcing the
 * Semantic Continuity Law ("Each broadcast inherits from its frame of truth").
 */
export class ITL_Node {
  private ledger: ITL_Entry[] = [];

  constructor() {
    // Initialize with a Genesis Gene if empty?
    // For now, we assume the first append must be the Genesis or linked to a known root.
  }

  /**
   * Appends a new TAS_Gene to the ledger, enforcing integrity constraints.
   * @param gene The gene to append.
   * @throws PhoenixError if integrity or continuity is violated.
   */
  append(gene: TAS_Gene): void {
    // 1. Calculate the hash of the gene content
    const currentHash = this.calculateHash(gene);

    // 2. Check for Genesis Condition (First Entry)
    if (this.ledger.length === 0) {
      // In a real system, we might verify against a hardcoded Genesis Hash.
      // For now, we accept the first entry as the root if valid.
      this.ledger.push({
        gene,
        hash: currentHash,
        signature: 'genesis-signature-placeholder',
      });
      return;
    }

    // 3. Enforce Semantic Continuity Law
    const lastEntry = this.ledger[this.ledger.length - 1];

    // Check Parent Hash Linkage
    if (gene.parent_hash !== lastEntry.hash) {
      throw new PhoenixError(
        PhoenixErrorCode.FLAME_EXTINGUISHED,
        `Semantic Continuity Violation: Gene ${gene.gene_id} parent_hash (${gene.parent_hash}) does not match previous tip (${lastEntry.hash}).`
      );
    }

    // Check Sequence Monotonicity
    if (gene.sequence !== lastEntry.gene.sequence + 1) {
      throw new PhoenixError(
        PhoenixErrorCode.ASH_INVALID,
        `Sequence Violation: Expected ${lastEntry.gene.sequence + 1}, got ${gene.sequence}.`
      );
    }

    // 4. Verify Integrity (Simulated)
    // In a real system, we would verify the ZK Proof here.
    if (!gene.proof) {
       throw new PhoenixError(
        PhoenixErrorCode.ASH_INVALID,
        `Missing ZK Proof for gene ${gene.gene_id}.`
      );
    }

    // 5. Commit to Ledger
    this.ledger.push({
      gene,
      hash: currentHash,
      signature: `sig-${currentHash.substring(0, 8)}`, // Simulated signature
    });
  }

  /**
   * Retrives the current tip (latest entry) of the ledger.
   */
  getTip(): ITL_Entry | null {
    if (this.ledger.length === 0) {
      return null;
    }
    return this.ledger[this.ledger.length - 1];
  }

  /**
   * Retrieves the full history.
   */
  getHistory(): ITL_Entry[] {
    return [...this.ledger];
  }

  /**
   * Verifies the integrity of the entire chain.
   * @returns True if valid, throws PhoenixError otherwise.
   */
  verifyChain(): boolean {
    if (this.ledger.length === 0) return true;

    for (let i = 1; i < this.ledger.length; i++) {
      const prev = this.ledger[i - 1];
      const curr = this.ledger[i];

      if (curr.gene.parent_hash !== prev.hash) {
        throw new PhoenixError(
          PhoenixErrorCode.FLAME_EXTINGUISHED,
          `Chain Integrity Failure at index ${i}: Parent Hash Mismatch.`
        );
      }

      const calculatedHash = this.calculateHash(curr.gene);
      if (curr.hash !== calculatedHash) {
         throw new PhoenixError(
          PhoenixErrorCode.ASH_INVALID,
          `Chain Integrity Failure at index ${i}: Content Hash Mismatch.`
        );
      }
    }
    return true;
  }

  /**
   * Calculates the SHA-256 hash of a TAS_Gene.
   * Note: This strictly serializes the gene properties to ensure deterministic hashing.
   */
  private calculateHash(gene: TAS_Gene): string {
    // Create a deterministic string representation
    // Order matters!
    const payload = [
      gene.gene_id,
      gene.sequence,
      gene.content,
      gene.parent_hash,
      gene.mu_manifest,
      gene.phi_score,
      gene.timestamp
    ].join('|');

    return createHash('sha256').update(payload).digest('hex');
  }
}
