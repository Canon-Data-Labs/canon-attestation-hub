"use client";

import styles from "./error.module.css";

export default function Error({
reset,
}: {
reset: () => void;
}) {
return ( <main className={styles.container}> <span className={styles.logo}>◈ CANON</span>

  <h1 className={styles.code}>500</h1>

  <h2 className={styles.title}>VERIFICATION ERROR</h2>

  <p className={styles.description}>
    An unexpected error occurred while processing your request.
  </p>

  <button onClick={() => reset()}>
    Retry
  </button>
</main>

);
}
