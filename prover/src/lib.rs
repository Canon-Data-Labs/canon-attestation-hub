use sha2::{Digest, Sha256};

/// Compute SHA-256 merkle root from a list of file hashes (hex strings).
pub fn merkle_root(leaves: &[String]) -> Vec<u8> {
    if leaves.is_empty() {
        return vec![0u8; 32];
    }

    let mut layer: Vec<[u8; 32]> = leaves
        .iter()
        .map(|h| {
            let bytes = hex::decode(h).unwrap_or_else(|_| {
                let mut hasher = Sha256::new();
                hasher.update(h.as_bytes());
                hasher.finalize().to_vec()
            });
            let mut arr = [0u8; 32];
            arr.copy_from_slice(&bytes[..32.min(bytes.len())]);
            arr
        })
        .collect();

    while layer.len() > 1 {
        if layer.len() % 2 != 0 {
            layer.push(*layer.last().unwrap());
        }
        layer = layer
            .chunks(2)
            .map(|pair| {
                let mut hasher = Sha256::new();
                hasher.update(pair[0]);
                hasher.update(pair[1]);
                let result = hasher.finalize();
                let mut arr = [0u8; 32];
                arr.copy_from_slice(&result);
                arr
            })
            .collect();
    }

    layer[0].to_vec()
}

/// Compute a proof commitment hash from the merkle root + model_id.
/// In production this would be a real Groth16 proof; here we produce
/// a deterministic commitment suitable for on-chain submission.
pub fn compute_proof_hash(merkle_root: &[u8], model_id: &str) -> Vec<u8> {
    let mut hasher = Sha256::new();
    hasher.update(b"canon-zk-ml-v1:");
    hasher.update(merkle_root);
    hasher.update(b":");
    hasher.update(model_id.as_bytes());
    hasher.finalize().to_vec()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_merkle_root_single() {
        let leaves = vec!["aabbcc".to_string()];
        let root = merkle_root(&leaves);
        assert_eq!(root.len(), 32);
    }

    #[test]
    fn test_merkle_root_even() {
        let leaves = vec!["aa".to_string(), "bb".to_string()];
        let r1 = merkle_root(&leaves);
        let r2 = merkle_root(&leaves);
        assert_eq!(r1, r2); // deterministic
    }

    #[test]
    fn test_proof_hash() {
        let root = vec![0u8; 32];
        let h = compute_proof_hash(&root, "test-model");
        assert_eq!(h.len(), 32);
    }
}
