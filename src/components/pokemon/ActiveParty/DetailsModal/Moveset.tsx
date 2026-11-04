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
                const details = getMoveDetails(rom, move.id);
                if (!details) return null;
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
