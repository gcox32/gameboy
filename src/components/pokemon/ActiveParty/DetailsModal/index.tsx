import { useState } from "react";
import BaseModal from "@/components/modals/BaseModal";
import Image from "next/image";
import clsx from "clsx";
import styles from "./styles.module.css";
import { pokemonGifEndpoint, sugimoriRb, sugimoriRg, sugimoriFrlg } from "@/../config";
import { PokemonDetails } from "@/types/pokemon";
import Moveset from "./Moveset";
import StatsPanel from "./StatsPanel";

interface PokemonDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    pokemon: PokemonDetails;
    previousPokemon?: PokemonDetails;
    nextPokemon?: PokemonDetails;
    onPrevious?: () => void;
    onNext?: () => void;
}

const ART_SETS = [
    { label: 'RB', url: sugimoriRb },
    { label: 'RG', url: sugimoriRg },
    { label: 'FRLG', url: sugimoriFrlg },
];

const TABS = ['Moves', 'Stats'] as const;
type Tab = typeof TABS[number];

const STATUS_LABELS: Record<string, string> = {
    ASLEEP: 'SLP',
    POISON: 'PSN',
    BURNED: 'BRN',
    FROZEN: 'FRZ',
    PARALYZED: 'PAR',
};

// The game's HP bar is 48 pixels: green from 27, yellow from 10, red below that
function getHpColor(hpRatio: number) {
    const hpPixels = Math.floor(hpRatio * 48);
    if (hpPixels >= 27) return styles.hpGreen;
    if (hpPixels >= 10) return styles.hpYellow;
    return styles.hpRed;
}

// 'mr.mime' -> 'Mr. Mime', 'nidoran_f' -> 'Nidoran F'
function formatSpeciesName(name?: string) {
    if (!name) return '';
    return name
        .replace('.', '. ')
        .replace('_', ' ')
        .replace(/\b\w/g, letter => letter.toUpperCase());
}

function NavButton({ pokemon, direction, onClick }: { pokemon: PokemonDetails; direction: 'previous' | 'next'; onClick: () => void }) {
    const name = pokemon.nickname || formatSpeciesName(pokemon.speciesName);
    return (
        <button
            type="button"
            className={styles.navButton}
            onClick={onClick}
            title={name}
            aria-label={`${direction === 'previous' ? 'Previous' : 'Next'} Pokémon: ${name}`}
        >
            {direction === 'previous' && <span aria-hidden>&lsaquo;</span>}
            <span className={styles.navSprite}>
                <Image
                    src={`${pokemonGifEndpoint}${pokemon.pokedexNo}.gif`}
                    alt=""
                    fill
                    sizes="36px"
                    className={styles.navSpriteImage}
                    unoptimized
                />
            </span>
            {direction === 'next' && <span aria-hidden>&rsaquo;</span>}
        </button>
    );
}

function PokemonDetailsModal({ isOpen, onClose, pokemon, previousPokemon, nextPokemon, onPrevious, onNext }: PokemonDetailsModalProps) {
    const [artIndex, setArtIndex] = useState(0);
    const [tab, setTab] = useState<Tab>('Moves');

    if (!isOpen || !pokemon) return null;

    const { structure } = pokemon;
    const { currentHP, level, levelStats, statusCondition, originalTrainerID, type1, type2 } = structure;
    const maxHP = levelStats.maxHP;
    const hpRatio = maxHP > 0 ? Math.min(currentHP / maxHP, 1) : 0;
    const isFainted = currentHP === 0;
    const statusLabel = isFainted ? 'FNT' : STATUS_LABELS[statusCondition ?? ''];
    const speciesName = formatSpeciesName(pokemon.speciesName);
    const name = pokemon.nickname || speciesName;
    const types = type2 && type2 !== type1 ? [type1, type2] : [type1];

    return (
        <BaseModal isOpen={isOpen} onClose={onClose} className={`${styles.modalContent} ${styles.detailsModal}`} lightCloseButton>
            <div className={styles.card}>
                <div className={styles.paperPanel}>
                    <button
                        type="button"
                        className={styles.art}
                        onClick={() => setArtIndex((artIndex + 1) % ART_SETS.length)}
                        aria-label="Show the next artwork"
                    >
                        <Image
                            src={`${ART_SETS[artIndex].url}${pokemon.pokedexNo}.png`}
                            alt={speciesName}
                            fill
                            sizes="280px"
                            className={styles.artImage}
                        />
                    </button>

                    <div className={styles.artSets}>
                        {ART_SETS.map((set, index) => (
                            <button
                                key={set.label}
                                type="button"
                                className={clsx(styles.artSet, index === artIndex && styles.artSetActive)}
                                onClick={() => setArtIndex(index)}
                                aria-pressed={index === artIndex}
                            >
                                {set.label}
                            </button>
                        ))}
                    </div>

                    <div className={styles.species}>No. {pokemon.pokedexNo} {speciesName}</div>
                    <div className={styles.types}>
                        {types.map(type => (
                            <span key={type} className={clsx(styles.typeTag, styles[`${type?.toLowerCase()}Type`])}>{type}</span>
                        ))}
                    </div>
                    <dl className={styles.trainer}>
                        <div><dt>OT</dt><dd>{pokemon.otName}</dd></div>
                        {originalTrainerID !== undefined && (
                            <div><dt>ID No.</dt><dd>{originalTrainerID.toString().padStart(5, '0')}</dd></div>
                        )}
                    </dl>
                </div>

                <div className={styles.info}>
                    <div className={styles.header}>
                        {previousPokemon && onPrevious && <NavButton pokemon={previousPokemon} direction="previous" onClick={onPrevious} />}
                        <div className={styles.identity}>
                            <h2 className={styles.name}>{name}</h2>
                            <div className={styles.level}>Lv. {level}</div>
                        </div>
                        {nextPokemon && onNext && <NavButton pokemon={nextPokemon} direction="next" onClick={onNext} />}
                    </div>

                    <div className={styles.hp}>
                        <span className={styles.hpLabel}>HP</span>
                        <span className={styles.hpBar}>
                            <span className={clsx(styles.hpFill, getHpColor(hpRatio))} style={{ width: `${hpRatio * 100}%` }} />
                        </span>
                        <span className={styles.hpValue}>{currentHP}/{maxHP}</span>
                        {statusLabel && <span className={clsx(styles.status, isFainted && styles.statusFainted)}>{statusLabel}</span>}
                    </div>

                    <div className={styles.tabs} role="tablist">
                        {TABS.map(tabName => (
                            <button
                                key={tabName}
                                type="button"
                                role="tab"
                                aria-selected={tab === tabName}
                                className={clsx(styles.tab, tab === tabName && styles.tabActive)}
                                onClick={() => setTab(tabName)}
                            >
                                {tabName}
                            </button>
                        ))}
                    </div>

                    <div className={styles.tabPanel} role="tabpanel">
                        {tab === 'Moves' ? <Moveset moves={structure.moves} /> : <StatsPanel structure={structure} />}
                    </div>
                </div>
            </div>
        </BaseModal>
    );
}

export default PokemonDetailsModal;
