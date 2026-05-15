"use client";
import { useState } from "react";
import styles from "./SubmitForm.module.css";

const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export default function SubmitForm() {
  const [form, setForm] = useState({
    proverSecret: "",
    modelId: "",
    datasetMerkleRoot: "",
    proofHash: "",
  });
  const [result, setResult] = useState<{ txHash?: string; error?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch(`${API}/api/attestations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `HTTP ${res.status}`);
      setResult(data);
    } catch (err: any) {
      setResult({ error: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <label>Model ID
        <input name="modelId" value={form.modelId} onChange={handleChange} placeholder="gpt-canon-v1" required />
      </label>
      <label>Dataset Merkle Root (hex 64)
        <input name="datasetMerkleRoot" value={form.datasetMerkleRoot} onChange={handleChange} placeholder="a3f2..." required pattern="[0-9a-fA-F]{64}" />
      </label>
      <label>Proof Hash (hex 64)
        <input name="proofHash" value={form.proofHash} onChange={handleChange} placeholder="b7c1..." required pattern="[0-9a-fA-F]{64}" />
      </label>
      <label>Prover Secret Key
        <input name="proverSecret" type="password" value={form.proverSecret} onChange={handleChange} placeholder="S..." required />
      </label>
      <button type="submit" disabled={loading}>{loading ? "Submitting…" : "Submit Attestation"}</button>
      {result && (
        <div className={result.error ? styles.error : styles.success}>
          {result.error ? `Error: ${result.error}` : `TX: ${result.txHash}`}
        </div>
      )}
    </form>
  );
}
