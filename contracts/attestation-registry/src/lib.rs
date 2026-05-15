#![no_std]
use soroban_sdk::{
    contract, contractimpl, contracttype, panic_with_error, Address, Bytes, Env, String,
};

/// Ledger TTL extension for persistent attestation entries (~1 year in ledgers at ~5s/ledger)
const PERSISTENT_BUMP_AMOUNT: u32 = 6_312_000;
const PERSISTENT_BUMP_THRESHOLD: u32 = 3_156_000;

#[contracttype]
#[derive(Clone)]
pub struct AttestationRecord {
    pub dataset_merkle_root: Bytes,
    pub proof_hash: Bytes,
    pub prover: Address,
    pub timestamp: u64,
    pub model_id: String,
    pub verified: bool,
}

#[contracttype]
pub enum DataKey {
    Attestation(Bytes),
    AttestationCount,
    Admin,
}

#[contracterror]
#[derive(Copy, Clone, Debug, PartialEq)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotFound = 2,
    Unauthorized = 3,
}

#[contract]
pub struct AttestationRegistry;

#[contractimpl]
impl AttestationRegistry {
    pub fn initialize(env: Env, admin: Address) {
        if env.storage().instance().has(&DataKey::Admin) {
            panic_with_error!(&env, Error::AlreadyInitialized);
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::AttestationCount, &0u64);
    }

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

        let key = DataKey::Attestation(proof_hash.clone());
        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(
            &key,
            PERSISTENT_BUMP_THRESHOLD,
            PERSISTENT_BUMP_AMOUNT,
        );

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

    pub fn verify_attestation(env: Env, proof_hash: Bytes) {
        let admin: Address = env
            .storage()
            .instance()
            .get(&DataKey::Admin)
            .unwrap_or_else(|| panic_with_error!(&env, Error::Unauthorized));
        admin.require_auth();

        let key = DataKey::Attestation(proof_hash.clone());
        let mut record: AttestationRecord = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotFound));
        record.verified = true;
        env.storage().persistent().set(&key, &record);
        env.storage().persistent().extend_ttl(
            &key,
            PERSISTENT_BUMP_THRESHOLD,
            PERSISTENT_BUMP_AMOUNT,
        );
    }

    pub fn get_attestation(env: Env, proof_hash: Bytes) -> AttestationRecord {
        let key = DataKey::Attestation(proof_hash);
        let record: AttestationRecord = env
            .storage()
            .persistent()
            .get(&key)
            .unwrap_or_else(|| panic_with_error!(&env, Error::NotFound));
        env.storage().persistent().extend_ttl(
            &key,
            PERSISTENT_BUMP_THRESHOLD,
            PERSISTENT_BUMP_AMOUNT,
        );
        record
    }

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
        assert!(client.get_attestation(&proof_hash).verified);
    }

    #[test]
    fn test_double_initialize_fails() {
        let env = Env::default();
        env.mock_all_auths();
        let contract_id = env.register_contract(None, AttestationRegistry);
        let client = AttestationRegistryClient::new(&env, &contract_id);
        let admin = Address::generate(&env);
        client.initialize(&admin);
        let result = client.try_initialize(&admin);
        assert!(result.is_err());
    }
}
