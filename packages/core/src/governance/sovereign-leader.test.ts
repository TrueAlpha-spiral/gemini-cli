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
});
