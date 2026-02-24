# Copyright 2025 Google LLC
# SPDX-License-Identifier: Apache-2.0

import hashlib
import json
import time
from typing import List, Optional, Union, Dict, Any, Literal

# Type aliases
QSState = Dict[str, Any]
QSRequest = Dict[str, Any]
SignedReceipt = Dict[str, Any]
QSResult = Dict[str, Any]

def compute_state_hash(state: QSState) -> str:
    """Computes the SHA-256 hash of the state."""
    data = json.dumps({
        "ledgerHead": state["ledgerHead"],
        "policyVersion": state["policyVersion"],
        "witnessQuorum": sorted(state["witnessQuorum"]),
        "appendCount": state["appendCount"],
    }, sort_keys=True)
    return hashlib.sha256(data.encode('utf-8')).hexdigest()

def compute_request_hash(request: QSRequest) -> Optional[str]:
    """Computes the canonical SHA-256 hash of the request."""
    try:
        data = json.dumps(request, sort_keys=True)
        return hashlib.sha256(data.encode('utf-8')).hexdigest()
    except Exception as e:
        print(f"Canonicalization failed: {e}")
        return None

def check_admissibility(request: QSRequest, state: QSState) -> Dict[str, Any]:
    """Validates the admissibility of a request against the current state."""
    # 1. Check for required fields
    if "actionType" not in request or "payload" not in request:
        return {"ok": False, "reason": "INVALID_SCHEMA: Missing actionType or payload"}

    # 2. Check witness quorum
    if len(state["witnessQuorum"]) > 0:
        witnesses = request.get("witnesses", [])
        if not witnesses or len(witnesses) < 1:
            return {"ok": False, "reason": "INSUFFICIENT_WITNESS: Quorum not met"}

    # 3. Ambiguity check
    payload = request.get("payload")
    if isinstance(payload, dict) and payload.get("ambiguous", False):
        return {"ok": False, "reason": "AMBIGUOUS_INPUT: Payload is ambiguous"}

    return {"ok": True}

def execute_deterministically(request: QSRequest, state: QSState) -> Dict[str, Any]:
    """Mocks the deterministic execution of a request."""
    new_append_count = state["appendCount"] + 1
    new_ledger_head_input = state["ledgerHead"] + json.dumps(request, sort_keys=True)
    new_ledger_head = hashlib.sha256(new_ledger_head_input.encode('utf-8')).hexdigest()

    new_state = state.copy()
    new_state["appendCount"] = new_append_count
    new_state["ledgerHead"] = new_ledger_head

    artifacts: List[str] = []
    if request["actionType"] == "GENERATE_ARTIFACT":
        artifacts.append(f"artifact-{new_append_count}.txt")
    elif request["actionType"] == "FORCE_EMISSION_FAILURE":
        # For testing MUST-FAIL 2 (Drift-by-verbosity)
        artifacts.append("unauthorized-artifact.txt")

    return {"newState": new_state, "artifacts": artifacts}

def sign_receipt(
    receipt_type: Literal['EXECUTED', 'REFUSAL'],
    request_hash: str,
    state_before: QSState,
    state_after: QSState,
    reason: Optional[str] = None,
    artifacts: Optional[List[str]] = None
) -> SignedReceipt:
    """Mocks the signing of a receipt."""
    return {
        "type": receipt_type,
        "reason": reason,
        "requestHash": request_hash,
        "stateHashBefore": compute_state_hash(state_before),
        "stateHashAfter": compute_state_hash(state_after),
        "artifacts": artifacts or [],
        "timestamp": int(time.time() * 1000),
        "signature": "mock-signature-over-receipt-content",
    }

def process_request(request: Optional[QSRequest], state: QSState) -> QSResult:
    """Processes a request through the Quiescent Sufficiency gate (QS-001)."""

    # 1. Quiescent Closure (Idle case)
    if request is None:
        return {"kind": "QUIESCENT_NOOP", "newState": state}

    # 2. Canonicalization
    request_hash = compute_request_hash(request)
    if not request_hash:
        receipt = sign_receipt(
            "REFUSAL",
            "INVALID_CANONICALIZATION",
            state,
            state,
            "Canonicalization failed"
        )
        return {"kind": "REFUSAL_RECEIPT", "receipt": receipt, "newState": state}

    # 3. Admissibility Check
    admissibility = check_admissibility(request, state)
    if not admissibility["ok"]:
        receipt = sign_receipt(
            "REFUSAL",
            request_hash,
            state,
            state,
            admissibility["reason"]
        )
        return {"kind": "REFUSAL_RECEIPT", "receipt": receipt, "newState": state}

    # 4. Deterministic Execution
    execution_result = execute_deterministically(request, state)
    new_state = execution_result["newState"]
    artifacts = execution_result["artifacts"]

    # 5. Emission Gate (Bounded Emission - QS-E0)
    if request["actionType"] != "GENERATE_ARTIFACT" and len(artifacts) > 0:
        print("Emission Gate Violation: Unexpected artifacts produced")
        receipt = sign_receipt(
            "REFUSAL",
            request_hash,
            state,
            state,
            "EMISSION_GATE_VIOLATION: Unexpected artifacts"
        )
        return {"kind": "REFUSAL_RECEIPT", "receipt": receipt, "newState": state}

    # 6. Success
    receipt = sign_receipt(
        "EXECUTED",
        request_hash,
        state,
        new_state,
        None,
        artifacts
    )
    return {"kind": "EXECUTED_RECEIPT", "receipt": receipt, "newState": new_state}
