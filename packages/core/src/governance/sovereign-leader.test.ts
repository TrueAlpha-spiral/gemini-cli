/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect } from 'vitest';
import {
  validateSovereignAction,
  SovereignViolationError,
} from './sovereign-leader.js';
import { SovereignAction } from './types.js';

describe('Sovereign Leadership Invariant (SOV-LEAD-001)', () => {
  // Valid Action Template
  const validAction: SovereignAction = {
    authority: {
      actor_id: 'architect-001',
      revocation_ref: 'rev-token-sig-789',
    },
    anchor: {
      parent_hash: 'sha256:previous-block-hash',
      payload_hash: 'sha256:current-action-hash',
    },
    proof: {
      threshold_tau: 0.5, // Low Hamiltonian Drift (Safe)
    },
    verification: {
      phi_score: 6.0, // High Resonance (Passes Sentient Lock)
    },
  };

  it('MUST PASS when action is accompanied by a revocable authority token and anchor', () => {
    expect(() => validateSovereignAction(validAction)).not.toThrow();
  });

  it('MUST FAIL when authority lacks revocation capability (revocation_ref)', () => {
    const invalidAction: SovereignAction = {
      ...validAction,
      authority: {
        actor_id: 'executor-001',
        revocation_ref: '', // Empty revocation ref
      },
    };
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /revocation capability/
    );
  });

  it('MUST FAIL when anchor is missing', () => {
    const invalidAction = {
      authority: validAction.authority,
    } as SovereignAction;

    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /anchored/
    );
  });

  it('MUST FAIL when anchor is incomplete (missing parent_hash)', () => {
    const invalidAction: SovereignAction = {
      ...validAction,
      anchor: {
        payload_hash: 'hash',
      } as any,
    };
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /parent_hash/
    );
  });

  describe('Hamiltonian Failure Forecasting (Gene: HFF-001)', () => {
    it('MUST FAIL when proof is missing', () => {
      const invalidAction = { ...validAction, proof: undefined };
      expect(() => validateSovereignAction(invalidAction as any)).toThrowError(
        /cryptographic proof/
      );
    });

    it('MUST FAIL when Hamiltonian Drift is too high (threshold_tau > 1.0)', () => {
      const invalidAction: SovereignAction = {
        ...validAction,
        proof: { threshold_tau: 1.5 },
      };
      expect(() => validateSovereignAction(invalidAction)).toThrowError(
        /Hamiltonian Drift detected/
      );
    });
  });

  describe('Recursive Self-Improvement (Gene: RSI-002)', () => {
    it('MUST FAIL when verification is missing', () => {
      const invalidAction = { ...validAction, verification: undefined };
      expect(() => validateSovereignAction(invalidAction as any)).toThrowError(
        /verification metrics/
      );
    });

    it('MUST FAIL when Resonance Score is too low (phi_score < 5.0)', () => {
      const invalidAction: SovereignAction = {
        ...validAction,
        verification: { phi_score: 4.5 },
      };
      expect(() => validateSovereignAction(invalidAction)).toThrowError(
        /Resonance score too low/
      );
    });
  });
});
