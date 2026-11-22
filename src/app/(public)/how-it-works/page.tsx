import clsx from 'clsx';
import styles from '../styles.module.css';

export default function HowItWorks() {
    return (
        <div className={clsx(styles.container, styles.aboutPage)}>
            <header className={styles.header}>
                <h1 className={styles.title}>How It Works</h1>
                <p className={styles.lede}>
                    JS GBC plays any Game Boy (<code>.gb</code>) or Game Boy Color (<code>.gbc</code>) game. Red, Blue,
                    Green and Yellow, and ROM hacks built on them, get extra Pokémon features on top.
                </p>
            </header>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Adding a game</h2>
                <ol className={styles.steps}>
                    <li>Click <strong>Import Game</strong> in your library.</li>
                    <li>Upload your <code>.gb</code> or <code>.gbc</code> ROM file.</li>
                    <li>Choose a preset cover or upload your own.</li>
                    <li>Fill in the game&apos;s details.</li>
                </ol>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Saving your progress</h2>
                <dl className={styles.facts}>
                    <dt>Save in the game first</dt>
                    <dd>
                        <strong>Save</strong> and <strong>Save As</strong> keep a copy of the game&apos;s own save file
                        in your account. They don&apos;t capture the moment you press them, so save in the game as you
                        would on a real Game Boy, then press Save.
                    </dd>

                    <dt>Save or Save As</dt>
                    <dd>
                        Save updates the file you&apos;re playing. Save As stores a new one, with a title and an
                        optional description, so you can keep more than one.
                    </dd>

                    <dt>Loading and .sav files</dt>
                    <dd>
                        <strong>Load State</strong> lists your saves for the game. From there you can download any of
                        them as a <code>.sav</code>, or import a <code>.sav</code> from a cartridge or another emulator.
                    </dd>
                </dl>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Pokémon features</h2>
                <dl className={styles.facts}>
                    <dt>Memory watchers</dt>
                    <dd>
                        The party view and badge case read the game&apos;s memory as you play. For most Gen 1 games,
                        including many ROM hacks, the addresses are found automatically, so there&apos;s nothing to set
                        up. If a game isn&apos;t detected, set the Active Party and Gym Badges addresses under{' '}
                        <strong>Memory Watchers</strong> when editing the game, with the memory scanner or by hand.{' '}
                        <a
                            href="https://bulbapedia.bulbagarden.net/wiki/Save_data_structure_(Generation_I)"
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.paperLink}
                        >
                            Bulbapedia
                        </a>{' '}
                        is a good reference, since different ROM versions can use different addresses.
                    </dd>

                    <dt>Dynamic backgrounds</dt>
                    <dd>
                        Turn this on under Background in Settings, and the background changes to match where you are
                        in the game. The location is read from the game itself.
                    </dd>
                </dl>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>While you play</h2>
                <p className={styles.paperText}>
                    The session bar beside the game pauses and resumes, changes the game speed, mutes sound and saves. Remap
                    your keyboard controls in Settings. On a phone, the game shows touch controls instead.
                </p>
            </section>
        </div>
    );
}
