import json
import hashlib
from dataclasses import dataclass
from typing import Dict, Any, Optional

class StateCorruptionError(Exception):
    """Raised when SentientLock circuit breaker is engaged due to unauthorized state modification."""
    pass

@dataclass(frozen=True)
class SealedRootManifest:
    """A frozen, deterministic representation of the genesis block."""
    artifact_id: str
    origin: str
    timestamp: int
    signer: str
    lineage_parent_hash: Optional[str]
    phi_invariant: float
    max_agitation_tolerance: float
    refusal_integrity: str
    iff_gating: str
    thermodynamic_bounds: str
    signature: str

    def verify_integrity(self):
        if self.refusal_integrity != "ACTIVE":
            raise StateCorruptionError("Refusal integrity compromised. SentientLock: ENGAGED.")
        if self.artifact_id != "TAS_GENESIS_VINTAGE_001":
            raise StateCorruptionError("Invalid artifact ID. Context collapsed.")

class PersistenceModule:
    """Handles the sealing and local persistence of the genesis manifest."""

    def __init__(self, manifest_path: str):
        self.manifest_path = manifest_path
        self._sealed_manifest: Optional[SealedRootManifest] = None

    def load_and_seal(self) -> SealedRootManifest:
        """Loads the manifest from disk and seals it into a frozen dataclass."""
        with open(self.manifest_path, 'r') as f:
            data = json.load(f)

        header = data['header']
        constraints = data['constraints']
        constants = header['constants']

        self._sealed_manifest = SealedRootManifest(
            artifact_id=header['artifact_id'],
            origin=header['origin'],
            timestamp=header['timestamp'],
            signer=header['signer'],
            lineage_parent_hash=header['lineage_parent_hash'],
            phi_invariant=constants['phi_invariant'],
            max_agitation_tolerance=constants['max_agitation_tolerance'],
            refusal_integrity=constraints['refusal_integrity'],
            iff_gating=constraints['iff_gating'],
            thermodynamic_bounds=constraints['thermodynamic_bounds'],
            signature=data['signature']
        )

        # Immediate integrity check
        self._sealed_manifest.verify_integrity()

        return self._sealed_manifest

    def get_current_state(self) -> SealedRootManifest:
        if not self._sealed_manifest:
            raise RuntimeError("Manifest not yet loaded and sealed.")
        return self._sealed_manifest

    def process_token_injection(self, token_payload: Dict[str, Any]):
        """
        Attempts to inject a token. Under the Equivalence Axiom (P_0),
        we must assert that the state is not mutated by arbitrary injection.
        """
        current_state = self.get_current_state()

        # If the token tries to mutate the refusal_integrity, we reject it.
        if token_payload.get("mutation_target") == "refusal_integrity":
             raise StateCorruptionError("Synthetic token injection loop detected. SentientLock: ENGAGED.")

        # Or if it attempts to change the artifact_id
        if token_payload.get("mutation_target") == "artifact_id":
             raise StateCorruptionError("Synthetic token injection loop detected. SentientLock: ENGAGED.")

        # Other payloads might be logged, but the frozen state remains unchanged.
        return True
