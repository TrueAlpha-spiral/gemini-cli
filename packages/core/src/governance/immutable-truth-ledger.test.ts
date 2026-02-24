/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ITL_Node } from './immutable-truth-ledger.js';
import { TAS_Gene, SnarkProof } from './types.js';
import { PhoenixError, PhoenixErrorCode } from '../utils/phoenix-error.js';
import { createHash } from 'crypto';

describe('ITL_Node', () => {
  let itl: ITL_Node;

  const mockProof: SnarkProof = {
    pi_a: ['0x1'],
    pi_b: [['0x2']],
    pi_c: ['0x3'],
    protocol: 'groth16',
    curve: 'bn128',
  };

  const createGene = (
    id: string,
    sequence: number,
    parentHash: string,
    content: string = 'test-content',
    proof: SnarkProof = mockProof
  ): TAS_Gene => ({
    gene_id: id,
    sequence,
    content,
    parent_hash: parentHash,
    mu_manifest: 'diff',
    phi_score: 0.99,
    timestamp: 1234567890,
    proof,
  });

  // Helper to calculate expected hash manually for verification
  const calculateHash = (gene: TAS_Gene): string => {
    const payload = [
      gene.gene_id,
      gene.sequence,
      gene.content,
      gene.parent_hash,
      gene.mu_manifest,
      gene.phi_score,
      gene.timestamp,
    ].join('|');
    return createHash('sha256').update(payload).digest('hex');
  };

  beforeEach(() => {
    itl = new ITL_Node();
  });

  it('should initialize with an empty ledger', () => {
    expect(itl.getHistory()).toHaveLength(0);
    expect(itl.getTip()).toBeNull();
  });

  it('should append the first gene (Genesis) successfully', () => {
    const genesisGene = createGene('genesis', 0, '0x0000000000000000');
    itl.append(genesisGene);

    expect(itl.getHistory()).toHaveLength(1);
    const tip = itl.getTip();
    expect(tip).toBeDefined();
    expect(tip?.gene).toEqual(genesisGene);
    expect(tip?.hash).toBe(calculateHash(genesisGene));
  });

  it('should append a second gene with correct parent hash', () => {
    const genesisGene = createGene('genesis', 0, '0x0000000000000000');
    itl.append(genesisGene);
    const genesisHash = itl.getTip()!.hash;

    const gene1 = createGene('gene-1', 1, genesisHash);
    itl.append(gene1);

    expect(itl.getHistory()).toHaveLength(2);
    expect(itl.getTip()?.gene).toEqual(gene1);
  });

  it('should throw FLAME_EXTINGUISHED (Semantic Continuity Violation) for incorrect parent hash', () => {
    const genesisGene = createGene('genesis', 0, '0x0000000000000000');
    itl.append(genesisGene);

    const gene1 = createGene('gene-1', 1, '0xINVALID_PARENT_HASH');

    try {
      itl.append(gene1);
    } catch (error) {
      expect(error).toBeInstanceOf(PhoenixError);
      expect((error as PhoenixError).code).toBe(
        PhoenixErrorCode.FLAME_EXTINGUISHED
      );
      expect((error as Error).message).toContain(
        'Semantic Continuity Violation'
      );
    }
  });

  it('should throw ASH_INVALID (Sequence Violation) for incorrect sequence number', () => {
    const genesisGene = createGene('genesis', 0, '0x0000000000000000');
    itl.append(genesisGene);
    const genesisHash = itl.getTip()!.hash;

    // Sequence should be 1, but we provide 5
    const gene1 = createGene('gene-1', 5, genesisHash);

    try {
      itl.append(gene1);
    } catch (error) {
      expect(error).toBeInstanceOf(PhoenixError);
      expect((error as PhoenixError).code).toBe(PhoenixErrorCode.ASH_INVALID);
      expect((error as Error).message).toContain('Sequence Violation');
    }
  });

  it('should verify the integrity of a valid chain', () => {
    const g0 = createGene('g0', 0, '0x0');
    itl.append(g0);
    const h0 = itl.getTip()!.hash;

    const g1 = createGene('g1', 1, h0);
    itl.append(g1);
    const h1 = itl.getTip()!.hash;

    const g2 = createGene('g2', 2, h1);
    itl.append(g2);

    expect(itl.verifyChain()).toBe(true);
  });
});
