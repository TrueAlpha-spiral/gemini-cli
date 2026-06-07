import hashlib
import json
import sys
from typing import Dict, Any, Tuple

class SovereignTraceAuditor:
    def __init__(self, expected_genesis_root: str):
        """Initializes the auditor with the absolute system baseline anchor."""
        self.expected_genesis_root = expected_genesis_root

    def _canonical_hash(self, turn_data: Dict[str, Any]) -> str:
        """Enforces a strict, lexicographically sorted json string format for hashing."""
        serialized = json.dumps(turn_data, sort_keys=True, separators=(',', ':'))
        return hashlib.sha256(serialized.encode('utf-8')).hexdigest()

    def audit_packet(self, packet_json_str: str) -> Tuple[bool, str]:
        """
        Reconstructs the trace step-by-step from raw block data.
        Returns a (success_status, diagnostic_msg) tuple.
        """
        try:
            data = json.loads(packet_json_str)

            # 1. Extract and Validate Top-Level Envelope
            header = data.get("header", {})
            chain_history = data.get("chain_history", [])
            final_seal_hash = data.get("final_seal_hash")

            if not header or not chain_history or not final_seal_hash:
                return False, "Broke Structural Envelope Invariant: Missing packet fields."

            # 2. Assert Genesis Anchor Match
            genesis_block = chain_history[0]
            if genesis_block.get("state_hash") != self.expected_genesis_root:
                return False, f"Genesis Mismatch. Target: {self.expected_genesis_root[:12]}, Observed: {genesis_block.get('state_hash')[:12]}"

            running_hash = self.expected_genesis_root
            total_turns = len(chain_history)

            # 3. Step-by-Step Trajectory Replay
            # Index 0 is the static anchor block. Actual data loops begin at Index 1.
            for i in range(1, total_turns):
                block = chain_history[i]

                # Extract conversational and primitive inputs used to generate the nonce
                observed_nonce = block.get("nonce")
                observed_state_hash = block.get("state_hash")

                # Reconstruct the exact structured turn dict used during the live loop
                reconstructed_turn_payload = {
                    "previous_hash": running_hash,
                    "nonce": observed_nonce,
                    "prompt": block.get("prompt"),
                    "response": block.get("response"),
                    "directives_snapshot": block.get("directives_snapshot")
                }

                # Calculate the deterministic hash of the reconstructed payload
                calculated_hash = self._canonical_hash(reconstructed_turn_payload)

                # Biconditional Invariant Match Check
                if calculated_hash != observed_state_hash:
                    return False, f"Lineage Corrupted at conversational Turn {i}. Hash calculation split."

                # Update tracking pointer for next block linkage assessment
                running_hash = calculated_hash

            # 4. Final Seal Validation
            if running_hash != final_seal_hash:
                return False, "Trace Verification Error: Reconstructed sequence mismatch with packet final seal."

            return True, f"Sovereign Trace Verified. {total_turns - 1} computational execution turns authentic."

        except Exception as e:
            return False, f"Auditor System Abort: Fatal exception parsing trace tracking logs. Details: {str(e)}"
