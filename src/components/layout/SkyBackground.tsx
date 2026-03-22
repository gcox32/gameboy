'use client';

import { useMemo, ReactNode } from 'react';
import styles from '@/app/home.module.css';
import { getCurrentSkyConfig } from '@/lib/sky';

interface SkyBackgroundProps {
  children: ReactNode;
}

export default function SkyBackground({ children }: SkyBackgroundProps) {
  const config = useMemo(() => getCurrentSkyConfig(), []);

  return (
    <div className={styles.homeContainer} style={{ background: config.topColor }}>
      {config.starOpacity > 0 && (
        <div
          className={styles.starfield}
          style={{ opacity: config.starOpacity, zIndex: 3 }}
          aria-hidden="true"
        >
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
      {children}
    </div>
  );
}
