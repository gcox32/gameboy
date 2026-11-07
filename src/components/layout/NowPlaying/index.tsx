import { useCurrentGame } from '@/contexts/CurrentGameContext';
import styles from './styles.module.css';

/** The current game and save, which Play, the Lab and the Ranch all share */
export default function NowPlaying() {
    const { game, save } = useCurrentGame();

    if (!game) return null;

    return (
        <div className={styles.nowPlaying}>
            <div className={styles.game} title={game.title}>{game.title}</div>
            {save && <div className={styles.save} title={save.title}>{save.title}</div>}
        </div>
    );
}
