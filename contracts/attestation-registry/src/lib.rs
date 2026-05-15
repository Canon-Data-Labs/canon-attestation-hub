#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, Address, Bytes, Env, String, Vec};

/// Stores a ZK-ML training attestation receipt on-chain.
/// The proof verifies the AI model trained only on canon-registered files
/// without exposing model weights.
#[contracttype]
#[derive(Clone)]
pub struct AttestationRecord {
    /// SHA-256 merkle root of the canon dataset used for training
    pub dataset_merkle_root: Bytes,
    /// ZK proof hash (Groth16 / PLONK proof commitment)
    pub proof_hash: Bytes,
    /// Address of the AI engine that submitted the attestation
    pub prover: Address,
    /// Ledger timestamp of submission
    pub timestamp: u64,
    /// Human-readable model identifier
    pub model_id: String,
    /// Whether the proof has been verified on-chain
    pub verified: bool,
}

#[contracttype]
pub enum DataKey {
    Attestation(Bytes), // keyed by proof_hash
    AttestationCount,
    Admin,
}

#[contract]
pub struct AttestationRegistry;

#[contractimpl]
impl AttestationRegistry {
    /// Initialize the contract with an admin address
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AttestationCount, &0u64);
    }

    /// Submit a ZK-ML attestation receipt
    pub fn submit_attestation(
        env: Env,
        prover: Address,
        model_id: String,
        dataset_merkle_root: Bytes,
        proof_hash: Bytes,
    ) -> Bytes {
        prover.require_auth();

        let record = AttestationRecord {
            dataset_merkle_root,
            proof_hash: proof_hash.clone(),
            prover,
            timestamp: env.ledger().timestamp(),
            model_id,
            verified: false,
        };

        env.storage()
            .persistent()
            .set(&DataKey::Attestation(proof_hash.clone()), &record);

        let count: u64 = env
            .storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0);
        env.storage()
            .instance()
            .set(&DataKey::AttestationCount, &(count + 1));

        proof_hash
    }

    /// Admin marks an attestation as verified after off-chain ZK proof check
    pub fn verify_attestation(env: Env, proof_hash: Bytes) {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let key = DataKey::Attestation(proof_hash.clone());
        let mut record: AttestationRecord =
            env.storage().persistent().get(&key).expect("not found");
        record.verified = true;
        env.storage().persistent().set(&key, &record);
    }

    /// Retrieve an attestation by its proof hash
    pub fn get_attestation(env: Env, proof_hash: Bytes) -> AttestationRecord {
        env.storage()
            .persistent()
            .get(&DataKey::Attestation(proof_hash))
            .expect("attestation not found")
    }

    /// Total number of attestations submitted
    pub fn attestation_count(env: Env) -> u64 {
        env.storage()
            .instance()
            .get(&DataKey::AttestationCount)
            .unwrap_or(0)
    }
}

#[cfg(test)]
mod test {
    use super::*;
    use soroban_sdk::{testutils::Address as _, Bytes, Env, String};

    #[test]
    fn test_submit_and_get() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AttestationRegistry);
        let client = AttestationRegistryClient::new(&env, &contract_id);

        let admin = Address::generate(&env);
        client.initialize(&admin);

        let prover = Address::generate(&env);
        let model_id = String::from_str(&env, "gpt-canon-v1");
        let merkle_root = Bytes::from_slice(&env, &[0u8; 32]);
        let proof_hash = Bytes::from_slice(&env, &[1u8; 32]);

        client.submit_attestation(&prover, &model_id, &merkle_root, &proof_hash);

        let record = client.get_attestation(&proof_hash);
        assert!(!record.verified);
        assert_eq!(client.attestation_count(), 1);

        client.verify_attestation(&proof_hash);
        let record = client.get_attestation(&proof_hash);
        assert!(record.verified);
    }
}
