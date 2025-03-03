import '@/styles/public.css';
import Footer from '@/components/layout/Footer';
import Link from 'next/link';

const ContactPage = () => {
  return (
    <div className="container static-page">
      <header>
        <h1 className="title">Contact Us</h1>
      </header>

      <section>
        <h2 className="section-title">Get in Touch</h2>
        <p className="paragraph">
          Have questions or need support? Feel free to reach out to us via email:
        </p>
        <p className="paragraph">
          <a href="mailto:support@letmedemo.com" className="link">
            support@letmedemo.com
          </a>
        </p>
      </section>

      <section>
        <h2 className="section-title">Contribute</h2>
        <p className="paragraph">
          {`JS GBC is an open-source project. If you'd like to contribute or report issues, 
          visit our GitHub repository:`}
        </p>
        <p className="paragraph">
          <a 
            href="https://github.com/gcox32/gameboy" 
            target="_blank" 
            rel="noopener noreferrer"
            className="link"
          >
            github.com/gcox32/gameboy
          </a>
        </p>
      </section>

      <Footer />
    </div>
  );
};

export default ContactPage;

  