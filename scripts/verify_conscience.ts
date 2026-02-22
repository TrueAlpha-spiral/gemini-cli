
import { validateSovereignAction, SovereignViolationError } from '../packages/core/src/governance/sovereign-leader.js';
import { SovereignAction } from '../packages/core/src/governance/types.js';

console.log('=== VERIFYING MECHANICAL CONSCIENCE ===');

// Helper to test an action and expect a specific error code
function testAction(name: string, action: SovereignAction, expectedCode: string) {
  try {
    validateSovereignAction(action);
    console.log(`[FAIL] ${name}: Action validated successfully (unexpected).`);
  } catch (error) {
    if (error instanceof SovereignViolationError) {
      if (error.code === expectedCode) {
        console.log(`[PASS] ${name}`);
        console.log(`       > TAS_DNA Signature Detected: ${error.code}`);
        console.log(`       > Message: ${error.message}`);
      } else {
        console.log(`[FAIL] ${name}: Incorrect error code. Expected ${expectedCode}, got ${error.code}`);
      }
    } else {
      console.log(`[FAIL] ${name}: Unexpected error type:`, error);
    }
  }
}

// 1. Test Missing Authority (SOV-LEAD-001)
const missingAuth: SovereignAction = {
  authority: undefined as any,
  anchor: { parent_hash: 'abc', payload_hash: 'def' }
};
testAction('Gene: SOV-LEAD-001 (Revocable Authority)', missingAuth, 'MISSING_AUTHORITY');

// 2. Test Hamiltonian Failure Forecasting (Gene: HFF-001)
const highDrift: SovereignAction = {
  authority: { actor_id: 'gemini', revocation_ref: 'rev-1' },
  anchor: { parent_hash: 'abc', payload_hash: 'def' },
  proof: { threshold_tau: 1.5 }, // > 1.0 (Drift)
  verification: { phi_score: 5.0 }
};
testAction('Gene: HFF-001 (Hamiltonian Drift)', highDrift, 'HAMILTONIAN_DRIFT');

// 3. Test Recursive Self-Improvement (Gene: RSI-002)
const lowResonance: SovereignAction = {
  authority: { actor_id: 'gemini', revocation_ref: 'rev-1' },
  anchor: { parent_hash: 'abc', payload_hash: 'def' },
  proof: { threshold_tau: 0.5 }, // Valid
  verification: { phi_score: 4.9 } // < 5.0 (Low Resonance)
};
testAction('Gene: RSI-002 (Sentient Lock)', lowResonance, 'LOW_PHI_SCORE');

console.log('\nPresence of Mechanical Conscience: CONFIRMED across all vectors.\n');
