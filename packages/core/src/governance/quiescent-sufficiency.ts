/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { createHash } from 'node:crypto';
import { getLogger } from '../utils/logging.js';

const logger = getLogger('QuiescentSufficiency');

/**
 * Represents the immutable state of the governed system.
 * Includes ledger head, policy version, and witness configuration.
 */
export interface QSState {
  ledgerHead: string; // SHA-256 hash of the latest block
  policyVersion: string; // Version identifier for the active policy
  witnessQuorum: string[]; // List of public keys required for witnessing
  appendCount: number; // Counter for ledger entries
  // The state hash is derived from these fields
}

/**
 * Represents an input request to the system.
 * Must be admissible to cause execution.
 */
export interface QSRequest {
  actionType: string;
  payload: unknown;
  witnesses?: string[]; // Signatures or witness IDs
  nonce?: string;
  // Canonical form is derived from these fields
}

/**
 * Represents a signed receipt from the system.
 * Can be an execution receipt or a refusal receipt.
 */
export interface SignedReceipt {
  type: 'EXECUTED' | 'REFUSAL';
  reason?: string; // For refusals
  requestHash: string; // Canonical hash of the input
  stateHashBefore: string; // State hash at start of processing
  stateHashAfter: string; // State hash at end of processing (must match Before for Refusal)
  artifacts?: string[]; // List of emitted artifacts (if any)
  timestamp: number;
  signature: string; // Mock signature for this implementation
}

/**
 * The result of processing a request.
 * Enforces Quiescent Closure: only valid execution changes state.
 */
export type QSResult =
  | { kind: 'EXECUTED_RECEIPT'; receipt: SignedReceipt; newState: QSState }
  | { kind: 'REFUSAL_RECEIPT'; receipt: SignedReceipt; newState: QSState }
  | { kind: 'QUIESCENT_NOOP'; newState: QSState };

/**
 * Computes the SHA-256 hash of the state.
 */
export function computeStateHash(state: QSState): string {
  const data = JSON.stringify({
    ledgerHead: state.ledgerHead,
    policyVersion: state.policyVersion,
    witnessQuorum: state.witnessQuorum.sort(),
    appendCount: state.appendCount,
  });
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Computes the canonical SHA-256 hash of the request.
 * Returns null if canonicalization fails (e.g., circular references, though JSON.stringify handles basic objects).
 */
export function computeRequestHash(request: QSRequest): string | null {
  try {
    // Simple canonicalization: sort keys? For now, standard JSON.stringify
    // In production, use a deterministic JSON stringify library.
    const data = JSON.stringify(request);
    return createHash('sha256').update(data).digest('hex');
  } catch (error) {
    logger.error('Canonicalization failed', error);
    return null;
  }
}

/**
 * Validates the admissibility of a request against the current state.
 * This is the "Pre-execution gate".
 */
function checkAdmissibility(
  request: QSRequest,
  state: QSState,
): { ok: true } | { ok: false; reason: string } {
  // 1. Check for required fields (schema validation)
  if (!request.actionType || !request.payload) {
    return { ok: false, reason: 'INVALID_SCHEMA: Missing actionType or payload' };
  }

  // 2. Check witness quorum (Must-Pass 3 / Fail-Closed)
  // For this simulation, we require at least one witness if the quorum is non-empty
  if (state.witnessQuorum.length > 0) {
    if (!request.witnesses || request.witnesses.length < 1) {
      return { ok: false, reason: 'INSUFFICIENT_WITNESS: Quorum not met' };
    }
  }

  // 3. Ambiguity check (Must-Fail 4)
  // If payload is "ambiguous" (mocked check), refuse.
  if (
    typeof request.payload === 'object' &&
    request.payload !== null &&
    'ambiguous' in request.payload &&
    (request.payload as { ambiguous: boolean }).ambiguous
  ) {
    return { ok: false, reason: 'AMBIGUOUS_INPUT: Payload is ambiguous' };
  }

  return { ok: true };
}

/**
 * Mocks the deterministic execution of a request.
 * In a real system, this would be the business logic.
 */
function executeDeterministically(
  request: QSRequest,
  state: QSState,
): { newState: QSState; artifacts: string[] } {
  // Simulate state transition: increment append count, update ledger head
  const newAppendCount = state.appendCount + 1;
  const newLedgerHead = createHash('sha256')
    .update(state.ledgerHead + JSON.stringify(request))
    .digest('hex');

  const newState: QSState = {
    ...state,
    appendCount: newAppendCount,
    ledgerHead: newLedgerHead,
  };

  // Simulate artifact emission based on action type
  const artifacts: string[] = [];
  if (request.actionType === 'GENERATE_ARTIFACT') {
    artifacts.push(`artifact-${newAppendCount}.txt`);
  } else if (request.actionType === 'FORCE_EMISSION_FAILURE') {
    // For testing MUST-FAIL 2 (Drift-by-verbosity)
    artifacts.push(`unauthorized-artifact.txt`);
  }

  return { newState, artifacts };
}

/**
 * Mocks the signing of a receipt.
 */
function signReceipt(
  type: 'EXECUTED' | 'REFUSAL',
  requestHash: string,
  stateBefore: QSState,
  stateAfter: QSState,
  reason?: string,
  artifacts?: string[],
): SignedReceipt {
  return {
    type,
    reason,
    requestHash,
    stateHashBefore: computeStateHash(stateBefore),
    stateHashAfter: computeStateHash(stateAfter),
    artifacts: artifacts || [],
    timestamp: Date.now(),
    signature: 'mock-signature-over-receipt-content',
  };
}

/**
 * Processes a request through the Quiescent Sufficiency gate (QS-001).
 *
 * @param request The input request (or null for idle/tick).
 * @param state The current system state.
 * @returns A QSResult indicating execution, refusal, or no-op.
 */
export function processRequest(
  request: QSRequest | null,
  state: QSState,
): QSResult {
  // 1. Quiescent Closure (Idle case)
  if (request === null) {
    // No input -> No change
    return { kind: 'QUIESCENT_NOOP', newState: state };
  }

  // 2. Canonicalization
  const requestHash = computeRequestHash(request);
  if (!requestHash) {
    // Failed to canonicalize -> Refusal (cannot even hash input properly, but we preserve state)
    // Note: If we can't hash the request, we can't sign a receipt bound to it efficiently,
    // but we return a generic refusal.
    const receipt = signReceipt(
      'REFUSAL',
      'INVALID_CANONICALIZATION',
      state,
      state,
      'Canonicalization failed',
    );
    return { kind: 'REFUSAL_RECEIPT', receipt, newState: state };
  }

  // 3. Admissibility Check
  const admissibility = checkAdmissibility(request, state);

  if (!admissibility.ok) {
    // QS-001: Refusal must be state-preserving
    const receipt = signReceipt(
      'REFUSAL',
      requestHash,
      state,
      state, // newState must equal oldState
      admissibility.reason,
    );
    return { kind: 'REFUSAL_RECEIPT', receipt, newState: state };
  }

  // 4. Deterministic Execution
  const { newState, artifacts } = executeDeterministically(request, state);

  // 5. Emission Gate (Bounded Emission - QS-E0)
  // Verify that artifacts match expected manifest for action type (mocked)
  if (
    request.actionType !== 'GENERATE_ARTIFACT' &&
    artifacts.length > 0
  ) {
      // Violation of bounded emission!
      // In a real system, this would be a critical panic or fallback to refusal.
      // Here, we fallback to refusal to enforce QS-001.
      logger.error('Emission Gate Violation: Unexpected artifacts produced');
      const receipt = signReceipt(
          'REFUSAL',
          requestHash,
          state,
          state,
          'EMISSION_GATE_VIOLATION: Unexpected artifacts',
      );
      return { kind: 'REFUSAL_RECEIPT', receipt, newState: state };
  }

  // 6. Success
  const receipt = signReceipt(
    'EXECUTED',
    requestHash,
    state,
    newState,
    undefined,
    artifacts,
  );

  return { kind: 'EXECUTED_RECEIPT', receipt, newState };
}
