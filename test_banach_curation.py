import pytest
from persistence_module import SealedRootManifest, StateCorruptionError
from banach_curation import BanachCurationEngine

@pytest.fixture
def base_state():
    return SealedRootManifest(
        artifact_id="TAS_GENESIS_VINTAGE_001",
        origin="did:sdf:nodes:us-tx-odessa-0",
        timestamp=1782384000,
        signer="did:sdf:human-api-key-001",
        lineage_parent_hash=None,
        phi_invariant=1.618033988749895,
        max_agitation_tolerance=0.05,
        refusal_integrity="ACTIVE",
        iff_gating="ENFORCED",
        thermodynamic_bounds="ZERO_ENTROPY_DELTA",
        signature="86987b0c999a758b5690eeebb952194d21709bc14231..."
    )

def test_banach_curation_identical_trajectory(base_state):
    engine = BanachCurationEngine(base_state)
    proposal = {
        "artifact_id": "TAS_GENESIS_VINTAGE_001",
        "refusal_integrity": "ACTIVE",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
    }
    assert engine.evaluate_state_expansion(proposal) is True

def test_banach_curation_deviated_trajectory_id(base_state):
    engine = BanachCurationEngine(base_state)
    proposal = {
        "artifact_id": "TAS_GENESIS_VINTAGE_002",
        "refusal_integrity": "ACTIVE",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
    }
    with pytest.raises(StateCorruptionError, match="Trajectory Deviated"):
        engine.evaluate_state_expansion(proposal)

def test_banach_curation_deviated_trajectory_refusal(base_state):
    engine = BanachCurationEngine(base_state)
    proposal = {
        "artifact_id": "TAS_GENESIS_VINTAGE_001",
        "refusal_integrity": "INACTIVE",
        "thermodynamic_bounds": "ZERO_ENTROPY_DELTA"
    }
    with pytest.raises(StateCorruptionError, match="Refusal Integrity compromised"):
        engine.evaluate_state_expansion(proposal)
