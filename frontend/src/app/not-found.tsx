import Link from "next/link";
import styles from "./not-found.module.css";

export default function NotFound() {
return ( <main className={styles.container}> <span className={styles.logo}>◈ CANON</span>

  <h1 className={styles.code}>404</h1>

  <h2 className={styles.title}>ATTESTATION NOT FOUND</h2>

  <p className={styles.description}>
    The requested attestation record does not exist or may have been removed from the registry.
  </p>

  <Link href="/" className={styles.button}>
    Return Home
  </Link>
</main>

);
}
