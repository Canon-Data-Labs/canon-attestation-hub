"use client";
import { useState } from "react";
import styles from "./AttestationList.module.css";

const API = process.env.NEXT_PUBLIC_API_URL;

type Record = {
  model_id: string;
  prover: string;
  timestamp: number;
  dataset_merkle_root: string;
  proof_hash: string;
  verified: boolean;
};

export default function AttestationList() {
  const [hash, setHash] = useState("");
  const [record, setRecord] = useState<Record | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecord(null);
    try {
      const res = await fetch(`${API}/api/attestations/${hash}`);
      if (!res.ok) throw new Error((await res.json()).error);
      setRecord(await res.json());
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <form onSubmit={lookup} className={styles.form}>
        <input
          value={hash}
          onChange={(e) => setHash(e.target.value)}
          placeholder="Proof hash (hex 64)"
          pattern="[0-9a-fA-F]{64}"
          required
        />
        <button type="submit" disabled={loading}>{loading ? "…" : "Lookup"}</button>
      </form>
      {error && <p className={styles.error}>{error}</p>}
      {record && (
        <dl className={styles.record}>
          <dt>Model</dt><dd>{record.model_id}</dd>
          <dt>Prover</dt><dd className={styles.mono}>{record.prover}</dd>
          <dt>Timestamp</dt><dd>{new Date(record.timestamp * 1000).toISOString()}</dd>
          <dt>Merkle Root</dt><dd className={styles.mono}>{record.dataset_merkle_root}</dd>
          <dt>Verified</dt>
          <dd className={record.verified ? styles.verified : styles.pending}>
            {record.verified ? "✓ VERIFIED" : "⏳ PENDING"}
          </dd>
        </dl>
      )}
    </div>
  );
}
