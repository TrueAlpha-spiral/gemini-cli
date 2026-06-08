import json
import hashlib
from typing import Tuple, Dict, Any

class SovereignTraceAuditor:
    def __init__(self, genesis_anchor: str):
        """Initializes the auditor anchored to an immutable origin snapshot."""
        self.genesis_anchor = genesis_anchor

    def calculate_turn_hash(self, parent_hash: str, turn_data: Dict[str, Any]) -> str:
        """
        Computes a deterministic SHA-256 hash for a specific conversational turn.
        Binds the entry sequentially to its parent state to lock down chronological history.
        """
        turn_num = turn_data.get("turn")

        # Turn 0 represents the genesis entry point anchoring the state tree
        if turn_num == 0:
            return self.genesis_anchor

        # Extract context fields into a deterministic, reproducible string configuration
        prompt = turn_data.get("prompt", "")
        response = turn_data.get("response", "")
        nonce = turn_data.get("nonce", "")

        # Sort internal configuration maps explicitly to block arbitrary JSON ordering anomalies
        directives = json.dumps(turn_data.get("directives_snapshot", {}), sort_keys=True)

        payload = f"{parent_hash}:{turn_num}:{nonce}:{prompt}:{response}:{directives}"
        return hashlib.sha256(payload.encode('utf-8')).hexdigest()

    def audit_packet(self, raw_trace_packet: str) -> Tuple[bool, str]:
        """
        Sequentially dissects an imported session log.
        Re-hashes every turn to intercept prompt injections, tampering, or directive mutations.
        """
        try:
            packet = json.loads(raw_trace_packet)
            header = packet.get("header", {})
            history = packet.get("chain_history", [])
            final_seal = packet.get("final_seal_hash")

            # Check 1: Validate system root alignment
            if header.get("genesis_anchor") != self.genesis_anchor:
                return False, "Packet rejected: Genesis anchor misalignment."

            if not history or history[0].get("state_hash") != self.genesis_anchor:
                return False, "Lineage Corrupted at conversational Turn 0: Missing Genesis Anchor."

            current_expected_hash = self.genesis_anchor

            # Check 2: Recursive state recalculation over the sequence array
            for entry in history:
                turn_id = entry.get("turn")
                if turn_id == 0:
                    continue

                # Compute what the state hash *should* be based on the provided inputs
                computed_hash = self.calculate_turn_hash(current_expected_hash, entry)

                # Match against the declared state hash inside the session packet
                if computed_hash != entry.get("state_hash"):
                    return False, f"Lineage Corrupted at conversational Turn {turn_id}"

                # Advance the pointer to chain into the next turn index
                current_expected_hash = computed_hash

            # Check 3: Confirm final seal convergence
            if current_expected_hash != final_seal:
                return False, "Packet rejected: Final seal validation failure."

            return True, "Sovereign Trace Verified: Structural state matches ledger invariants."

        except Exception as e:
            return False, f"Structural processing failure: {str(e)}"
