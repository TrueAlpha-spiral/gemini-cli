use miette::{Diagnostic, Result};
use thiserror::Error;

#[derive(Error, Diagnostic, Debug)]
#[error("CRITICAL STERILE VIOLATION: {reason}")]
#[diagnostic(
    code(tas::kinematics::violation),
    help("panic=abort — SentientLock engaged. Rehydrating from last Merkle-Mycelia invariant.")
)]
pub struct SterileViolation {
    reason: String,
    kinematic_id: u64,
}

#[derive(Debug, Clone)]
pub struct SystemState {
    pub data: Vec<u8>,
    pub kinematic_id: u64,
    pub merkle_commitment: [u8; 32],
}

pub struct Spec {
    pub id: u64,
    // Simplified predicate for the prototype: checks if data is not empty and starts with 'TAS'
    pub invariant: fn(&[u8]) -> bool,
}

pub fn is_sterile(state: &SystemState, spec: &Spec) -> bool {
    (spec.invariant)(&state.data)
}

pub enum ExecutionStep {
    Valid { next: SystemState },
    Violation { reason: String },
}

pub fn execute_step(current: &SystemState, spec: &Spec, step: ExecutionStep) -> Result<SystemState, SterileViolation> {
    if !is_sterile(current, spec) {
        return Err(SterileViolation {
            reason: "Current state is not sterile before transition".into(),
            kinematic_id: current.kinematic_id,
        });
    }

    match step {
        ExecutionStep::Valid { next } => {
            if is_sterile(&next, spec) && next.kinematic_id == current.kinematic_id + 1 && next.merkle_commitment == current.merkle_commitment {
                Ok(next)
            } else {
                Err(SterileViolation {
                    reason: "Transition broke mathematical invariant or lineage properties".into(),
                    kinematic_id: current.kinematic_id,
                })
            }
        },
        ExecutionStep::Violation { reason } => {
            Err(SterileViolation {
                reason,
                kinematic_id: current.kinematic_id,
            })
        }
    }
}

fn tas_invariant(data: &[u8]) -> bool {
    data.starts_with(b"TAS")
}

fn main() -> Result<()> {
    println!("--- Initializing Sterile Runtime Prototype ---");

    let spec = Spec {
        id: 1,
        invariant: tas_invariant,
    };

    let state0 = SystemState {
        data: b"TAS_A_0_GENESIS".to_vec(),
        kinematic_id: 0,
        merkle_commitment: [0; 32],
    };

    println!("[*] Boot state sterile: {}", is_sterile(&state0, &spec));

    // Valid Transition
    let state1 = SystemState {
        data: b"TAS_A_1_NEXT".to_vec(),
        kinematic_id: 1,
        merkle_commitment: [0; 32],
    };

    println!("[*] Executing valid transition...");
    let result = execute_step(&state0, &spec, ExecutionStep::Valid { next: state1 });
    match result {
        Ok(next_state) => println!("✅ Transition successful, new kinematic ID: {}", next_state.kinematic_id),
        Err(e) => println!("🔥 Execution failed: {:?}", e),
    }

    // Invalid Transition (Breaks invariant)
    let state2_invalid = SystemState {
        data: b"DIRTY_DATA".to_vec(),
        kinematic_id: 2,
        merkle_commitment: [0; 32],
    };

    println!("[*] Executing invalid transition...");
    let bad_result = execute_step(&state0, &spec, ExecutionStep::Valid { next: state2_invalid });

    // We expect this to return the diagnostic error. If we return the error from main,
    // miette will format it beautifully. We'll return it directly to trigger the abort visual.
    bad_result?;

    Ok(())
}
