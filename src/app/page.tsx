import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import DynamicBackground from '@/components/layout/DynamicBackground';
import styles from './home.module.css';

export default function Home() {
  return (
      <DynamicBackground>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>JS GBC</h1>
          <p className={styles.heroSubtitle}>
            Relive the magic of your Game Boy, right in your browser.
          </p>
            <div className={styles.ctaButtons}>
              <Link href="/signup">
                <button>New Game</button>
              </Link>
              <Link href="/login">
                <button>Load Game</button>
              </Link>
            </div>
        </div>
        <Footer />
      </DynamicBackground>
  );
}