'use client';

import { useMemo, ReactNode } from 'react';
import styles from '@/app/home.module.css';
import { getCurrentSkyConfig } from '@/lib/sky';

interface DynamicBackgroundProps {
  children: ReactNode;
}

export default function DynamicBackground({ children }: DynamicBackgroundProps) {
  const config = useMemo(() => getCurrentSkyConfig(), []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.skyGradient} style={{ background: config.gradient }} aria-hidden="true" />
      {config.starOpacity > 0 && (
        <div className={styles.starfield} style={{ opacity: config.starOpacity }} aria-hidden="true">
          <div className={`${styles.stars} ${styles.stars1}`} />
          <div className={`${styles.stars} ${styles.stars2}`} />
          <div className={`${styles.stars} ${styles.stars3}`} />
          <div className={`${styles.stars} ${styles.stars4}`} />
          <div className={`${styles.stars} ${styles.stars5}`} />
          <div className={`${styles.stars} ${styles.stars6}`} />
          <div className={`${styles.stars} ${styles.stars7}`} />
          <div className={`${styles.stars} ${styles.stars8}`} />
        </div>
      )}
      <div className={styles.bgHalfway} aria-hidden="true" />
      <div className={styles.bgFront} aria-hidden="true" />
      {children}
    </div>
  );
}
