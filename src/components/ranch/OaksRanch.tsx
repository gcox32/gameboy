'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import BaseModal from '@/components/modals/BaseModal';
import { pokemonGifEndpoint } from '../../../config';
import { dexDict } from '@/utils/pokemon/dicts';
import { calcGen1Stats } from '@/utils/pokemon/stats';
import { RanchPokemon, getRawBytes } from './types';
import styles from './styles.module.css';

function spriteUrl(speciesIndex: number): string {
    const entry = dexDict[speciesIndex];
    if (!entry || entry.pokedexNo === 'NULL') return '';
    const no = entry.pokedexNo.padStart(3, '0');
    return `${pokemonGifEndpoint}${no}.gif`;
}

interface DetailModalProps {
    pokemon: RanchPokemon;
    onClose: () => void;
    onRelease: (id: string) => Promise<void>;
}

function DetailModal({ pokemon, onClose, onRelease }: DetailModalProps) {
    const [confirming, setConfirming] = useState(false);
    const [releasing, setReleasing] = useState(false);

    const bytes = getRawBytes(pokemon.rawBoxData);
    const stats = calcGen1Stats(bytes);

    const ivRaw = (bytes[0x1B] << 8) | bytes[0x1C];
    const atkIV = (ivRaw >> 12) & 0xF;
    const defIV = (ivRaw >> 8) & 0xF;
    const spdIV = (ivRaw >> 4) & 0xF;
    const spcIV = ivRaw & 0xF;
    const hpIV = ((atkIV & 1) << 3) | ((defIV & 1) << 2) | ((spdIV & 1) << 1) | (spcIV & 1);

    const moves = [bytes[0x08], bytes[0x09], bytes[0x0A], bytes[0x0B]].filter(m => m !== 0);
    const pp = [bytes[0x1D] & 0x3F, bytes[0x1E] & 0x3F, bytes[0x1F] & 0x3F, bytes[0x20] & 0x3F];

    const handleRelease = async () => {
        if (!confirming) { setConfirming(true); return; }
        setReleasing(true);
        await onRelease(pokemon.id);
        setReleasing(false);
        onClose();
    };

    return (
        <BaseModal isOpen title={pokemon.nickname} onClose={onClose} size="lg">
            <div className={styles.detailGrid}>
                <div className={styles.detailLeft}>
                    <Image
                        src={spriteUrl(pokemon.speciesIndex)}
                        alt={pokemon.nickname}
                        width={120}
                        height={120}
                        className={styles.detailSprite}
                        unoptimized
                    />
                    <div className={styles.detailNickname}>{pokemon.nickname}</div>
                    <div className={styles.detailSpecies}>{pokemon.speciesName}</div>
                    <div className={styles.detailMeta}>Lv. {pokemon.level}</div>
                    <div className={styles.detailMeta}>OT: {pokemon.otName} #{pokemon.otId}</div>
                    <div className={styles.detailMeta}>
                        Extracted {new Date(pokemon.extractedAt).toLocaleDateString()}
                    </div>
                </div>

                <div className={styles.detailRight}>
                    <div className={styles.statBlock}>
                        <div className={styles.statBlockTitle}>Stats</div>
                        {[
                            ['Max HP', stats.maxHP],
                            ['Attack', stats.attack],
                            ['Defense', stats.defense],
                            ['Speed', stats.speed],
                            ['Special', stats.special],
                        ].map(([label, value]) => (
                            <div key={label} className={styles.statRow}>
                                <span className={styles.statLabel}>{label}</span>
                                <span className={styles.statValue}>{value}</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.statBlock}>
                        <div className={styles.statBlockTitle}>IVs</div>
                        {[
                            ['HP', hpIV], ['Atk', atkIV], ['Def', defIV],
                            ['Spd', spdIV], ['Spc', spcIV],
                        ].map(([label, value]) => (
                            <div key={label} className={styles.statRow}>
                                <span className={styles.statLabel}>{label}</span>
                                <span className={styles.statValue}>{value} / 15</span>
                            </div>
                        ))}
                    </div>

                    <div className={styles.statBlock}>
                        <div className={styles.statBlockTitle}>Moves</div>
                        {moves.length === 0 ? (
                            <div className={styles.statRow}><span className={styles.statLabel}>—</span></div>
                        ) : moves.map((id, i) => (
                            <div key={i} className={styles.statRow}>
                                <span className={styles.statLabel}>Move {i + 1}</span>
                                <span className={styles.statValue}>#{id} ({pp[i]} PP)</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className={styles.detailActions}>
                    <button
                        className={styles.releaseBtn}
                        onClick={handleRelease}
                        disabled={releasing}
                    >
                        {releasing ? 'Releasing...' : confirming ? 'Confirm release?' : 'Release'}
                    </button>
                </div>
            </div>
        </BaseModal>
    );
}

export default function OaksRanch() {
    const [pokemon, setPokemon] = useState<RanchPokemon[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [selected, setSelected] = useState<RanchPokemon | null>(null);

    useEffect(() => {
        fetch('/api/pokemon/stored?status=stashed')
            .then(r => r.json())
            .then(data => { setPokemon(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const filtered = useMemo(() =>
        pokemon.filter(p =>
            !search ||
            p.nickname.toLowerCase().includes(search.toLowerCase()) ||
            p.speciesName.toLowerCase().includes(search.toLowerCase())
        ),
        [pokemon, search]
    );

    const handleRelease = async (id: string) => {
        await fetch(`/api/pokemon/stored/${id}`, { method: 'DELETE' });
        setPokemon(prev => prev.filter(p => p.id !== id));
    };

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <Image
                    src="/images/oaks_ranch.png"
                    alt="Oak's Ranch"
                    fill
                    className={styles.heroImg}
                    priority
                    unoptimized
                />
                <div className={styles.heroText}>
                    <h1>Oak&apos;s Ranch</h1>
                    <p>Your Pokémon in storage</p>
                </div>
            </div>

            <div className={styles.main}>
                <div className={styles.filters}>
                    <input
                        className={styles.searchInput}
                        placeholder="Search by name or species..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <span className={styles.filterCount}>{filtered.length} Pokémon</span>
                </div>

                {loading ? (
                    <div className={styles.emptyState}>Loading...</div>
                ) : filtered.length === 0 ? (
                    <div className={styles.emptyState}>
                        {search ? 'No Pokémon match your search.' : 'No Pokémon at the Ranch yet.'}
                    </div>
                ) : (
                    <div className={styles.grid}>
                        {filtered.map(p => (
                            <div
                                key={p.id}
                                className={styles.card}
                                onClick={() => setSelected(p)}
                            >
                                {spriteUrl(p.speciesIndex) && (
                                    <Image
                                        src={spriteUrl(p.speciesIndex)}
                                        alt={p.nickname}
                                        width={80}
                                        height={80}
                                        className={styles.cardSprite}
                                        unoptimized
                                    />
                                )}
                                <div className={styles.cardNickname}>{p.nickname}</div>
                                <div className={styles.cardSpecies}>{p.speciesName}</div>
                                <div className={styles.cardLevel}>Lv. {p.level}</div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {selected && (
                <DetailModal
                    pokemon={selected}
                    onClose={() => setSelected(null)}
                    onRelease={handleRelease}
                />
            )}
        </div>
    );
}
