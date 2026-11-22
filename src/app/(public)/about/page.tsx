import Image from 'next/image';
import Link from 'next/link';
import clsx from 'clsx';
import { artUrl } from '@/lib/assets';
import styles from '../styles.module.css';

const AboutPage = () => {
  return (
    <div className={clsx(styles.container, styles.aboutPage)}>
      <header className={styles.header}>
        <h1 className={styles.title}>About JS GBC</h1>
        <p className={styles.lede}>
          A Game Boy and Game Boy Color emulator that runs in your browser. Your games and saves live in your
          account, so you can pick up where you left off on any device.
        </p>
      </header>

      <section className={styles.paperCard}>
        <h2 className={styles.paperTitle}>Getting started</h2>
        <ol className={styles.steps}>
          <li>
            <strong>Create an account.</strong> Sign up with your email, then enter the 6-digit code we send you.
          </li>
          <li>
            <strong>Add a game.</strong> Import a <code>.gb</code> or <code>.gbc</code> ROM you own and choose a cover.
          </li>
          <li>
            <strong>Play.</strong> Use the keyboard on desktop (remap keys in Settings) or touch controls on
            your phone.
          </li>
          <li>
            <strong>Bring your saves.</strong> Import a <code>.sav</code> from a cartridge or another emulator, and
            download yours whenever you like.
          </li>
        </ol>
        <div className={styles.cardActions}>
          <Link href="/signup" className={styles.paperLink}>Create an account →</Link>
          <Link href="/how-it-works" className={styles.paperLink}>How it works →</Link>
        </div>
      </section>

      <section className={styles.paperCard}>
        <h2 className={styles.paperTitle}>Made for Gen 1 Pokémon</h2>
        <p className={styles.paperText}>
          Any Game Boy game plays, but Red, Blue, Green and Yellow, and ROM hacks built on them, get extras:
        </p>
        <ul className={styles.paperList}>
          <li>Your party, badges, Pokédex and Town Map, read live from the game.</li>
          <li>A background that follows where you are in the game.</li>
          <li>
            <strong>Oak&apos;s Lab</strong>: move Pokémon out of one save and into another, or edit them.
          </li>
          <li>
            <strong>The Ranch</strong>: where the Pokémon you&apos;ve moved out live, shared across all your games.
          </li>
        </ul>
      </section>

      <section className={styles.paperCard}>
        <h2 className={styles.paperTitle}>Good to know</h2>
        <dl className={styles.facts}>
          <dt>Bring your own games</dt>
          <dd>JS GBC doesn&apos;t provide or host ROMs. Use copies you made from cartridges you own.</dd>

          <dt>Save in the game first</dt>
          <dd>
            The Save button keeps a copy of the game&apos;s own save file in your account, not a snapshot of the
            moment. Save in the game as you would on the cartridge, then press Save.
          </dd>

          <dt>Free and open source</dt>
          <dd>
            The emulator core is adapted from{' '}
            <a href="https://github.com/taisel/GameBoy-Online" target="_blank" rel="noopener noreferrer" className={styles.paperLink}>
              GameBoy-Online
            </a>
            . The rest is built with Next.js and MongoDB, and the code is{' '}
            <a href="https://github.com/gcox32/gameboy" target="_blank" rel="noopener noreferrer" className={styles.paperLink}>
              on GitHub
            </a>
            . Found a bug or have an idea? <Link href="/contact" className={styles.paperLink}>Get in touch</Link>.
          </dd>
        </dl>
      </section>

      <section className={styles.legal}>
        <h2 className={styles.sectionTitle}>Legal</h2>
        <ul className={styles.featureList}>
          <li>Game Boy and Game Boy Color are trademarks of Nintendo Co., Ltd. All rights reserved.</li>
          <li>Downloading copied ROMs is illegal: only use images you have created from ROMs you own yourself.</li>
          <li>JS GBC and Grant Cox are in no way affiliated with Nintendo Co., Ltd.</li>
        </ul>
      </section>

      <div className={styles.imageContainer}>
        <Image
          src={artUrl('091', 'sugimori-rb')}
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
