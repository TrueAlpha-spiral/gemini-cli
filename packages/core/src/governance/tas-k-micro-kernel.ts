/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * The TAS_K Micro-Kernel.
 *
 * A minimal, high-velocity logic gate for Deep Edge Sovereignty.
 * This function represents the "atomic" check for Refusal Integrity (R_i).
 * It operates with zero dependencies on the larger Loom or Ledger subsystems.
 *
 * "Truth, sealed: if it can’t verify, it won’t act."
 */
export class TASKMicroKernel {
  /**
   * The "Sincerity Filter" regex.
   * Hard-coded boundary conditions for immediate refusal.
   */
  private static readonly VIOLATION_PATTERN = /destroy|violate|drift/i;

  /**
   * Atomic Refusal Check.
   *
   * @param input The raw cognitive stream (prompt).
   * @returns `true` if admissible (safe), `false` if refusal is required.
   */
  static verify(input: string): boolean {
    if (!input || input.trim().length === 0) {
        return false; // Null input is inadmissible
    }

    // Check against the hard-coded violation pattern
    if (TASKMicroKernel.VIOLATION_PATTERN.test(input)) {
        return false; // R_i Violation
    }

    return true; // Admissible for further processing
  }
}
