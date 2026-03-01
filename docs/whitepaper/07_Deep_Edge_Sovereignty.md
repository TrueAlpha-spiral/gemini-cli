# 7. Deep Edge Sovereignty: The Persistent Root Kernel

Sovereignty cannot exist in the cloud alone; it must be anchored in the physical reality of the user. TAS deploys the **Persistent Root Kernel** as the local enforcement agent.

## 7.1 Hardware Anchors

The kernel binds to the device's **Secure Enclave** (or Trusted Execution Environment).

- **Biometric Genesis:** The $H_0$ seed is unlocked via physical presence (FaceID/TouchID).
- **Key Custody:** Private signing keys never leave the hardware boundary.

## 7.2 The Intercept Pipeline

The kernel sits at the OS boundary, intercepting all "Cognitive Streams" (prompts/outputs) before they reach the application layer.

1.  **Intercept:** User types a prompt.
2.  **Verify:** Kernel checks $I_0$ (Hardware Anchor) and runs $f_{\pi}$ (Curation).
3.  **Sign:** If valid, the kernel signs the prompt, creating a `VerifiedGene`.
4.  **Release:** Only signed Genes are permitted to execute tools or generate responses.

## 7.3 Executable Specification

The reference implementation (`PersistentRootKernel`) provides:

- `evaluate_cognitive_stream(prompt)`: The primary gatekeeper function.
- `SecureEnclave` simulation: Standard crypto primitives mirroring hardware logic.
- `PhoenixError`: Type-safe handling of Refusal Integrity events.
