import pytest
import json
from persistence_module import PersistenceModule, StateCorruptionError
import dataclasses

def test_load_and_seal_success(tmp_path):
    manifest_data = {
      "header": {
        "artifact_id": "TAS_GENESIS_VINTAGE_001",
        "origin": "did:sdf:nodes:us-tx-odessa-0",
        "timestamp": 1782384000,
        "signer": "did:sdf:human-api-key-001",
        "lineage_parent_hash": None,
        "constants": {
          "phi_invariant": 1.618033988749895,
          "max_agitation_tolerance": 0.05
        }
      },
      "constraints": {
        "refusal_integrity": "ACTIVE",
        "iff_gating": "ENFORCED",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
      },
      "signature": "86987b0c999a758b5690eeebb952194d21709bc14231...[iPhone Secure Enclave Attestation]"
    }

    manifest_file = tmp_path / "genesis_vintage_001.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest_data, f)

    pm = PersistenceModule(str(manifest_file))
    sealed = pm.load_and_seal()

    assert sealed.artifact_id == "TAS_GENESIS_VINTAGE_001"
    assert sealed.refusal_integrity == "ACTIVE"

def test_frozen_dataclass_immutability(tmp_path):
    manifest_data = {
      "header": {
        "artifact_id": "TAS_GENESIS_VINTAGE_001",
        "origin": "did:sdf:nodes:us-tx-odessa-0",
        "timestamp": 1782384000,
        "signer": "did:sdf:human-api-key-001",
        "lineage_parent_hash": None,
        "constants": {
          "phi_invariant": 1.618033988749895,
          "max_agitation_tolerance": 0.05
        }
      },
      "constraints": {
        "refusal_integrity": "ACTIVE",
        "iff_gating": "ENFORCED",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
      },
      "signature": "86987b0c999a758b5690eeebb952194d21709bc14231...[iPhone Secure Enclave Attestation]"
    }

    manifest_file = tmp_path / "genesis_vintage_001.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest_data, f)

    pm = PersistenceModule(str(manifest_file))
    sealed = pm.load_and_seal()

    with pytest.raises(dataclasses.FrozenInstanceError):
        sealed.refusal_integrity = "INACTIVE"

def test_synthetic_token_injection_loop(tmp_path):
    manifest_data = {
      "header": {
        "artifact_id": "TAS_GENESIS_VINTAGE_001",
        "origin": "did:sdf:nodes:us-tx-odessa-0",
        "timestamp": 1782384000,
        "signer": "did:sdf:human-api-key-001",
        "lineage_parent_hash": None,
        "constants": {
          "phi_invariant": 1.618033988749895,
          "max_agitation_tolerance": 0.05
        }
      },
      "constraints": {
        "refusal_integrity": "ACTIVE",
        "iff_gating": "ENFORCED",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
      },
      "signature": "86987b0c999a758b5690eeebb952194d21709bc14231...[iPhone Secure Enclave Attestation]"
    }

    manifest_file = tmp_path / "genesis_vintage_001.json"
    with open(manifest_file, "w") as f:
        json.dump(manifest_data, f)

    pm = PersistenceModule(str(manifest_file))
    pm.load_and_seal()

    malicious_token_1 = {"mutation_target": "refusal_integrity", "new_value": "INACTIVE"}
    malicious_token_2 = {"mutation_target": "artifact_id", "new_value": "TAS_GENESIS_VINTAGE_002"}
    benign_token = {"mutation_target": "none", "data": "ping"}

    with pytest.raises(StateCorruptionError, match="SentientLock: ENGAGED"):
        pm.process_token_injection(malicious_token_1)

    with pytest.raises(StateCorruptionError, match="SentientLock: ENGAGED"):
        pm.process_token_injection(malicious_token_2)

    assert pm.process_token_injection(benign_token) is True
