import { FaVolumeUp } from 'react-icons/fa';
import styles from '../styles.module.css';

export default function CryButton( { pokemonId, owned }: { pokemonId: number | null, owned: boolean } ) {
    const playCry = () => {
        if (!owned || !pokemonId) return;
        const id = parseInt(pokemonId.toString(), 10); // remove any leading zeros
        const cry = `https://assets.letmedemo.com/public/gameboy/audio/anime/${id}.wav`;
        const audio = new Audio(cry);
        audio.play();
    };
    return (
        <button className={styles.cryButton} onClick={playCry}>
            <FaVolumeUp />
        </button>
    );
}