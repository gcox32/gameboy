import '@/styles/public.css';

export default function TermsAndConditions() {
    return (
        <div className="container static-page">
            <header>
                <h1 className="title">Terms of Service</h1>
                <p className="last-updated">Last updated: November 2024</p>
            </header>

            <section>
                <p className="paragraph">
                    Welcome to JS GBC. By accessing or using our website, you agree to be bound by these Terms of Service.
                </p>
            </section>

            <section>
                <h2 className="section-title">Account Terms</h2>
                <p className="paragraph">
                    To access certain features of JS GBC, you may need to create an account. You agree to:
                </p>
                <ul>
                    <li>Provide accurate and complete information</li>
                    <li>Maintain the security of your account credentials</li>
                    <li>Accept responsibility for all activities under your account</li>
                </ul>
            </section>

            <section>
                <h2 className="section-title">Acceptable Use</h2>
                <p className="paragraph">
                    When using JS GBC, you agree not to:
                </p>
                <ul>
                    <li>Violate any applicable laws or regulations</li>
                    <li>Infringe upon intellectual property rights</li>
                    <li>Attempt to breach or circumvent site security</li>
                </ul>
            </section>

            <section>
                <h2 className="section-title">Game Content</h2>
                <p className="paragraph">
                    Users are responsible for providing their own game files. JS GBC does not provide or host game ROMs.
                </p>
            </section>

            <section>
                <h2 className="section-title">Modifications to Service</h2>
                <p className="paragraph">
                    We reserve the right to modify or discontinue JS GBC at any time, with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the service.
                </p>
            </section>

            <section>
                <h2 className="section-title">Contact</h2>
                <p className="paragraph">
                    If you have any questions about these Terms of Service, please contact us at <a href="mailto:support@letmedemo.com">support@letmedemo.com</a>.
                </p>
            </section>
        </div>
    );
}