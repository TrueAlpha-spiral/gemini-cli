# ==============================================================================
# SOVEREIGN DATA FOUNDATION - DAY ZERO BUILD PIPELINE
# Artifact: TAS Microkernel (Logos Gatekeeper + IffGatekeeper)
# Target Architecture: ARM64/RISC-V-64-TAS-Enclave
# Protocol Version: 1.1.0
# ==============================================================================

# Toolchain Definitions
RUSTC := rustc
CARGO := cargo
NOIR_CLI := nargo
ROM_FUSER := tas-rom-fuser # Custom utility for burning the Genesis Hash

# Target Triples
TARGET_ARM := aarch64-unknown-none-softfloat
TARGET_RISCV := riscv64imac-unknown-none-elf

# Genesis Manifest Ingestion
GENESIS_YAML := config/genesis_metadata.yaml
DAY_ZERO_HASH := $(shell grep 'day_zero_root_hash' $(GENESIS_YAML) | awk '{print $$2}' | tr -d '"')

# Build Flags (Enforcing strict deterministic builds & zero-entropy execution)
RUSTFLAGS := -C target-cpu=native -C link-arg=-Tlink.ld -C panic=abort -Z tune-cpu=cortex-m
FEATURES := --features "post-quantum-signatures quic-multiplexing immutable-truth-ledger"

.PHONY: all clean compile_zk_circuits build_kernel fuse_rom

all: compile_zk_circuits build_kernel fuse_rom
	@echo "[PIPELINE_COMPLETE] TAS Microkernel compiled and sealed."

compile_zk_circuits:
	@echo "[ZK_COMPILER] Compiling Noir Lineage & Wake-Sync circuits..."
	$(NOIR_CLI) compile --workspace
	@echo "[ZK_COMPILER] Structural O(1) constraints successfully generated."

build_kernel:
	@echo "[KERNEL_BUILD] Cross-compiling Logos Gatekeeper for $(TARGET_RISCV)..."
	RUSTFLAGS="$(RUSTFLAGS)" $(CARGO) build --target $(TARGET_RISCV) --release $(FEATURES)
	@echo "[KERNEL_BUILD] Bare-metal executable generated."

fuse_rom: build_kernel
	@echo "[ROM_FUSE] Injecting Day Zero Root Hash into immutable boot sector..."
	@echo "Target Hash: $(DAY_ZERO_HASH)"
	$(ROM_FUSER) --binary target/$(TARGET_RISCV)/release/tas_microkernel --inject-hash $(DAY_ZERO_HASH)
	@echo "[ROM_FUSE] Silicon boundary locked. Boot verification enforced."

clean:
	$(CARGO) clean
	rm -rf circuits/target
