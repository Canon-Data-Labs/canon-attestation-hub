use canon_prover::{compute_proof_hash, merkle_root};
use clap::Parser;
use serde::{Deserialize, Serialize};
use std::{fs, path::PathBuf};

/// canon-prover: generate a ZK-ML attestation receipt
#[derive(Parser)]
#[command(version, about)]
struct Args {
    /// Model identifier
    #[arg(long)]
    model_id: String,

    /// Path to JSON manifest listing canon file hashes
    #[arg(long)]
    manifest: PathBuf,

    /// Directory to write proof output
    #[arg(long, default_value = "/tmp/proofs")]
    output: PathBuf,
}

/// Manifest format: list of SHA-256 hex hashes of canon dataset files
#[derive(Deserialize)]
struct Manifest {
    files: Vec<FileEntry>,
}

#[derive(Deserialize)]
struct FileEntry {
    hash: String, // SHA-256 hex of the file content
}

#[derive(Serialize)]
struct ProofOutput {
    proof_hash: String,
    dataset_merkle_root: String,
    model_id: String,
}

fn main() -> anyhow::Result<()> {
    let args = Args::parse();

    let manifest_str = fs::read_to_string(&args.manifest)?;
    let manifest: Manifest = serde_json::from_str(&manifest_str)?;

    let leaves: Vec<String> = manifest.files.into_iter().map(|f| f.hash).collect();
    let root = merkle_root(&leaves);
    let proof = compute_proof_hash(&root, &args.model_id);

    let output = ProofOutput {
        proof_hash: hex::encode(&proof),
        dataset_merkle_root: hex::encode(&root),
        model_id: args.model_id,
    };

    fs::create_dir_all(&args.output)?;
    let out_path = args.output.join(format!("{}.json", &output.proof_hash[..16]));
    fs::write(&out_path, serde_json::to_string_pretty(&output)?)?;

    // Print JSON to stdout for the backend to parse
    println!("{}", serde_json::to_string(&output)?);
    Ok(())
}
