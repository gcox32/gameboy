'use client';

import styles from '@/app/home.module.css';

interface StarfieldContainerProps {
  children: React.ReactNode;
  hideScanlines?: boolean;
}

export default function StarfieldContainer({ children, hideScanlines = false }: StarfieldContainerProps) {
  const containerClass = hideScanlines ? styles.homeContainerNoScanlines : styles.homeContainer;

  return (
    <div className={containerClass}>
      <div className={styles.starfield} aria-hidden="true">
        <div className={`${styles.stars} ${styles.stars1}`} />
        <div className={`${styles.stars} ${styles.stars2}`} />
        <div className={`${styles.stars} ${styles.stars3}`} />
        <div className={`${styles.stars} ${styles.stars4}`} />
        <div className={`${styles.stars} ${styles.stars5}`} />
        <div className={`${styles.stars} ${styles.stars6}`} />
        <div className={`${styles.stars} ${styles.stars7}`} />
      </div>
      {children}
    </div>
  );
}
