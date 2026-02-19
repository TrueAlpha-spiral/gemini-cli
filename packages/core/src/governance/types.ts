export type SovereignAction = {
  authority: {
    actor_id: string;
    revocation_ref: string; // must be present + non-blank for SOV-LEAD-001
  };
  anchor: {
    parent_hash: string;
    payload_hash: string;
  };
};

/**
 * Interface for checking if a revocation reference is active.
 */
export interface RevocationRegistry {
  isRevoked(revocation_ref: string): boolean;
}
