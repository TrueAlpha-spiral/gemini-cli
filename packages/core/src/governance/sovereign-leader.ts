import type { SovereignAction } from './types.js';

export class SovereignViolationError extends Error {
  public readonly code = 'SOV-LEAD-001';

  constructor(message: string) {
    super(message);
    this.name = 'SovereignViolationError';
  }
}

function isBlank(v: unknown): boolean {
  return typeof v !== 'string' || v.trim().length === 0;
}

/**
 * SOV-LEAD-001 — Sovereign Leadership Invariant
 * An action is only admissible if:
 *  - authority includes a revocable token reference (revocation_ref) that is non-blank
 *  - action is anchored with a complete chain pointer (parent_hash + payload_hash), both non-blank
 */
export function validateSovereignAction(action: SovereignAction): void {
  // ---- Authority checks ----
  if (!action || !action.authority) {
    throw new SovereignViolationError(
      'SOV-LEAD-001 violation: authority is required.'
    );
  }

  if (isBlank(action.authority.revocation_ref)) {
    throw new SovereignViolationError(
      'SOV-LEAD-001 violation: authority lacks revocation capability (revocation_ref).'
    );
  }

  // ---- Anchor checks ----
  if (!('anchor' in action) || !action.anchor) {
    throw new SovereignViolationError(
      'SOV-LEAD-001 violation: action must be anchored (anchor is required).'
    );
  }

  if (isBlank((action.anchor as any).parent_hash)) {
    // message must contain "parent_hash" for the test regex
    throw new SovereignViolationError(
      'SOV-LEAD-001 violation: anchor.parent_hash is required and must be non-blank (parent_hash).'
    );
  }

  if (isBlank((action.anchor as any).payload_hash)) {
    throw new SovereignViolationError(
      'SOV-LEAD-001 violation: anchor.payload_hash is required and must be non-blank (payload_hash).'
    );
  }
}
