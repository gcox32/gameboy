import Link from 'next/link';
import clsx from 'clsx';
import styles from '../styles.module.css';

const SUPPORT = 'support@grantcox.net';

export default function PrivacyPolicy() {
    return (
        <div className={clsx(styles.container, styles.aboutPage)}>
            <header className={styles.header}>
                <h1 className={styles.title}>Privacy Policy</h1>
                <p className={styles.lede}>
                    JS GBC is a small hobby project. It collects what it needs to run your account and nothing to sell.
                    Last updated November 2026.
                </p>
            </header>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>What we keep</h2>
                <dl className={styles.facts}>
                    <dt>Your account</dt>
                    <dd>
                        Your email address and a hashed copy of your password. The password itself is never stored.
                    </dd>

                    <dt>Your profile</dt>
                    <dd>
                        A username, which starts as the part of your email before the @, and the bio and profile
                        picture if you add them.
                    </dd>

                    <dt>Files you upload</dt>
                    <dd>
                        Game ROMs, cover images, save files and the screenshot taken when you save. These are stored
                        privately: only your signed-in account can open them.
                    </dd>

                    <dt>Your games and Pokémon</dt>
                    <dd>
                        The details of the games you add, your saves, and Pokémon you move to the Ranch through
                        Oak&apos;s Lab.
                    </dd>

                    <dt>Sign-in protection</dt>
                    <dd>
                        To slow down password guessing and email spam, we count recent sign-in, sign-up and email
                        requests by email address and IP address. Each count is deleted automatically within an hour.
                    </dd>
                </dl>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>How it&apos;s used</h2>
                <ul className={styles.paperList}>
                    <li>To run your account, and to store and load your games and saves.</li>
                    <li>
                        To send account emails: your verification code and password reset links. Nothing else is sent:
                        no newsletters or marketing.
                    </li>
                    <li>We don&apos;t sell your information, show ads, or share it for anyone&apos;s marketing.</li>
                </ul>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Cookies and analytics</h2>
                <dl className={styles.facts}>
                    <dt>Cookies</dt>
                    <dd>
                        Only the ones that keep you signed in and protect the sign-in form. There are no advertising or
                        tracking cookies.
                    </dd>

                    <dt>Stored in your browser</dt>
                    <dd>
                        Your game settings, and your email address if you tick Remember Me on the login page.
                    </dd>

                    <dt>Analytics</dt>
                    <dd>
                        Vercel Web Analytics and Speed Insights count page views and measure loading speed. They
                        don&apos;t use cookies or identify you.
                    </dd>
                </dl>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Who handles it</h2>
                <p className={styles.paperText}>These services run parts of JS GBC and process data only to do that:</p>
                <ul className={styles.paperList}>
                    <li><strong>Vercel</strong>: hosting, file storage and analytics.</li>
                    <li><strong>MongoDB Atlas</strong>: the database holding your account and records.</li>
                    <li><strong>Resend</strong>: delivering account emails.</li>
                </ul>
                <p className={styles.paperText}>
                    Your profile, games and saves are visible only to you. The site&apos;s administrator can access
                    accounts to keep the service running and to help when you ask.
                </p>
            </section>

            <section className={styles.paperCard}>
                <h2 className={styles.paperTitle}>Your choices</h2>
                <dl className={styles.facts}>
                    <dt>See or download your data</dt>
                    <dd>
                        Your games and saves are in your library, and any save can be downloaded as a{' '}
                        <code>.sav</code>. For a copy of anything else we hold, email us.
                    </dd>

                    <dt>Delete your account</dt>
                    <dd>
                        Email <a href={`mailto:${SUPPORT}`} className={styles.paperLink}>{SUPPORT}</a> from your
                        account&apos;s address, and we&apos;ll delete your account, profile, games, saves and uploaded
                        files. Otherwise we keep your data for as long as you have an account.
                    </dd>

                    <dt>Children</dt>
                    <dd>
                        JS GBC is for people 13 and over. If you believe a younger child has made an account, email us
                        and we&apos;ll delete it.
                    </dd>
                </dl>
            </section>

            <section className={styles.legal}>
                <h2 className={styles.sectionTitle}>Changes and contact</h2>
                <p className={styles.paragraph}>
                    If this policy changes, the date at the top changes with it. Questions go to{' '}
                    <a href={`mailto:${SUPPORT}`}>{SUPPORT}</a>. See also the{' '}
                    <Link href="/terms">Terms of Service</Link>.
                </p>
            </section>
        </div>
    );
}
