import { useState, useEffect } from 'react';
import styles from './styles.module.css'
import { Move, MovesetProps, MoveDetails } from '@/types/pokemon'
import { FaExpandAlt, FaCompressAlt } from 'react-icons/fa';

export default function Moveset({ moves }: MovesetProps) {
    const [moveDetails, setMoveDetails] = useState<(MoveDetails | null)[]>([]);
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() => {
        const fetchMoveDetails = async () => {
            const details = await Promise.all(
                moves.map(async (move) => {
                    if (move.id === 0) return null;
                    try {
                        const response = await fetch(`/api/pokemon/gen-one/moves?gameId=001&moveId=${move.id}`);
                        if (!response.ok) return null;
                        return await response.json();
                    } catch (error) {
                        console.error('Error fetching move details:', error);
                        return null;
                    }
                })
            );
            setMoveDetails(details);
        };

        fetchMoveDetails();
    }, [moves]);

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
                                        <span>PP: {move.pp}/{moveDetails[index]?.PP}</span>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
                                        <span className={`${styles.typeTag} ${styles[moveDetails[index]?.type.toLowerCase() + 'Type']}`}>
                                            {moveDetails[index]?.type}
                                        </span>
                                        <span style={{ fontSize: '0.8rem', color: '#aaa' }}>
                                            Power: {moveDetails[index]?.basepower || '-'} | Acc: {moveDetails[index]?.accuracy}%
                                        </span>
                                    </div>
                                    <p style={{ fontSize: '0.8rem', marginTop: '0.25rem', color: '#999' }}>
                                        {moveDetails[index]?.clean_description}
                                    </p>
                                </>
                            ) : (
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span>{moveDetails[index]?.name}</span>
                                    <span style={{ color: '#999' }}> {move.pp}/{moveDetails[index]?.PP}</span>
                                </div>
                            )}
                        </div>
                    )
                ))}
            </div>
        </div>
    );
}