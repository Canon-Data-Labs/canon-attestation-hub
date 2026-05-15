import AttestationList from "@/components/AttestationList";
import SubmitForm from "@/components/SubmitForm";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <span className={styles.logo}>◈ CANON</span>
        <h1>Attestation Hub</h1>
        <p className={styles.sub}>ZK-ML training provenance · Stellar blockchain</p>
      </header>
      <div className={styles.grid}>
        <section>
          <h2 className={styles.sectionTitle}>Submit Attestation</h2>
          <SubmitForm />
        </section>
        <section>
          <h2 className={styles.sectionTitle}>Lookup Attestation</h2>
          <AttestationList />
        </section>
      </div>
    </main>
  );
}
