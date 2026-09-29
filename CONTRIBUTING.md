# Contributing to Canon Attestation Hub

Thank you for your interest in contributing to **Canon Attestation Hub**! This document provides comprehensive guidelines for setting up the environment locally, developing across different components, running tests, and submitting pull requests.

---

## 📁 Repository Structure

The repository is organized as a multi-component workspace:

```text
canon-attestation-hub/
├── contracts/
│   └── attestation-registry/   # Soroban smart contract on Stellar (Rust)
├── prover/                     # ZK-ML prover CLI and merkle commitment engine (Rust)
├── backend/                    # Express REST API and Stellar Soroban RPC client (TypeScript / Node.js)
├── frontend/                   # Web dashboard for attestation submissions & lookup (Next.js 14 / React)
├── docker-compose.yml          # Containerized orchestration for all services
└── .env.example                # Template for environment variables
```

---

## 🛠️ Prerequisites

Ensure you have the following tools installed:

- **Node.js**: v18+ and `npm`
- **Rust & Cargo**: Latest stable toolchain (`rustup default stable`)
- **WebAssembly Target**: `rustup target add wasm32-unknown-unknown`
- **Stellar CLI**: Follow the [Stellar CLI installation guide](https://developers.stellar.org/docs/tools/stellar-cli)
- **Docker & Docker Compose** (optional for local multi-service testing)

---

## 🚀 Running Components Locally

### 1. Environment Configuration

Copy the example environment file and customize it:

```bash
cp .env.example .env
```

Key environment variables:
- `ATTESTATION_CONTRACT_ID`: Deployed Soroban contract ID.
- `SOROBAN_RPC_URL`: Soroban RPC endpoint (e.g. `https://soroban-testnet.stellar.org`).
- `SOROBAN_SOURCE_PUBLIC_KEY`: Stellar public address used for read simulations.
- `NEXT_PUBLIC_API_URL`: Backend API URL (default: `http://localhost:3001`).

---

### 2. Smart Contracts (`contracts/attestation-registry`)

Build and deploy the Soroban smart contract:

```bash
# Build WASM binary
stellar contract build --manifest-path contracts/attestation-registry/Cargo.toml

# Deploy to testnet
stellar contract deploy \
  --wasm target/wasm32-unknown-unknown/release/attestation_registry.wasm \
  --network testnet \
  --source <YOUR_SECRET_KEY>

# Initialize contract
stellar contract invoke \
  --id <CONTRACT_ID> \
  --network testnet \
  --source <YOUR_SECRET_KEY> \
  -- initialize --admin <ADMIN_ADDRESS>
```

---

### 3. Rust Prover (`prover`)

Build the CLI binary:

```bash
cd prover
cargo build --release
```

Run a test proof generation:

```bash
./target/release/canon-prover \
  --model-id "gpt-canon-v1" \
  --manifest examples/manifest.json \
  --output /tmp/proofs
```

---

### 4. Backend Service (`backend`)

Install dependencies and start the development server:

```bash
cd backend
npm install
npm run dev
# Server runs on http://localhost:3001
```

To build for production:

```bash
npm run build
npm start
```

---

### 5. Frontend Application (`frontend`)

Install dependencies and start Next.js in development mode:

```bash
cd frontend
npm install
npm run dev
# Dashboard available at http://localhost:3000
```

To build for production:

```bash
npm run build
npm start
```

---

### 6. Full Stack via Docker

Run all services together using Docker Compose:

```bash
# Build prover binary first
cd prover && cargo build --release && cd ..

# Launch containers
docker-compose up --build
```

---

## 🧪 Running Tests

Ensure all tests pass before submitting changes:

### Rust Workspace Tests (Contracts & Prover)
```bash
cargo test
```

### Backend Build & Type Checks
```bash
cd backend
npm run build
```

### Frontend Build & Linting
```bash
cd frontend
npm run build
```

---

## 🌿 Branch Naming Conventions

Create focused, descriptive branches following these patterns:

| Prefix | Description | Example |
| :--- | :--- | :--- |
| `feat/` | New features or enhancements | `feat/pdf-receipt-export` |
| `fix/` | Bug fixes and patches | `fix/merkle-slice-bounds` |
| `docs/` | Documentation improvements | `docs/contributing-guide` |
| `refactor/` | Code refactoring without behavior change | `refactor/api-client` |
| `test/` | Adding or updating tests | `test/contract-invariants` |

---

## 🔄 Pull Request & Contribution Process

1. **Fork the Repository**: Fork on GitHub and clone your fork locally.
2. **Create a Feature Branch**: Branch off `main` (or the specified target base branch).
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. **Develop and Test**: Implement your changes and verify that all tests pass (`cargo test`, `npm run build`).
4. **Commit Changes**: Use clear, concise commit messages following Conventional Commits format:
   ```bash
   git commit -m "feat(frontend): add attestation receipt PDF export (closes #100)"
   ```
5. **Push to Fork**:
   ```bash
   git push -u origin feat/your-feature-name
   ```
6. **Open a Pull Request**:
   - Provide a clear summary of the changes and motivation.
   - List testing steps and validation performed.
   - Reference and close corresponding issues using `closes #<issue_number>`.

Thank you for helping build secure, verifiable AI provenance on Stellar!
