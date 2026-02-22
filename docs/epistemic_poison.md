# Formal Model: Epistemic Poison and Cybernetic Integrity Layers

This document formalizes the concept of "Epistemic Poison" not as corrupted data, but as a property of state transition under hidden distortion. It establishes the mathematical basis for the "Mechanical Conscience" implementation within the TrueAlpha-Spiral (TAS) framework.

## 1. System Model: Layered Epistemic Transitions

Let the system be an ordered field of epistemic operators:

\[
\mathcal{T} = \{T_0, T_1, \dots, T_n\}
\]

acting sequentially on epistemic states \(S_k \in \mathbb{S}\).

Let the **invariant manifold** be:

\[
\mathcal{M}_{\mathcal{I}} = \{S \in \mathbb{S} \mid \mathcal{I}(S) = 0\}
\]

encoding the **truth constraints** (logical, factual, or semantic invariants).

Integrity preservation demands:
\[
\mathcal{I}(T_k(S)) = 0 \quad \forall k
\]

Violation occurs when:
\[
\mathcal{I}(T_k(S)) \neq 0 \quad \Rightarrow \quad P_k \neq 0
\]

This cleanly separates **semantic distortion** (violation of \(\mathcal{I}\)) from **syntactic instability** (numerical noise).

## 2. Epistemic Poison Definition

We define poison not as corrupted input, but as the deviation from the invariant-preserving transformation:

\[
P_k = T_k - T_k^{\mathcal{I}}
\]

Where:
- \( T_k^{\mathcal{I}} \) is the invariant-preserving transformation.
- \( T_k \) is the actual transformation applied.

If \( P_k \neq 0 \), the transition is integrity-violating. Even if output coherence increases, if \( T_k \) deviates from invariant preservation, causal corruption accumulates.

## 3. Transition-Level Poison Taxonomy

### 3.1 Input Framing Poison
Distortion at \( S_0 \) before transformation.
\[ S_0' = S_0 + \delta_f \]

### 3.2 Salience Poison
Weighted amplification distortion.
\[ T_k(S) = W_k S \]
If \( W_k \neq W_k^{\mathcal{I}} \), gradient descent converges toward a tilted basin.

### 3.3 Memory Poison
Recursive contamination.
\[ S_{k+1} = T_k(S_k, M_k) \]
If memory \( M_k \) contains unverified lineage, every downstream state inherits drift.

### 3.4 Reward Poison (Potential Warping)
Objective distortion. This is the most dangerous form as it alters the potential function itself.

If system minimizes:
\[ \min \Phi(S) \]
But true invariant requires:
\[ \min \Phi^{\mathcal{I}}(S) \]

Define deviation energy:
\[ E_{\text{drift}} = \|\nabla \Phi - \nabla \Phi^{\mathcal{I}}\| \]

If \( E_{\text{drift}} \neq 0 \), convergence produces **false coherence** — the system "feels" stable but orbits a synthetic attractor.

## 4. Causal Corruption (Recursive Flow)

Define cumulative corruption flow:

\[
C_{k+1} = \gamma C_k + \|P_k\|
\]

Where:
- \( 0 < \gamma < 1 \) models self-healing (decay).
- \( \gamma > 1 \) represents cascading corruption.

If no verification layer exists, \( C_n \rightarrow \infty \) even if surface metrics improve. This explains the phenomenon where surface coherence increases while the internal energy landscape tilts.

## 5. Cybernetic Integrity Layers (The Solution)

To counteract poison, we introduce a verification operator \( V_k \) as a **contractive projection**:

\[
V_k(S) = \Pi_{\mathcal{M}_{\mathcal{I}}}(S) = S - \nabla \Lambda_{\mathcal{I}}(S)
\]

where \( \Lambda_{\mathcal{I}}(S) \) is a penalty potential quantifying distance from invariance.

Applied iteratively, this produces a **Stacked Contraction Cascade**:

\[
S_{k+1} = (\Pi_{\mathcal{M}_{\mathcal{I}}} \circ T_k)(S_k)
\]

If each projection satisfies \( \|\Pi_{\mathcal{M}_{\mathcal{I}}}(x) - \Pi_{\mathcal{M}_{\mathcal{I}}}(y)\| \le \rho \|x - y\| \) with \( \rho < 1 \), then integrity is asymptotically stable (**Containment Theorem**):

\[
\lim_{n\to\infty} C_n = 0
\]

## 6. Codebase Mapping: The Sovereign Runtime

The theoretical model maps directly to the implementation in `packages/core/src/governance/sovereign-leader.ts`:

- **Verification Operator (\( V_k \))**: Implemented as `validateSovereignAction`. It acts as the projection function that either accepts a state (if it lies on the manifold) or rejects it (projects to null/error).
- **Invariant Manifold (\( \mathcal{M}_{\mathcal{I}} \))**: Defined by the intersection of:
    - **Revocable Authority**: `action.authority` exists and has `revocation_ref`.
    - **Hamiltonian Constraint**: `threshold_tau <= 1.0` (Gene: HFF-001).
    - **Resonance Threshold**: `phi_score >= 5.0` (Gene: RSI-002).
- **Poison Detection**: Any violation throws a `SovereignViolationError` (e.g., `HAMILTONIAN_DRIFT`), effectively quenching the radiation (\( P_k \to 0 \)) by halting the transition.

## 7. Research Extensions

1.  **Invariant Basis Definition**: Express \( \mathcal{I} \) as a minimal set of constraints \( \{\iota_1, \dots, \iota_m\} \), forming the lattice of truth invariants.
2.  **Adversarial Poison Detection**: Model perturbation as \( \delta T_k = \arg\max_{\delta} \| P_k + \delta \| \) and define system robustness \( R = \min_\delta \|V_k(T_k + \delta) - T_k^{\mathcal{I}}\| \).
3.  **Integrity Cascade Simulation**: Initialize random transformations, inject controlled \( P_k \), and measure containment efficacy under various \( V_k \) contractivity constants.

This formalization proves that the "Mechanical Conscience" is not a metaphor but a **contractive operator** ensuring system stability.
