'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import NowPlaying from '@/components/layout/NowPlaying';
import { useToast } from '@/components/ui';
import { usePokemonSprites } from '@/hooks/usePokemonSprites';
import { Field } from './Field';
import PokemonDetailsModal from '@/components/pokemon/ActiveParty/DetailsModal';
import { RanchActions } from './RanchActions';
import { toPokemonDetails } from './details';
import { PenTabs } from './PenTabs';
import { CORRAL } from './fields';
import type { RanchData, RanchPen, RanchPokemon } from './types';
import styles from './styles.module.css';

async function errorOf(res: Response, fallback: string): Promise<string> {
    const body = await res.json().catch(() => null);
    return typeof body?.error === 'string' ? body.error : fallback;
}

export default function OaksRanch() {
    const { showToast } = useToast();
    const { bySpecies, spriteStyle } = usePokemonSprites();
    const [data, setData] = useState<RanchData | null>(null);
    const [failed, setFailed] = useState(false);
    const [activePenId, setActivePenId] = useState<string | null>(null);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [hoveredId, setHoveredId] = useState<string | null>(null);
    const [search, setSearch] = useState('');

    useEffect(() => {
        let live = true;
        fetch('/api/ranch')
            .then(r => (r.ok ? r.json() : Promise.reject()))
            .then((d: RanchData) => { if (live) setData(d); })
            .catch(() => { if (live) setFailed(true); });
        return () => { live = false; };
    }, []);

    const pens = useMemo(() => data?.pens ?? [], [data]);
    const pokemon = useMemo(() => data?.pokemon ?? [], [data]);
    const capacity = data?.capacity ?? 0;
    const activePen: RanchPen | undefined = pens.find(p => p.id === activePenId) ?? pens[0];

    const counts = useMemo(() => {
        const m = new Map<string, number>();
        for (const p of pokemon) if (p.penId) m.set(p.penId, (m.get(p.penId) ?? 0) + 1);
        return m;
    }, [pokemon]);
    const countOf = useCallback((penId: string) => counts.get(penId) ?? 0, [counts]);

    const inPen = useMemo(
        () => pokemon.filter(p => p.penId === activePen?.id),
        [pokemon, activePen],
    );
    const selected = pokemon.find(p => p.id === selectedId) ?? null;

    const query = search.trim().toLowerCase();
    // A search looks through every pen; otherwise the roster is the pen on show
    const roster = useMemo(() => query
        ? pokemon.filter(p =>
            p.nickname.toLowerCase().includes(query) || p.speciesName.toLowerCase().includes(query))
        : inPen,
    [pokemon, inPen, query]);

    // The card steps through the list it was opened from
    const at = roster.findIndex(p => p.id === selectedId);
    const previous = at >= 0 && roster.length > 1 ? roster[(at - 1 + roster.length) % roster.length] : undefined;
    const next = at >= 0 && roster.length > 1 ? roster[(at + 1) % roster.length] : undefined;

    const penName = (penId: string | null) => pens.find(p => p.id === penId)?.name ?? '';

    const pick = (p: RanchPokemon) => {
        if (p.penId && p.penId !== activePen?.id) setActivePenId(p.penId);
        setSelectedId(p.id);
    };

    const switchPen = (penId: string) => {
        setActivePenId(penId);
        setSelectedId(null);
    };

    // ─── Changes ────────────────────────────────────────────────────────────

    const addPen = async () => {
        const res = await fetch('/api/ranch/pens', { method: 'POST', body: '{}' });
        if (!res.ok) { showToast(await errorOf(res, 'Couldn\'t add a pen'), 'error'); return; }
        const pen: RanchPen = await res.json();
        setData(d => d && { ...d, pens: [...d.pens, pen] });
        switchPen(pen.id);
    };

    const renamePen = async (penId: string, name: string) => {
        const res = await fetch(`/api/ranch/pens/${penId}`, { method: 'PATCH', body: JSON.stringify({ name }) });
        if (!res.ok) { showToast(await errorOf(res, 'Couldn\'t rename the pen'), 'error'); return false; }
        const pen: RanchPen = await res.json();
        setData(d => d && { ...d, pens: d.pens.map(p => (p.id === pen.id ? pen : p)) });
        return true;
    };

    const removePen = async (penId: string) => {
        const res = await fetch(`/api/ranch/pens/${penId}`, { method: 'DELETE' });
        if (!res.ok) { showToast(await errorOf(res, 'Couldn\'t remove the pen'), 'error'); return; }
        setData(d => d && { ...d, pens: d.pens.filter(p => p.id !== penId) });
        setActivePenId(null);
        setSelectedId(null);
    };

    const movePokemon = async (id: string, penId: string) => {
        const res = await fetch(`/api/pokemon/stored/${id}`, { method: 'PATCH', body: JSON.stringify({ penId }) });
        if (!res.ok) { showToast(await errorOf(res, 'Couldn\'t move that Pokémon'), 'error'); return; }
        const moved: RanchPokemon = await res.json();
        setData(d => d && { ...d, pokemon: d.pokemon.map(p => (p.id === id ? moved : p)) });
        showToast(`${moved.nickname} moved to ${penName(penId)}`, 'success');
        setSelectedId(null);
    };

    const release = async (id: string) => {
        const res = await fetch(`/api/pokemon/stored/${id}`, { method: 'DELETE' }).catch(() => null);
        if (!res?.ok) {
            showToast(res ? await errorOf(res, 'Couldn\'t release that Pokémon') : 'Couldn\'t reach the Ranch', 'error');
            return false;
        }
        setData(d => d && { ...d, pokemon: d.pokemon.filter(p => p.id !== id) });
        setSelectedId(null);
        return true;
    };

    // ─── Page ───────────────────────────────────────────────────────────────

    return (
        <div className={styles.page}>
            <NowPlaying />

            <Field
                field={CORRAL}
                pokemon={inPen}
                seed={activePen?.id ?? 'ranch'}
                selectedId={selectedId}
                highlightedId={hoveredId}
                onSelect={id => setSelectedId(cur => (cur === id ? null : id))}
            />

            <div className={styles.yard}>
                <div className={styles.board}>
                    <div className={styles.boardHeader}>
                        <div>
                            <h1>Oak&apos;s Ranch</h1>
                            <p>Your Pokémon in storage</p>
                        </div>
                        <div className={styles.boardHeaderRight}>
                            <input
                                className={styles.searchInput}
                                placeholder="Search..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                aria-label="Search the Ranch"
                            />
                            <span className={styles.filterCount}>{pokemon.length} Pokémon</span>
                        </div>
                    </div>

                    {activePen && (
                        <PenTabs
                            pens={pens}
                            activeId={activePen.id}
                            capacity={capacity}
                            countOf={countOf}
                            onPick={switchPen}
                            onAdd={addPen}
                            onRename={renamePen}
                            onRemove={removePen}
                        />
                    )}

                    <div className={styles.boardBody}>
                        {!data ? (
                            <div className={styles.emptyState}>
                                {failed ? 'Couldn\'t reach the Ranch.' : 'Loading...'}
                            </div>
                        ) : roster.length === 0 ? (
                            <div className={styles.emptyState}>
                                {query ? 'No Pokémon match your search.'
                                    : pokemon.length === 0 ? 'No Pokémon at the Ranch yet.'
                                        : 'This pen is empty.'}
                            </div>
                        ) : (
                            <ul className={styles.roster}>
                                {roster.map(p => (
                                    <li key={p.id}>
                                        <button
                                            type="button"
                                            className={clsx(styles.card, p.id === selectedId && styles.cardSelected)}
                                            onClick={() => pick(p)}
                                            onMouseEnter={() => setHoveredId(p.id)}
                                            onMouseLeave={() => setHoveredId(null)}
                                        >
                                            <span className={styles.cardSprite}>
                                                {bySpecies(p.speciesIndex) && (
                                                    <Image
                                                        src={bySpecies(p.speciesIndex)}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        style={spriteStyle}
                                                        unoptimized
                                                    />
                                                )}
                                            </span>
                                            <span className={styles.cardText}>
                                                <span className={styles.cardNickname}>{p.nickname}</span>
                                                <span className={styles.cardSpecies}>
                                                    {p.speciesName}
                                                    {query && p.penId !== activePen?.id && ` · ${penName(p.penId)}`}
                                                </span>
                                            </span>
                                            <span className={styles.cardLevel}>Lv. {p.level}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        )}

                    </div>
                </div>
            </div>

            {selected && (
                <PokemonDetailsModal
                    isOpen
                    onClose={() => setSelectedId(null)}
                    pokemon={toPokemonDetails(selected)}
                    previousPokemon={previous && toPokemonDetails(previous)}
                    nextPokemon={next && toPokemonDetails(next)}
                    onPrevious={previous && (() => setSelectedId(previous.id))}
                    onNext={next && (() => setSelectedId(next.id))}
                    actions={
                        <RanchActions
                            key={selected.id}
                            pokemon={selected}
                            pens={pens}
                            capacity={capacity}
                            countOf={countOf}
                            onMove={penId => movePokemon(selected.id, penId)}
                            onRelease={() => release(selected.id)}
                        />
                    }
                />
            )}
        </div>
    );
}
