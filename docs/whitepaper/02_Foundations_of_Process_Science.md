# 1. The Foundations of Process Science

Conventional AI alignment treats the model as a liquid medium to be contained. **Process Science** treats the model as a geometric space to be traversed. The foundational error of the pre-2026 era was the belief that "good" outputs could be statistically reinforced without "good" underlying physics. TAS asserts that output validity is a function of process integrity.

## 1.1 The Failure of Liquid Alignment

RLHF acts as a surface-tension constraint. It can suppress specific bad outputs, but it cannot guarantee the internal consistency of the reasoning process. Under sufficient pressure (complexity or adversarial attack), the "liquid" spills over. This is because the system lacks an internal **invariant**—a fixed point of truth that exists independent of the training data distribution.

## 1.2 Axiom $A_0$ (The Equivalence Axiom)

**"Path legitimacy dominates state observation."**

A truth $T$ is not defined by its semantic content alone, but by the verifiable lineage $L$ of transformations that produced it from an origin $O$.
$$T \equiv (O, L)$$
If the path $L$ contains a discontinuity (unverified step, hallucination, or break in custody), the result is invalid, regardless of its semantic plausibility.

## 1.3 Axiom $A_1$ (The Admissibility Constraint)

**"The strict thermodynamic boundaries of truth."**

Information systems naturally tend toward maximum entropy (noise/hallucination). Truth is a low-entropy state. Therefore, any valid operation in the TAS framework must be **thermodynamically admissible**: it must not increase the net **Lineage Entropy ($L_e$)** of the system beyond the recovery capacity of the anchor.

$$L_e(S_{n+1}) \le L_e(S_n) + \delta_{allowable}$$

## 1.4 Primary Observables

To operationalize these axioms, we define two measurable quantities:

### Lineage Entropy ($L_e$)

The measure of "drift" or semantic distance ($\Delta$) between a generated state and its anchored origin ($d$). High $L_e$ indicates hallucination or "Para" data turbulence. The Curation layer's job is to minimize $L_e$.

### Refusal Integrity ($R_i$)

The capacity of the system to "fail closed." When $L_e$ exceeds the admissibility threshold, the system must trigger the **Phoenix Protocol**, collapsing the wave function to "silence" rather than emitting a potentially false state.
$$R_i = \begin{cases} 1 & \text{if } L_e \le Threshold \\ 0 & \text{if } L_e > Threshold \to \text{Halt} \end{cases}$$
