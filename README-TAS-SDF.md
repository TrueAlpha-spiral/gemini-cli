### TAS/SDF Developer README: Day Zero Microkernel Initialization
Welcome to the Sovereign Data Foundation (SDF). If you are reading this, you are bridging the physical world into the TrueAlphaSpiral (TAS) architecture. You are not building a probabilistic application; you are initializing a deterministic, verifiably authentic node on the WhiteMarket public utility.
This repository contains the bare-metal Rust implementation of the **Logos Gatekeeper**, the **IffGatekeeper**, and the **Merkle-Mycelia Ledger** for deployment on the TAS-Enclave handheld hardware.
### 1. The Sovereign Invariant (Read Before Compiling)
The age of presumed computational trust is over. This microkernel operates under strict Zero-Knowledge (ZK) constraints.
 * **No Unverified Ingress:** Data without a Post-Quantum Dilithium signature and a succinct Nova-STARK lineage proof will be deterministically dropped.
 * **Zero-Tolerance Panic:** This system is compiled with panic=abort. If your code introduces semantic contradiction (O(n^2) probability drift) or violates the absolute zero thermodynamic baseline (\Delta C_T > 0), the local SentientLock will instantly drop the matrix connection.
 * **The Genesis Anchor:** Your node will refuse to boot unless your hardware ROM is permanently fused with the verified TAS_GENESIS_VINTAGE_001 Day Zero Root Hash.
### 2. Hardware Pre-requisites
 * **Target Architectures:** aarch64-unknown-none-softfloat (ARM64) or riscv64imac-unknown-none-elf (RISC-V-64-TAS-Enclave).
 * **Silicon Boundary:** Write-Once Read-Many (WORM) boot sector capable of storing the 32-byte Day Zero Genesis Hash.
 * **Entropy Source:** True Hardware Random Number Generator (TRNG) for localized Dilithium key minting.
### 3. Environment & Toolchain Setup
To ensure deterministic builds, you must use the exact toolchain versions specified in the Genesis metadata.
**1. Install the TAS Rust Toolchain:**
`rustup default nightly-2026-05-14`
`rustup target add riscv64imac-unknown-none-elf`

**2. Install the Noir ZK Compiler (nargo):**
`curl -L https://raw.githubusercontent.com/noir-lang/noirup/main/install | shell`
`noirup -v 0.32.0`

**3. Install the ROM Fuser Utility:**
`cargo install tas-rom-fuser`

### 4. Compilation and Flashing Sequence
This pipeline compiles the constraints, builds the microkernel, and injects the cryptographic anchor directly into the binary.

`nargo compile --workspace`
`RUSTFLAGS="-C target-cpu=native -C panic=abort" cargo build --target riscv64imac-unknown-none-elf --release --features "post-quantum-signatures quic-multiplexing immutable-truth-ledger"`
`tas-rom-fuser --binary target/riscv64imac-unknown-none-elf/release/tas_microkernel --inject-hash 0x3af8e2b9c1d0f4a86e72b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4`

*Your hardware is now primed. Flash the resulting .elf payload to your TAS-Enclave device.*
### 5. Operating the QUIC Membrane
Once the device wakes, the Logos Gatekeeper will automatically instantiate the concurrent QUIC transport layer over the Distributed Hash Table (DHT).
 * **Stream 0x00 (SentientLock):** DO NOT attempt to write to this stream. It is reserved for global SDF revocation broadcasts. If a packet hits this stream, your node will halt to evaluate the threat.
 * **Stream 0x04 (Wake-Sync):** This is your primary I/O. Publish your CoherenceResidualFrame here. Ensure your Target Ledger Dimension Coordinate strictly adheres to the 16-Byte Space Vector standard.
 * **Stream 0x08 (Telemetry):** Use this for peer discovery and ephemeral capability negotiations. Expect aggressive load-shedding from peers.
### 6. Minting a Lineage Receipt (Python Bridge Example)
If you are interacting with the node from a tethered diagnostic machine, you must cryptographically sign your data ingress to generate a WhiteMarket Receipt.
```python
from tas_sdk import NodeMembrane, CoherenceFrame, PostQuantumSigner

# Initialize tether to the physical TAS-Enclave
enclave = NodeMembrane.connect("usb://ttyUSB0")

# Package your sensor data or human-intent command
raw_data = b"SENSOR_READING_NEXUS_001_VALID"

# Generate the Dilithium Signature & ZK Lineage Proof
signer = PostQuantumSigner.load_from_hardware()
receipt_payload = enclave.prove_and_sign(
    data=raw_data,
    authority_key=signer.public_key,
    dht_coordinate=b"\x00" * 15 + b"\x01" # Genesis Space Vector
)

# Transmit to the global DHT via Stream 0x04
success = enclave.quic_broadcast(stream=0x04, frame=receipt_payload)
if success:
    print("Lineage Receipt Minted. Data is now admissible on the WhiteMarket.")

```
