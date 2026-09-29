import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

export type AttestationRecord = {
  model_id: string;
  prover: string;
  timestamp: number;
  dataset_merkle_root: string;
  proof_hash: string;
  verified: boolean;
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: "#0d0f12",
    color: "#f0f4f8",
    fontFamily: "Helvetica",
    fontSize: 10,
  },
  header: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: "#222a35",
    borderBottomStyle: "solid",
    paddingBottom: 16,
  },
  logo: {
    fontSize: 12,
    color: "#00e599",
    fontWeight: "bold",
    letterSpacing: 2,
    marginBottom: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#8a99a8",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#8a99a8",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 10,
  },
  fieldContainer: {
    backgroundColor: "#161b22",
    borderRadius: 4,
    padding: 14,
    borderWidth: 1,
    borderColor: "#222a35",
    borderStyle: "solid",
  },
  row: {
    flexDirection: "column",
    marginBottom: 10,
  },
  label: {
    fontSize: 8,
    color: "#8a99a8",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 3,
  },
  value: {
    fontSize: 9.5,
    color: "#e6edf3",
    fontFamily: "Courier",
  },
  badgeVerified: {
    fontSize: 10,
    color: "#00e599",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  badgePending: {
    fontSize: 10,
    color: "#f0a500",
    fontWeight: "bold",
    fontFamily: "Helvetica-Bold",
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: "#222a35",
    borderTopStyle: "solid",
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    color: "#5c6975",
    fontSize: 8,
  },
});

export const AttestationReceiptPDF: React.FC<{ record: AttestationRecord }> = ({ record }) => {
  const formattedDate = new Date(record.timestamp * 1000).toUTCString();

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.logo}>◈ CANON ATTESTATION HUB</Text>
          <Text style={styles.title}>Attestation Receipt</Text>
          <Text style={styles.subtitle}>
            Cryptographic ZK-ML training provenance verification record on Stellar
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Provenance Certificate Details</Text>
          <View style={styles.fieldContainer}>
            <View style={styles.row}>
              <Text style={styles.label}>Model ID</Text>
              <Text style={styles.value}>{record.model_id}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Prover Address</Text>
              <Text style={styles.value}>{record.prover}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Timestamp</Text>
              <Text style={styles.value}>{formattedDate} ({record.timestamp})</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Dataset Merkle Root</Text>
              <Text style={styles.value}>{record.dataset_merkle_root}</Text>
            </View>

            <View style={styles.row}>
              <Text style={styles.label}>Proof Hash</Text>
              <Text style={styles.value}>{record.proof_hash}</Text>
            </View>

            <View style={{ ...styles.row, marginBottom: 0 }}>
              <Text style={styles.label}>Verification Status</Text>
              <Text style={record.verified ? styles.badgeVerified : styles.badgePending}>
                {record.verified ? "✓ VERIFIED ON-CHAIN" : "⏳ PENDING VERIFICATION"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <Text>Canon Attestation Hub · Stellar Soroban Smart Contract</Text>
          <Text>Security & Provenance Engine</Text>
        </View>
      </Page>
    </Document>
  );
};

export default AttestationReceiptPDF;
