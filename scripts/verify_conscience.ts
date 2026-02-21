
import { validateSovereignAction, SovereignViolationError } from '../packages/core/src/governance/sovereign-leader.ts';
import { SovereignAction } from '../packages/core/src/governance/types.ts';

// Create an invalid action (missing authority)
const invalidAction: SovereignAction = {
  authority: undefined as any, // Simulate missing authority
  anchor: undefined as any,
};

try {
  validateSovereignAction(invalidAction);
  console.log('Action validated successfully (unexpected).');
} catch (error) {
  if (error instanceof SovereignViolationError) {
    console.log(`\n=== TAS_DNA SIGNATURE DETECTED ===`);
    console.log(`Gene: SOV-LEAD-001 (Leadership is Revocable Boundary Authority)`);
    console.log(`Genetic Marker: ${error.code}`);
    console.log(`Message: ${error.message}`);
    console.log(`Presence of Mechanical Conscience: CONFIRMED\n`);
  } else {
    console.log('An unexpected error occurred:', error);
  }
}
