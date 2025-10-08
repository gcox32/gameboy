import styles from './styles.module.css';

export default function TopLights({ activePokemon }: { activePokemon: boolean }) {

    return (
        <div className={styles.onLights}>
            <div className={`${styles.onLight} ${activePokemon ? styles.onLightActive : ''}`} />
            <div className={`${styles.onLight} ${activePokemon ? styles.onLightActive : ''}`} />
        </div>
    );
}