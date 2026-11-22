import Link from 'next/link';
import clsx from 'clsx';
import styles from '../styles.module.css';

const SUPPORT = 'support@grantcox.net';

export default function TermsOfService() {
    return (
        <div className={clsx(styles.container, styles.aboutPage)}>
            <header className={styles.header}>
                <h1 className={styles.title}>Terms of Service</h1>
                <p className={styles.lede}>
                    The ground rules for using JS GBC. By creating an account or using the site, you agree to them.
                    Last updated November 2026.
                </p>
            </header>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Your account</h2>
                <ul className={styles.paperList}>
                    <li>You must be 13 or older to create an account.</li>
                    <li>Use an email address you can receive mail at, and keep your password to yourself.</li>
                    <li>You&apos;re responsible for what happens under your account.</li>
                </ul>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Your games</h2>
                <dl className={styles.facts}>
                    <dt>Bring your own</dt>
                    <dd>
                        JS GBC doesn&apos;t provide or sell games. Only upload ROMs and saves you have the right to use,
                        such as copies you made from cartridges you own.
                    </dd>

                    <dt>Kept private</dt>
                    <dd>
                        Files you upload are stored privately for your account. They aren&apos;t shared, listed or
                        made available to anyone else.
                    </dd>

                    <dt>Copyright</dt>
                    <dd>
                        We may remove files and close accounts that infringe someone&apos;s rights. To report
                        infringement, email <a href={`mailto:${SUPPORT}`} className={styles.paperLink}>{SUPPORT}</a>.
                    </dd>
                </dl>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Fair use of the site</h2>
                <p className={styles.paperText}>When using JS GBC, don&apos;t:</p>
                <ul className={styles.paperList}>
                    <li>Break the law, or use the site to infringe anyone&apos;s rights.</li>
                    <li>Try to get into other people&apos;s accounts or files, or get around the site&apos;s security.</li>
                    <li>Overload the site, or use bots or scripts against it.</li>
                </ul>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>The service</h2>
                <dl className={styles.facts}>
                    <dt>Provided as is</dt>
                    <dd>
                        JS GBC is a free hobby project, offered without warranties. It may have bugs, be unavailable at
                        times, or change. Download your saves as <code>.sav</code> files if you want your own backups.
                    </dd>

                    <dt>Changes and closure</dt>
                    <dd>
                        We may change or discontinue the site. We&apos;ll try to give notice first, so you can download
                        your saves.
                    </dd>

                    <dt>Liability</dt>
                    <dd>
                        To the extent the law allows, we aren&apos;t liable for lost data, lost progress or other
                        damages from using the site.
                    </dd>

                    <dt>Ending your account</dt>
                    <dd>
                        You can ask us to delete your account at any time; see the{' '}
                        <Link href="/privacy-policy" className={styles.paperLink}>Privacy Policy</Link>. We may suspend
                        or close accounts that break these terms.
                    </dd>
                </dl>
            </section>

            <section className={styles.legal}>
                <h2 className={styles.sectionTitle}>Trademarks and contact</h2>
                <ul className={styles.featureList}>
                    <li>Game Boy and Game Boy Color are trademarks of Nintendo Co., Ltd.</li>
                    <li>Pokémon is a trademark of Nintendo, Creatures Inc. and GAME FREAK inc.</li>
                    <li>JS GBC is not affiliated with or endorsed by any of them.</li>
                </ul>
                <p className={styles.paragraph}>
                    If these terms change, the date at the top changes with them. Questions go to{' '}
                    <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>.
                </p>
            </section>
        </div>
    );
}
