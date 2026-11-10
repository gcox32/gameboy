import styles from './styles.module.css';
import { cryUrl } from '@/lib/assets';

export default function CryRow({ pokemonId, owned }: { pokemonId: number | null, owned: boolean }) {
    const playCry = () => {
        if (!owned || !pokemonId) return;
        const audio = new Audio(cryUrl(pokemonId));
        audio.play();
    };
    return (
        <div className={styles.soundGroup}>
            <button className={styles.cryButton} onClick={playCry}>
                {/* <FaVolumeUp /> */}
            </button>
            <div className={styles.speakerGrill}>
                <div className={styles.speakerRow} />
                <div className={styles.speakerRow} />
                <div className={styles.speakerRow} />
                <div className={styles.speakerRow} />
            </div>
        </div>
    );
}