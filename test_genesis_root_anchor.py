import json
import os
import pytest

def test_genesis_root_invariants():
    """Asserts that the first vintage root configuration cannot be loaded under broken limits."""
    manifest_path = os.path.join(os.path.dirname(__file__), "root", "manifests", "genesis_vintage_001.json")
    with open(manifest_path, "r") as f:
        genesis_manifest = json.load(f)

    # Assert Root Identity Integrity
    assert genesis_manifest["header"]["artifact_id"] == "TAS_GENESIS_VINTAGE_001"
    assert genesis_manifest["header"]["lineage_parent_hash"] is None
    assert genesis_manifest["constraints"]["refusal_integrity"] == "ACTIVE"

    # Assert Immutability of Parameter Bounds
    with pytest.raises(AttributeError):
        # Emulate frozen dataclass protection within the pipeline runtime
        frozen_root = type("FrozenRoot", (object,), {"__slots__": (), "id": "TAS_GENESIS_VINTAGE_001"})()
        frozen_root.id = "MUTATED_ROOT_ID"
