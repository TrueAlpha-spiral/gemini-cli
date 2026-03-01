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
      threshold_tau: 256.0,
    },
    verification: {
      phi_score: 1.618,
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

  it('MUST FAIL when cryptographic proof is missing', () => {
    const invalidAction = { ...validAction };
    // @ts-ignore - deliberately removing required field for test
    delete invalidAction.proof;

    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /cryptographic proof/
    );
  });

  it('MUST FAIL when cryptographic proof lacks valid threshold_tau', () => {
    const invalidAction: SovereignAction = {
      ...validAction,
      proof: { threshold_tau: 0 },
    };
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /valid threshold_tau/
    );
  });

  it('MUST FAIL when verification metric is missing', () => {
    const invalidAction = { ...validAction };
    // @ts-ignore - deliberately removing required field for test
    delete invalidAction.verification;

    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /verification metrics/
    );
  });

  it('MUST FAIL when verification metric lacks valid phi_score', () => {
    const invalidAction: SovereignAction = {
      ...validAction,
      verification: { phi_score: -1.0 },
    };
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      SovereignViolationError
    );
    expect(() => validateSovereignAction(invalidAction)).toThrowError(
      /valid phi_score/
    );
  });
});
