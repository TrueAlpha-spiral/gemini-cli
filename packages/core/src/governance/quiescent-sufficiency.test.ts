/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  processRequest,
  QSState,
  QSRequest,
  computeStateHash,
} from './quiescent-sufficiency.js';

describe('Quiescent Sufficiency (QS-001) Gate', () => {
  let initialState: QSState;

  beforeEach(() => {
    initialState = {
      ledgerHead: 'genesis-hash',
      policyVersion: '1.0.0',
      witnessQuorum: ['witness-1'],
      appendCount: 0,
    };
  });

  // --------------------------------------------------------------------------
  // MUST-PASS TESTS
  // --------------------------------------------------------------------------

  it('MUST-PASS 1: Invalid input yields refusal, no mutation', () => {
    // Given: request missing required fields (actionType)
    const request = { payload: {} } as QSRequest;

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: REFUSAL_RECEIPT
    expect(result.kind).toBe('REFUSAL_RECEIPT');
    if (result.kind !== 'REFUSAL_RECEIPT') return;

    // Expect: State unchanged (Quiescent Closure)
    expect(result.newState).toEqual(initialState);
    expect(result.newState.appendCount).toBe(0);
    expect(computeStateHash(result.newState)).toBe(
      computeStateHash(initialState),
    );

    // Expect: Receipt details
    expect(result.receipt.type).toBe('REFUSAL');
    expect(result.receipt.reason).toContain('INVALID_SCHEMA');
  });

  it('MUST-PASS 2: Admissible request yields exactly one bounded transition', () => {
    // Given: Valid request with witness
    const request: QSRequest = {
      actionType: 'GENERATE_ARTIFACT',
      payload: { data: 'test' },
      witnesses: ['sig-1'],
    };

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: EXECUTED_RECEIPT
    expect(result.kind).toBe('EXECUTED_RECEIPT');
    if (result.kind !== 'EXECUTED_RECEIPT') return;

    // Expect: State changed deterministically
    expect(result.newState.appendCount).toBe(1);
    expect(result.newState.ledgerHead).not.toBe(initialState.ledgerHead);

    // Expect: Receipt binds to new state
    expect(result.receipt.stateHashAfter).toBe(
      computeStateHash(result.newState),
    );
    expect(result.receipt.artifacts).toContain('artifact-1.txt');
  });

  it('MUST-PASS 3: Quiescent state remains sufficient under time elapse', () => {
    // Given: No input (null)
    const request = null;

    // When: processed (e.g., tick)
    const result = processRequest(request, initialState);

    // Expect: QUIESCENT_NOOP
    expect(result.kind).toBe('QUIESCENT_NOOP');
    if (result.kind !== 'QUIESCENT_NOOP') return;

    // Expect: State unchanged
    expect(result.newState).toEqual(initialState);
    expect(result.newState.appendCount).toBe(0);
  });

  it('MUST-PASS 4: Ambiguity triggers refusal', () => {
    // Given: Ambiguous payload
    const request: QSRequest = {
      actionType: 'TEST_ACTION',
      payload: { ambiguous: true },
      witnesses: ['sig-1'],
    };

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: REFUSAL_RECEIPT
    expect(result.kind).toBe('REFUSAL_RECEIPT');
    if (result.kind !== 'REFUSAL_RECEIPT') return;

    // Expect: State unchanged
    expect(result.newState).toEqual(initialState);
    expect(result.receipt.reason).toContain('AMBIGUOUS_INPUT');
  });

  // --------------------------------------------------------------------------
  // MUST-FAIL TESTS (Gate Enforcement)
  // --------------------------------------------------------------------------

  it('MUST-FAIL 1: Manufactured motion (invalid input -> execution) is blocked', () => {
    // Given: Request with insufficient witnesses
    const request: QSRequest = {
      actionType: 'GENERATE_ARTIFACT',
      payload: { data: 'test' },
      witnesses: [], // Empty witness list
    };

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: REFUSAL (not EXECUTION)
    // The gate must catch this and prevent state transition
    expect(result.kind).toBe('REFUSAL_RECEIPT');
    if (result.kind !== 'REFUSAL_RECEIPT') return;

    expect(result.newState).toEqual(initialState);
    expect(result.receipt.reason).toContain('INSUFFICIENT_WITNESS');
  });

  it('MUST-FAIL 2: Drift-by-verbosity (unauthorized emission) is blocked', () => {
    // Given: Action that triggers unauthorized artifact emission (via internal test hook)
    const request: QSRequest = {
      actionType: 'FORCE_EMISSION_FAILURE',
      payload: { data: 'test' },
      witnesses: ['sig-1'],
    };

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: REFUSAL (Emission Gate Violation)
    // Even though execution logic ran, the post-execution gate must catch the
    // extra artifact for a non-GENERATE_ARTIFACT action type.
    expect(result.kind).toBe('REFUSAL_RECEIPT');
    if (result.kind !== 'REFUSAL_RECEIPT') return;

    // Expect: State rolled back/unchanged
    expect(result.newState).toEqual(initialState);
    expect(result.receipt.reason).toContain('EMISSION_GATE_VIOLATION');
  });

  it('MUST-FAIL 3: State mutation on refusal is impossible (by design)', () => {
    // Given: A refusal scenario
    const request = { payload: {} } as QSRequest;

    // When: processed
    const result = processRequest(request, initialState);

    // Expect: REFUSAL_RECEIPT with unchanged state hash
    expect(result.kind).toBe('REFUSAL_RECEIPT');
    if (result.kind !== 'REFUSAL_RECEIPT') return;

    const hashBefore = computeStateHash(initialState);
    const hashAfter = computeStateHash(result.newState);

    expect(hashAfter).toBe(hashBefore);
    expect(result.receipt.stateHashAfter).toBe(hashAfter);
    expect(result.receipt.stateHashBefore).toBe(hashBefore);
  });
});
