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
