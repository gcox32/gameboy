'use client';

import { useMemo } from 'react';
import styles from '@/app/home.module.css';

interface DynamicBackgroundProps {
  children: React.ReactNode;
}

type SkyPeriod = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk';

interface SkyConfig {
  gradient: string;
  starOpacity: number;
}

function getSkyPeriod(hour: number): SkyPeriod {
  if (hour >= 22 || hour < 5)  return 'night';
  if (hour < 7)                return 'dawn';
  if (hour < 10)               return 'morning';
  if (hour < 14)               return 'midday';
  if (hour < 18)               return 'afternoon';
  return 'dusk';
}

const SKY_CONFIGS: Record<SkyPeriod, SkyConfig> = {
  night: {
    gradient: 'linear-gradient(180deg, #0d0d1a 0%, #16213e 30%, #0f3460 60%, #0a0a1a 100%)',
    starOpacity: 1,
  },
  dawn: {
    gradient: 'linear-gradient(180deg, #1a0a2e 0%, #6b2d6e 35%, #c85a2a 70%, #f0a060 100%)',
    starOpacity: 0.25,
  },
  morning: {
    // Soft, hazy — sun still climbing, low saturation
    gradient: 'linear-gradient(180deg, #3a7a9e 0%, #6aaec8 40%, #a8d4e8 75%, #f5e8c0 100%)',
    starOpacity: 0,
  },
  midday: {
    // Peak brightness — vivid saturated blue
    gradient: 'linear-gradient(180deg, #0878c8 0%, #2898e8 40%, #58c0f8 75%, #a8e0ff 100%)',
    starOpacity: 0,
  },
  afternoon: {
    // Bright but warmth building — gold bleeds into the horizon
    gradient: 'linear-gradient(180deg, #0a5a9a 0%, #1e7ac0 40%, #50a8d8 70%, #d8a830 100%)',
    starOpacity: 0,
  },
  dusk: {
    gradient: 'linear-gradient(180deg, #0d0d1a 0%, #6b1a4a 30%, #c83c1e 65%, #f07820 100%)',
    starOpacity: 0.15,
  },
};

export default function DynamicBackground({ children }: DynamicBackgroundProps) {
  const config = useMemo(() => {
    const hour = new Date().getHours();
    const period = getSkyPeriod(hour);
    return SKY_CONFIGS[period];
  }, []);

  return (
    <div className={styles.homeContainer}>
      <div className={styles.bgHalfway} style={{ zIndex: 1 }} aria-hidden="true" />
      <div
        className={styles.skyGradient}
        style={{ background: config.gradient, zIndex: 2 }}
        aria-hidden="true"
      />
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
      <div className={styles.bgFront} style={{ zIndex: 4 }} aria-hidden="true" />
      {children}
    </div>
  );
}
