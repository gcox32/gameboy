import '@/styles/public.css';
import Footer from '@/components/layout/Footer';

export default function PrivacyPolicy() {
    return (
        <div className="container static-page">
            <header>
                <h1 className="title">Privacy Policy</h1>
                <p className="last-updated">Last updated: January 2024</p>
            </header>

            <section>
                <p className="paragraph">
                    This Privacy Policy describes how JS GBC collects, uses, and protects your information when you use our website.
                </p>
            </section>

            <section>
                <h2 className="section-title">Information We Collect</h2>
                <p className="paragraph">
                    When you use JS GBC, we may collect the following types of information:
                </p>
                <ul>
                    <li>Account information (email, username)</li>
                    <li>Game save data and preferences</li>
                </ul>
            </section>

            <section>
                <h2 className="section-title">How We Use Your Information</h2>
                <p className="paragraph">
                    We use the collected information to:
                </p>
                <ul>
                    <li>blah blah blah</li>
                </ul>
            </section>

            <section>
                <h2 className="section-title">Contact Us</h2>
                <p className="paragraph">
                    If you have any questions about this Privacy Policy, please contact us at wherever.
                </p>
            </section>
            <Footer />
        </div>
    );
}