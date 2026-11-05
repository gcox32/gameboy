import { useEmulator } from '@/contexts/EmulatorContext';
import styles from './styles.module.css';

/** The loaded game, and the save it's running from once there is one */
export default function NowPlaying() {
    const { activeROM, activeState } = useEmulator();

    if (!activeROM) return null;

    return (
        <div className={styles.nowPlaying}>
            <div className={styles.game} title={activeROM.title}>{activeROM.title}</div>
            {activeState && <div className={styles.save} title={activeState.title}>{activeState.title}</div>}
        </div>
    );
}
