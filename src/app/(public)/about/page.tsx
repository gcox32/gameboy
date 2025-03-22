import styles from '../styles.module.css';
import Image from 'next/image';
import Link from 'next/link';

const AboutPage = () => {
  return (
    <div className={`${styles.container} ${styles.aboutPage}`}>
      <header className={styles.header}>
        <h1 className={styles.title}>About JS GBC</h1>
      </header>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>What is JS GBC?</h2>
        <p className={styles.paragraph}>
          JS GBC is a web-based GameBoy Color emulator that lets you play your favorite games directly in your browser.
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Technical Details</h2>
        <p className={styles.paragraph}>
          The core emulator mechanics were adapted from the <a href="https://github.com/taisel/GameBoy-Online" target="_blank" rel="noopener noreferrer">GameBoy-Online</a> project, with significant modifications and improvements. Our implementation uses Next.js for the frontend and AWS Amplify for backend services, providing features like:
        </p>
        <ul className={styles.featureList}>
          <li>Cloud save states</li>
          <li>Mobile device support</li>
          <li>Game library management</li>
          <li>Game-specific features</li>
        </ul>
        <p className={styles.paragraph}>
          <Link href="/how-it-works" className={styles.link}>Learn more about how it works →</Link>
        </p>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Open Source</h2>
        <p className={styles.paragraph}>
          {`JS GBC is an open-source project, and we welcome contributions from the community. Whether you're a developer, designer, or just want to make it better, there are ways to get involved:`}
        </p>
        <div className={styles.buttonContainer}>
          <Link
            href="https://github.com/gcox32/gameboy"
            target="_blank"
            rel="noopener noreferrer"
            className={styles.link}
          >
            Contribute
          </Link>
          <Link
            href="/contact"
            className={styles.link}
          >
            Contact Us
          </Link>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.sectionTitle}>Legal Notice</h2>
        <p className={styles.paragraph}>
          JS GBC is an emulator only - we do not provide or host any game ROMs. Users are responsible for providing their own game files.
        </p>
      </section>

      <div className={styles.imageContainer}>
        <Image
          src="https://assets.letmedemo.com/public/gameboy/images/pokemon/sugimori/rb/091.png"
          alt="Cloyster Pokemon"
          width={200}
          height={200}
          className={styles.mascotImage}
        />
      </div>
    </div>
  );
};

export default AboutPage;