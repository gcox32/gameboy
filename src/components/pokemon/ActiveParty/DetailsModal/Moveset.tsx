import { useState } from 'react';
import styles from './styles.module.css'
import { Move, MovesetProps } from '@/types/pokemon'
import { FaExpandAlt, FaCompressAlt } from 'react-icons/fa';
import { useGame } from '@/contexts/GameContext';
import { getMaxPP, getMoveDetails } from '@/utils/pokemon/moves';

export default function Moveset({ moves }: MovesetProps) {
    const { rom } = useGame();
    const [isExpanded, setIsExpanded] = useState(false);
    const moveDetails = moves.map((move) => getMoveDetails(rom, move.id));

    return (
        <div className={`${styles.pokemonDetailsSection} ${styles.top} ${isExpanded ? styles.expanded : ''}`}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button 
                    onClick={() => setIsExpanded(!isExpanded)}
                    className={styles.expandButton}
                >
                    {isExpanded ? <FaCompressAlt /> : <FaExpandAlt />}
                </button>
                <h4>Moveset</h4>
            </div>
            <div className={styles.movesetContent}>
                {moves.map((move: Move, index: number) => (
                    move.id !== 0 && moveDetails[index] && (
                        <div key={index} className={styles.pokemonMove}>
                            {isExpanded ? (
                                <>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span>{moveDetails[index]?.name}</span>
                                        <span>PP: {move.pp}/{getMaxPP(moveDetails[index].PP, move.ppUps)}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <span className={`${styles.typeTag} ${styles[moveDetails[index]?.type.toLowerCase() + 'Type']}`}>
                                            {moveDetails[index]?.type}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                            Power: {moveDetails[index]?.basepower || '-'} | Acc: {moveDetails[index]?.accuracy}%
                                        </span>
                                    </div>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{moveDetails[index]?.name}</span>
                                    <span style={{ color: '#999' }}> {move.pp}/{getMaxPP(moveDetails[index].PP, move.ppUps)}</span>
                                </div>
                            )}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}