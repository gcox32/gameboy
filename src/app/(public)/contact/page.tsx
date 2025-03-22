import styles from '../styles.module.css';

const ContactPage = () => {
  return (
    <div className={`${styles.container} ${styles.staticPage}`}>
      <header>
        <h1 className={styles.title}>Contact Us</h1>
      </header>

      <section>
        <h2 className={styles.sectionTitle}>Get in Touch</h2>
        <p className={styles.paragraph}>
          Have questions or need support? Feel free to reach out to us via email:
        </p>
        <p className={styles.paragraph}>
          <a href="mailto:support@letmedemo.com" className={styles.link}>
            support@letmedemo.com
          </a>
        </p>
      </section>

      <section>
        <h2 className={styles.sectionTitle}>Contribute</h2>
        <p className={styles.paragraph}>
          {`JS GBC is an open-source project. If you'd like to contribute or report issues, 
          visit our GitHub repository:`}
        </p>
        <p className={styles.paragraph}>
          <a 
            href="https://github.com/gcox32/gameboy" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.link}
          >
            github.com/gcox32/gameboy
          </a>
        </p>
      </section>
    </div>
  );
};

export default ContactPage;

  