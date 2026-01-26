import Link from 'next/link';
import Footer from '@/components/layout/Footer';
import StarfieldContainer from '@/components/layout/StarfieldContainer';
import styles from './home.module.css';

export default function Home() {
  return (
      <StarfieldContainer>
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

        <section className={styles.features}>
          <p className={styles.sectionSubtitle}>
            The classics you love, now with save states that should actually survive.
          </p>
          <div className={styles.featuresGrid}>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Zero Downloads</h3>
              <p className={styles.featureDescription}>
                No cartridge blowing required. Play instantly in any modern browser —
                desktop, tablet, or phone.
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Cloud Saves</h3>
              <p className={styles.featureDescription}>
                Your save files live in the cloud. Switch devices mid-adventure.
                Your progress follows you everywhere.
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Touch Controls</h3>
              <p className={styles.featureDescription}>
                Full touch support for mobile. D-pad and buttons feel just right.
                Play on the bus like it&apos;s 1998.
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Deep Integration</h3>
              <p className={styles.featureDescription}>
                Live Pokedex tracking, team stats, and more for supported games.
                See your journey unfold in real-time.
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Your Library</h3>
              <p className={styles.featureDescription}>
                Build out your game catalog and jump back into any
                save with a single click.
              </p>
            </div>
            <div className={styles.featureCard}>
              <h3 className={styles.featureTitle}>Private & Secure</h3>
              <p className={styles.featureDescription}>
                I just put this card here for the symmetry of
                the page, but yea, your data is yours.
              </p>
            </div>
          </div>
        </section>
        <Footer />
      </StarfieldContainer>
  );
}