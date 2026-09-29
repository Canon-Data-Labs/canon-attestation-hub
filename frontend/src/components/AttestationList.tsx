"use client";
import { useState } from "react";
import styles from "./AttestationList.module.css";

const API = process.env.NEXT_PUBLIC_API_URL;

type Record = {
  model_id: string;
  prover: string;
  timestamp: number;
  dataset_merkle_root: string;
  proof_hash?: string;
  verified: boolean;
};

export default function AttestationList() {
  const [hash, setHash] = useState("");
  const [record, setRecord] = useState<Record | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [generatingPdf, setGeneratingPdf] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setRecord(null);
    try {
      const res = await fetch(`${API}/api/attestations/${hash}`);
      if (!res.ok) throw new Error((await res.json()).error);
      const data = await res.json();
      setRecord({
        ...data,
        proof_hash: data.proof_hash || hash,
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReceipt = async () => {
    if (!record) return;
    setGeneratingPdf(true);
    try {
      const { pdf } = await import("@react-pdf/renderer");
      const { AttestationReceiptPDF } = await import("./AttestationReceiptPDF");
      const fullRecord = {
        model_id: record.model_id,
        prover: record.prover,
        timestamp: record.timestamp,
        dataset_merkle_root: record.dataset_merkle_root,
        proof_hash: record.proof_hash || hash,
        verified: record.verified,
      };
      const blob = await pdf(<AttestationReceiptPDF record={fullRecord} />).toBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `attestation-receipt-${(fullRecord.proof_hash).slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error("Failed to generate PDF:", err);
      setError(err?.message || "Failed to generate receipt PDF");
    } finally {
      setGeneratingPdf(false);
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
        <div className={styles.recordWrapper}>
          <dl className={styles.record}>
            <dt>Model</dt><dd>{record.model_id}</dd>
            <dt>Prover</dt><dd className={styles.mono}>{record.prover}</dd>
            <dt>Timestamp</dt><dd>{new Date(record.timestamp * 1000).toISOString()}</dd>
            <dt>Merkle Root</dt><dd className={styles.mono}>{record.dataset_merkle_root}</dd>
            <dt>Proof Hash</dt><dd className={styles.mono}>{record.proof_hash || hash}</dd>
            <dt>Verified</dt>
            <dd className={record.verified ? styles.verified : styles.pending}>
              {record.verified ? "✓ VERIFIED" : "⏳ PENDING"}
            </dd>
          </dl>
          <button
            type="button"
            className={styles.downloadButton}
            onClick={handleDownloadReceipt}
            disabled={generatingPdf}
          >
            {generatingPdf ? "Generating PDF…" : "Download Receipt"}
          </button>
        </div>
      )}
    </div>
  );
}
