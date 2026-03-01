# 8. Decentralized Synchronization: The Zero-Knowledge Verification Layer

To prevent the "Oracle Problem"—where a central server must see all data to verify it—TAS employs Zero-Knowledge Proofs (ZK-SNARKs).

## 8.1 The Immutable Truth Ledger (ITL)

The ITL is a directed acyclic graph (DAG) of verified Genes. It records the _lineage_ of truth without necessarily recording the _content_ of every private interaction.

## 8.2 Privacy in Content, Transparency in Process

Users verify _that_ they acted sovereignly without revealing _what_ they did. The network reaches consensus on the **integrity of the process**, not the specific semantics of the prompt.

## 8.3 Circom R1CS Schema

We define an arithmetic circuit $C(x, w)$ where:

- **Public Inputs ($x$):** $H_0$ (Genesis Hash), $H_g$ (Gene Hash).
- **Private Witness ($w$):** $sk$ (Private Key), $P$ (Raw Prompt), $\sigma$ (Signature).

The circuit proves:

1.  **Signature Validity:** $Verify(sk, P, \sigma) == True$.
2.  **Hash Integrity:** $Poseidon(P + H_0) == H_g$.

This allows the Global ITL to validate the "Prime Invariant" of a local action without ever seeing the raw data.
