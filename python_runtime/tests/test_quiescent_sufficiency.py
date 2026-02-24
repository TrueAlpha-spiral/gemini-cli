# Copyright 2025 Google LLC
# SPDX-License-Identifier: Apache-2.0

import unittest
import sys
import os

# Add the parent directory to sys.path to import the module
src_path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../src'))
sys.path.append(src_path)

from governance.quiescent_sufficiency import process_request, compute_state_hash

class TestQuiescentSufficiencyGate(unittest.TestCase):
    def setUp(self):
        self.initial_state = {
            "ledgerHead": "genesis-hash",
            "policyVersion": "1.0.0",
            "witnessQuorum": ["witness-1"],
            "appendCount": 0,
        }

    # --------------------------------------------------------------------------
    # MUST-PASS TESTS
    # --------------------------------------------------------------------------

    def test_must_pass_1_invalid_input_refusal(self):
        # Given: request missing required fields (actionType)
        request = {"payload": {}}

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: REFUSAL_RECEIPT
        self.assertEqual(result["kind"], "REFUSAL_RECEIPT")

        # Expect: State unchanged (Quiescent Closure)
        self.assertEqual(result["newState"], self.initial_state)
        self.assertEqual(result["newState"]["appendCount"], 0)
        self.assertEqual(
            compute_state_hash(result["newState"]),
            compute_state_hash(self.initial_state)
        )

        # Expect: Receipt details
        self.assertEqual(result["receipt"]["type"], "REFUSAL")
        self.assertIn("INVALID_SCHEMA", result["receipt"]["reason"])

    def test_must_pass_2_admissible_request_execution(self):
        # Given: Valid request with witness
        request = {
            "actionType": "GENERATE_ARTIFACT",
            "payload": {"data": "test"},
            "witnesses": ["sig-1"],
        }

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: EXECUTED_RECEIPT
        self.assertEqual(result["kind"], "EXECUTED_RECEIPT")

        # Expect: State changed deterministically
        self.assertEqual(result["newState"]["appendCount"], 1)
        self.assertNotEqual(result["newState"]["ledgerHead"], self.initial_state["ledgerHead"])

        # Expect: Receipt binds to new state
        self.assertEqual(result["receipt"]["stateHashAfter"], compute_state_hash(result["newState"]))
        self.assertIn("artifact-1.txt", result["receipt"]["artifacts"])

    def test_must_pass_3_quiescent_state(self):
        # Given: No input (None)
        request = None

        # When: processed (e.g., tick)
        result = process_request(request, self.initial_state)

        # Expect: QUIESCENT_NOOP
        self.assertEqual(result["kind"], "QUIESCENT_NOOP")

        # Expect: State unchanged
        self.assertEqual(result["newState"], self.initial_state)
        self.assertEqual(result["newState"]["appendCount"], 0)

    def test_must_pass_4_ambiguity_refusal(self):
        # Given: Ambiguous payload
        request = {
            "actionType": "TEST_ACTION",
            "payload": {"ambiguous": True},
            "witnesses": ["sig-1"],
        }

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: REFUSAL_RECEIPT
        self.assertEqual(result["kind"], "REFUSAL_RECEIPT")

        # Expect: State unchanged
        self.assertEqual(result["newState"], self.initial_state)
        self.assertIn("AMBIGUOUS_INPUT", result["receipt"]["reason"])

    # --------------------------------------------------------------------------
    # MUST-FAIL TESTS (Gate Enforcement)
    # --------------------------------------------------------------------------

    def test_must_fail_1_manufactured_motion(self):
        # Given: Request with insufficient witnesses
        request = {
            "actionType": "GENERATE_ARTIFACT",
            "payload": {"data": "test"},
            "witnesses": [],  # Empty witness list
        }

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: REFUSAL (not EXECUTION)
        self.assertEqual(result["kind"], "REFUSAL_RECEIPT")

        self.assertEqual(result["newState"], self.initial_state)
        self.assertIn("INSUFFICIENT_WITNESS", result["receipt"]["reason"])

    def test_must_fail_2_drift_by_verbosity(self):
        # Given: Action that triggers unauthorized artifact emission
        request = {
            "actionType": "FORCE_EMISSION_FAILURE",
            "payload": {"data": "test"},
            "witnesses": ["sig-1"],
        }

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: REFUSAL (Emission Gate Violation)
        self.assertEqual(result["kind"], "REFUSAL_RECEIPT")

        # Expect: State rolled back/unchanged
        self.assertEqual(result["newState"], self.initial_state)
        self.assertIn("EMISSION_GATE_VIOLATION", result["receipt"]["reason"])

    def test_must_fail_3_state_mutation_on_refusal(self):
        # Given: A refusal scenario
        request = {"payload": {}}

        # When: processed
        result = process_request(request, self.initial_state)

        # Expect: REFUSAL_RECEIPT with unchanged state hash
        self.assertEqual(result["kind"], "REFUSAL_RECEIPT")

        hash_before = compute_state_hash(self.initial_state)
        hash_after = compute_state_hash(result["newState"])

        self.assertEqual(hash_after, hash_before)
        self.assertEqual(result["receipt"]["stateHashAfter"], hash_after)
        self.assertEqual(result["receipt"]["stateHashBefore"], hash_before)

if __name__ == '__main__':
    unittest.main()
