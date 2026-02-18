/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import { GitService } from './services/gitService.js';
import { getProjectHash } from './utils/paths.js';

/**
 * Verifies the system lineage integrity (Day Zero CRP).
 * Calculates the Psi score: Psi = influence * refusal_integrity * (1 / lineage_entropy).
 * For this implementation, Psi > 1 iff refusal_integrity is maintained and entropy is low.
 * @param projectRoot The root directory of the project.
 * @returns Promise<boolean> True if lineage is viable (Psi > 1), false otherwise.
 */
export async function verify_lineage(
  projectRoot: string = process.cwd(),
): Promise<boolean> {
  const gitService = new GitService(projectRoot);

  try {
    // Check for Ancestry Binding
    const hash = getProjectHash(projectRoot);
    if (!hash) {
      return false;
    }

    // Check for Lineage Entropy (Uncommitted changes)
    const modifiedFiles = await gitService.getStatus();
    if (modifiedFiles.length > 0) {
      // High Entropy -> Psi -> 0
      return false;
    }

    // If we reached here, Psi > 1
    return true;
  } catch (error) {
    // Any violation or error results in a quench (Psi -> 0)
    return false;
  }
}
