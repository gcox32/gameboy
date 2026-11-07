import clsx from 'clsx';
import styles from './styles.module.css'
import { MovesetProps } from '@/types/pokemon'
import { useGame } from '@/contexts/GameContext';
import { getMaxPP, getMoveDetails } from '@/utils/pokemon/moves';

export default function Moveset({ moves }: MovesetProps) {
    const { rom } = useGame();

    return (
        <ul className={styles.moves}>
            {moves.map((move, index) => {
                if (move.id === 0) return null;
                const details = move.details ?? getMoveDetails(rom, move.id);
                // Without the game's move table there's only the number to show
                if (!details) {
                    return (
                        <li key={index} className={styles.move}>
                            <span className={styles.typeTag}>?</span>
                            <span className={styles.moveName}>Move #{move.id}</span>
                            <span className={styles.movePP}>PP {move.pp}</span>
                        </li>
                    );
                }
                return (
                    <li key={index} className={styles.move}>
                        <span className={clsx(styles.typeTag, styles[`${details.type.toLowerCase()}Type`])}>{details.type}</span>
                        <span className={styles.moveName}>{details.name}</span>
                        <span className={clsx(styles.movePP, move.pp === 0 && styles.movePPEmpty)}>
                            PP {move.pp}/{getMaxPP(details.PP, move.ppUps)}
                        </span>
                        <span className={styles.moveMeta}>
                            Power {details.basepower || '-'} / Acc {details.accuracy}%
                        </span>
                    </li>
                );
            })}
        </ul>
    );
}
