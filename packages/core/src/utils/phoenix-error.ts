/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Enumeration of PhoenixError codes representing stages of failure in the
 * self-correction and recovery lifecycle (The "Phoenix Cycle").
 */
export enum PhoenixErrorCode {
  /**
   * State corruption detected during recovery. The "Ash" (serialized state)
   * is malformed or tampered with.
   */
  ASH_INVALID = 'ASH_INVALID',

  /**
   * Unable to restart or recover due to catastrophic failure of core invariants.
   * The "Flame" cannot be reignited.
   */
  FLAME_EXTINGUISHED = 'FLAME_EXTINGUISHED',

  /**
   * Recovery sequence interrupted by external signal, timeout, or resource limit.
   */
  RISE_ABORTED = 'RISE_ABORTED',

  /**
   * System state is too old or stale to support a valid recovery.
   * The "Ember" has gone cold.
   */
  EMBER_COLD = 'EMBER_COLD',

  /**
   * General failure during the recovery process (e.g., I/O error, network failure).
   */
  REBIRTH_FAILED = 'REBIRTH_FAILED',
}

/**
 * Represents an error during the recursive self-correction or recovery process.
 * Used by the Sovereign Runtime and Mechanical Conscience.
 */
export class PhoenixError extends Error {
  constructor(
    public code: PhoenixErrorCode,
    message: string,
    public cause?: unknown
  ) {
    super(`[${code}] ${message}`);
    this.name = 'PhoenixError';

    // Maintain stack trace for debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PhoenixError);
    }
  }

  /**
   * Checks if the error is fatal (cannot be retried).
   */
  isFatal(): boolean {
    return (
      this.code === PhoenixErrorCode.FLAME_EXTINGUISHED ||
      this.code === PhoenixErrorCode.ASH_INVALID
    );
  }
}
