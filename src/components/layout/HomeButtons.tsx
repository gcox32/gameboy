'use client';

import { useRouter } from 'next/navigation';
import styles from '@/app/home.module.css';
import { navigateWithTransition } from '@/lib/transition';

export default function HomeButtons() {
  const router = useRouter();

  return (
    <div className={styles.ctaButtons}>
      <button onClick={() => navigateWithTransition(router.push, '/signup', 'up')}>New Game</button>
      <button onClick={() => navigateWithTransition(router.push, '/login', 'up')}>Load Game</button>
    </div>
  );
}
