# canon-attestation-hub

> ZK-ML training provenance verification on Stellar

**Vibe:** Computational · Forensic · Secure

An AI training engine crawls a dataset, generates a cryptographic proof it only trained on files registered in `canon-provenance-ledger`, and publishes a tamper-proof receipt to the Stellar blockchain — without exposing model weights.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│  AI Training Engine                                     │
│  (external)                                             │
└────────────────┬────────────────────────────────────────┘
                 │ dataset manifest (file hashes)
                 ▼
┌─────────────────────────────────────────────────────────┐
│  prover/  (Rust CLI)                                    │
│  • SHA-256 merkle tree over canon file hashes           │
│  • Groth16 ZK proof commitment (arkworks)               │
│  • Outputs: proof_hash + dataset_merkle_root (JSON)     │
└────────────────┬────────────────────────────────────────┘
                 │ proof JSON
                 ▼
┌─────────────────────────────────────────────────────────┐
│  backend/  (Node.js / Express)                          │
│  POST /api/prover/prove   → invokes prover binary       │
│  POST /api/attestations   → submits to Stellar          │
│  GET  /api/attestations/:proofHash → reads from chain   │
└────────────────┬────────────────────────────────────────┘
                 │ Soroban RPC
                 ▼
┌─────────────────────────────────────────────────────────┐
│  contracts/attestation-registry/  (Soroban / Stellar)   │
│  submit_attestation(prover, model_id, merkle, proof)    │
│  verify_attestation(proof_hash)   [admin only]          │
│  get_attestation(proof_hash)                            │
└─────────────────────────────────────────────────────────┘
                 ▲
                 │ read / submit
┌─────────────────────────────────────────────────────────┐
│  frontend/  (Next.js 14)                                │
│  • Submit attestation form                              │
│  • Lookup attestation by proof hash                     │
└─────────────────────────────────────────────────────────┘
```

---

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Fill in ATTESTATION_CONTRACT_ID after deploying the contract
```

### 2. Deploy the Stellar contract

```bash
# Install Stellar CLI: https://developers.stellar.org/docs/tools/stellar-cli
stellar contract build --manifest-path contracts/attestation-registry/Cargo.toml

stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/attestation_registry.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>

# Initialize
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- initialize --admin <ADMIN_ADDRESS>
```

### 3. Build the prover

```bash
cd prover
cargo build --release
# Binary: prover/target/release/canon-prover
```

Test it:
```bash
./target/release/canon-prover \
  --model-id "gpt-canon-v1" \
  --manifest examples/manifest.json \
  --output /tmp/proofs
```

### 4. Run backend

```bash
cd backend
npm install
npm run dev
```

### 5. Run frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Docker (all services)

```bash
# Build prover first
cd prover && cargo build --release && cd ..
docker-compose up --build
```

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/prover/prove` | Run ZK prover, returns `proof_hash` + `dataset_merkle_root` |
| `POST` | `/api/attestations` | Submit attestation receipt to Stellar |
| `GET`  | `/api/attestations/:proofHash` | Fetch attestation record from chain |
| `GET`  | `/health` | Health check |

### POST /api/prover/prove
```json
{
  "modelId": "gpt-canon-v1",
  "datasetManifestPath": "/path/to/manifest.json"
}
```

### POST /api/attestations
```json
{
  "proverSecret": "S...",
  "modelId": "gpt-canon-v1",
  "datasetMerkleRoot": "<64 hex chars>",
  "proofHash": "<64 hex chars>"
}
```

---

## Project Structure

```
canon-attestation-hub/
├── contracts/
│   └── attestation-registry/   # Soroban smart contract (Stellar)
├── backend/                    # Express API + Stellar client
├── frontend/                   # Next.js dashboard
├── prover/                     # Rust ZK-ML prover CLI
├── docker-compose.yml
└── .env.example
```

---

## Related

- [canon-provenance-ledger](https://github.com/your-org/canon-provenance-ledger) — the on-chain registry of authorized training files
