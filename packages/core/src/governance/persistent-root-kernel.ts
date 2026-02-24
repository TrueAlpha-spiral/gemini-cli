/**
 * @license
 * Copyright 2025 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as crypto from 'node:crypto';
import { validateSovereignAction, SovereignViolationError } from './sovereign-leader.js';
import { SovereignAction, SovereignProof, SovereignVerification } from './types.js';
import { CircuitPublicInputs, CircuitPrivateInputs, SnarkProof, ZkProver, SimulatedZkProver } from './zk-snark.js';
import { PerspectiveIntelligenceEngine } from './perspective-intelligence.js';
import { RecursiveRuntime } from './recursive-runtime.js';
import { ImmutableTruthLedger } from './immutable-truth-ledger.js';
import { TASKMicroKernel } from './tas-k-micro-kernel.js';

// ---- Types & Interfaces (Translating Swift Enums/Classes) ----

/**
 * Result of the kernel's evaluation of a cognitive stream.
 */
export type InterceptResult =
  | { type: 'verified_output', content: string }
  | { type: 'silence', reason: string };

/**
 * Represents a cryptographically signed seed derived from a biometric input.
 */
export interface HumanSeed {
  api_key: string;
  genesis_hash: string;
  // Encapsulated private data for ZK proof generation (simulated)
  _private_sk?: string;
  _private_sig?: string;
}

/**
 * A verified gene produced by the Logarithmic Loom.
 */
export interface VerifiedGene {
  content: string;
  signature: string;
  genesis_hash: string;
  raw_prompt: string;
  human_seed: HumanSeed;
}

/**
 * Error thrown when Refusal Integrity (R_i) is activated.
 */
export class PhoenixError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PhoenixError';
  }
}

// ---- Simulated Components (Adapting for Node.js) ----

/**
 * Simulates the Secure Enclave (Apple's dedicated security hardware).
 * In Node.js, we use `node:crypto` to generate keys and sign data.
 */
class SecureEnclave {
  private keyPair: crypto.KeyPairKeyObjectResult;

  constructor() {
    // Generate an ECDSA key pair (simulating hardware-backed keys)
    this.keyPair = crypto.generateKeyPairSync('ec', {
      namedCurve: 'prime256v1', // NIST P-256 (standard for Secure Enclave)
    });
  }

  /**
   * Signs the payload using the private key.
   */
  sign(payload: string): { publicKey: string; genesisChainHash: string; signature: string; privateKey: string } {
    const signer = crypto.createSign('SHA256');
    signer.update(payload);
    const signature = signer.sign(this.keyPair.privateKey, 'base64');

    // Simulate genesis chain hash (derived from signature + pubkey)
    const genesisChainHash = crypto.createHash('sha256')
      .update(signature + this.keyPair.publicKey.export({ type: 'spki', format: 'pem' }))
      .digest('hex');

    return {
      publicKey: this.keyPair.publicKey.export({ type: 'spki', format: 'pem' }).toString(),
      genesisChainHash,
      signature,
      privateKey: this.keyPair.privateKey.export({ type: 'sec1', format: 'pem' }).toString()
    };
  }
}

/**
 * Simulates the ZK_LedgerClient (Zero-Knowledge Proof broadcaster).
 */
class ZK_LedgerClient {
  private prover: ZkProver;
  private itl: ImmutableTruthLedger;

  constructor() {
    this.prover = new SimulatedZkProver();
    this.itl = new ImmutableTruthLedger();
  }

  async broadcast_gene_proof(gene: VerifiedGene): Promise<void> {
    // Construct Circuit Inputs
    const publicInputs: CircuitPublicInputs = {
      genesis_hash: gene.human_seed.genesis_hash,
      gene_hash: gene.signature, // Using signature as the gene hash for simulation
    };

    const privateInputs: CircuitPrivateInputs = {
      human_seed_sk: gene.human_seed._private_sk || '',
      raw_prompt: gene.raw_prompt,
      biometric_sig: gene.human_seed._private_sig || '',
    };

    // Generate ZK Proof
    try {
      const proof = await this.prover.generateProof(publicInputs, privateInputs);

      // Commit Receipt to ITL
      await this.itl.commitReceipt(gene, proof);

    } catch (e) {
      console.error('[ZK_Ledger] Proof generation failed:', e);
      throw new PhoenixError('ZK Proof Generation Failed');
    }
  }

  async log_refusal(reason: string, delta: number = 0): Promise<void> {
      await this.itl.commitRefusal(reason, delta);
  }

  // Helper for testing
  getLedger() {
      return this.itl.getLedger();
  }
}

/**
 * Simulates the Triadic Knowledge Engine (Loom).
 * Connects to the existing `sovereign-leader` logic where applicable.
 */
class TriadicKnowledgeEngine {
  private piEngine: PerspectiveIntelligenceEngine;
  private recursiveRuntime: RecursiveRuntime;

  constructor(private ledger: any) {
    this.piEngine = new PerspectiveIntelligenceEngine();
    this.recursiveRuntime = new RecursiveRuntime();
  }

  execute_loom(raw_input: string, human_seed: HumanSeed): VerifiedGene {
    // Simulate complex "Loom" logic:
    // 1. Check if the input violates any sovereign invariants (using sovereign-leader.ts)
    // 2. Enforce Perspective Intelligence (Axiom PI_0)
    // 3. If valid, "weave" it into a VerifiedGene.

    // 1. TAS_K Micro-Kernel Check (High-Velocity Gate)
    if (!TASKMicroKernel.verify(raw_input)) {
        throw new PhoenixError('Input violates Sovereign Integrity Axioms (TAS_K Rejection).');
    }

    // 2. Perspective Intelligence Curation (Axioms A_20, A_30)
    const curated = this.piEngine.curate(raw_input, human_seed);

    let contentToWeave = "";

    if (!curated) {
      // 2.5 The Recursive Runtime ([Re-Action])
      // "When the engine detects an inadmissible state... the system executes a re-computation."
      const reAction = this.recursiveRuntime.recompute(raw_input, human_seed);
      if (reAction) {
        // [Re-Action] Successful: We use the recomputed gene directly.
        // We bypass the standard weaving below because recompute returns a full VerifiedGene structure
        // (conceptually - though our types might need alignment, for now we extract content).
        contentToWeave = reAction.content;
      } else {
        // "If it cannot find a contractive path, the system defaults to pure Silence."
        throw new PhoenixError('Input failed Perspective Intelligence curation (PI ratio exceeded) and Recursive Repair failed.');
      }
    } else {
      contentToWeave = curated.content;
    }

    // 3. Verify against Sovereign Leader (simulate an action)
    try {
        const action: SovereignAction = {
            authority: {
                revocation_ref: human_seed.genesis_hash, // Use genesis hash as revocation ref
            },
            anchor: {
                parent_hash: 'genesis',
                payload_hash: crypto.createHash('sha256').update(contentToWeave).digest('hex'),
            }
        };
        validateSovereignAction(action);
    } catch (e: any) {
        if (e instanceof SovereignViolationError) {
             throw new PhoenixError(`Sovereign Violation: ${e.message}`);
        }
        throw e;
    }

    return {
      content: contentToWeave,
      signature: crypto.createHash('sha256').update(contentToWeave + human_seed.genesis_hash).digest('hex'),
      genesis_hash: human_seed.genesis_hash,
      raw_prompt: raw_input,
      human_seed: human_seed,
    };
  }
}

// ---- The Kernel ----

/**
 * The TAS Persistent Root Kernel.
 * Intercepts AI interaction at the OS/App boundary to enforce sovereign integrity.
 */
export class PersistentRootKernel {
  private enclave: SecureEnclave;
  private itlClient: ZK_LedgerClient;
  private loom: TriadicKnowledgeEngine;

  constructor() {
    this.enclave = new SecureEnclave();
    this.itlClient = new ZK_LedgerClient();
    this.loom = new TriadicKnowledgeEngine({}); // LocalLedgerCache stub
  }

  /**
   * Evaluates a cognitive stream (prompt) against the Prime Invariant (I_0).
   */
  async evaluate_cognitive_stream(raw_prompt: string): Promise<InterceptResult> {
    // 1. Enforce Prime Invariant (I_0) via Physical Hardware
    if (process.env.TAS_HARDWARE_ANCHOR === 'OFFLINE') {
        const reason = 'Hardware Anchor Offline. Cannot verify I_0.';
        await this.itlClient.log_refusal(reason);
        return { type: 'silence', reason };
    }

    // 2. Extract Cryptographic Human Seed from Secure Enclave
    const biometricSignature = this.enclave.sign(raw_prompt);
    const humanSeed: HumanSeed = {
      api_key: biometricSignature.publicKey,
      genesis_hash: biometricSignature.genesisChainHash,
      // Store private witness data (hidden from UI, used for ZK proof)
      _private_sk: biometricSignature.privateKey,
      _private_sig: biometricSignature.signature,
    };

    // 3. Route through the Logarithmic Loom
    try {
      const verifiedGene = this.loom.execute_loom(raw_prompt, humanSeed);

      // 4. Asynchronous ZK-Proof Sync to Global ITL
      await this.itlClient.broadcast_gene_proof(verifiedGene);

      // 5. Release verified semantic state to UI
      return { type: 'verified_output', content: verifiedGene.content };

    } catch (error: any) {
      // Record Negative Proof
      if (error instanceof PhoenixError) {
        // Refusal Integrity (R_i) successfully executed
        await this.itlClient.log_refusal(`Phoenix Protocol Activated: ${error.message}`);
        return { type: 'silence', reason: `Phoenix Protocol Activated: ${error.message}` };
      } else {
        // Unhandled entropy results in immediate collapse
        await this.itlClient.log_refusal('Unrecoverable semantic turbulence');
        return { type: 'silence', reason: 'Unrecoverable semantic turbulence.' };
      }
    }
  }

  // Expose ledger for testing
  getLedger() {
      return this.itlClient.getLedger();
  }
}
