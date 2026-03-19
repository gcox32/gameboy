import Footer from '@/components/layout/Footer';
import DynamicBackground from '@/components/layout/DynamicBackground';
import HomeButtons from '@/components/layout/HomeButtons';
import styles from './home.module.css';

export default function Home() {
  return (
      <DynamicBackground>
        <div className={styles.hero}>
          <h1 className={styles.heroTitle}>JS GBC</h1>
          <p className={styles.heroSubtitle}>
            Play your Gameboy again, this time in your browser.
          </p>
          <HomeButtons />
        </div>
        <Footer />
      </DynamicBackground>
  );
}