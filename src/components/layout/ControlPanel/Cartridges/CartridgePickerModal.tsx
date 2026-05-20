'use client';

import { useRef, useEffect, useCallback, useState } from 'react';
import { createPortal } from 'react-dom';
import BaseModal from '@/components/modals/BaseModal';
import { GameModel } from '@/types';
import Image from 'next/image';
import styles from './CartridgePickerModal.module.css';

// Spring physics
const K = 0.13;
const C = 0.70;
const MAX_LIFT = 34;
const RADIUS = 180;

// Card layout (square — no info row)
const CARD_W = 140;
const CARD_H = 140;
const STEP_X = 42;
const STEP_Y = 15;

function titleColor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0x7fffffff;
    const hue = h % 360;
    return `linear-gradient(135deg, hsl(${hue},50%,28%) 0%, hsl(${(hue + 40) % 360},55%,20%) 100%)`;
}

interface GameModelExtended extends GameModel { _id?: string }

interface Props {
    isOpen: boolean;
    onClose: () => void;
    games: GameModel[];
    onSelect: (game: GameModel) => void;
    selectedFilePath?: string;
}

function CartridgePickerModal({ isOpen, onClose, games, onSelect, selectedFilePath }: Props) {
    const [mounted, setMounted] = useState(false);
    const [pendingGame, setPendingGame] = useState<GameModel | null>(null);
    const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
    const springs = useRef<{ lift: number; vel: number; target: number }[]>([]);
    const rafRef = useRef<number | null>(null);
    const mouseRef = useRef({ x: -9999, y: -9999 });
    const n = games.length;

    useEffect(() => { setMounted(true); }, []);

    // Pre-select the active game when the modal opens
    // eslint-disable-next-line react-hooks/exhaustive-deps
    useEffect(() => {
        if (!isOpen) return;
        setPendingGame(games.find(g => g.filePath === selectedFilePath) ?? null);
    }, [isOpen]);

    useEffect(() => {
        springs.current = games.map(() => ({ lift: 0, vel: 0, target: 0 }));
        cardRefs.current = cardRefs.current.slice(0, n);
    }, [n]);

    const tick = useCallback(() => {
        let active = false;
        springs.current.forEach((s, i) => {
            const el = cardRefs.current[i];
            if (!el) return;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const d = Math.hypot(mouseRef.current.x - cx, mouseRef.current.y - cy);
            let target = d < RADIUS ? MAX_LIFT * Math.max(0, 1 - d / RADIUS) : 0;
            if (target > 0) {
                const mx = mouseRef.current.x, my = mouseRef.current.y;
                for (let j = 0; j < i; j++) {
                    const front = cardRefs.current[j];
                    if (!front) continue;
                    const fr = front.getBoundingClientRect();
                    if (mx >= fr.left && mx <= fr.right && my >= fr.top && my <= fr.bottom) {
                        target *= 0.12;
                        break;
                    }
                }
            }
            s.target = target;
            s.vel = (s.vel + (s.target - s.lift) * K) * C;
            s.lift += s.vel;
            const lift = Math.max(0, s.lift);
            el.style.transform = `translateY(${-lift}px) scale(${1 + lift / 160})`;
            el.style.boxShadow = `0 ${4 + lift * 2}px ${10 + lift * 2.5}px rgba(0,0,0,${0.32 + lift * 0.013})`;
            if (Math.abs(s.vel) > 0.05 || Math.abs(s.target - s.lift) > 0.05) active = true;
        });
        rafRef.current = active ? requestAnimationFrame(tick) : null;
    }, [n]);

    const startTick = useCallback(() => {
        if (!rafRef.current) rafRef.current = requestAnimationFrame(tick);
    }, [tick]);

    const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
        mouseRef.current = { x: e.clientX, y: e.clientY };
        startTick();
    }, [startTick]);

    const handleMouseLeave = useCallback(() => {
        mouseRef.current = { x: -9999, y: -9999 };
        startTick();
    }, [startTick]);

    useEffect(() => {
        if (!isOpen) {
            if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
            cardRefs.current.forEach(el => {
                if (el) { el.style.transform = ''; el.style.boxShadow = ''; }
            });
            springs.current.forEach(s => { s.lift = 0; s.vel = 0; s.target = 0; });
        }
    }, [isOpen]);

    if (!mounted) return null;

    const stackW = n > 0 ? CARD_W + (n - 1) * STEP_X : CARD_W;
    const stackH = n > 0 ? CARD_H + (n - 1) * STEP_Y : CARD_H;
    const m = pendingGame?.metadata;

    return createPortal(
        <BaseModal isOpen={isOpen} onClose={onClose} title="Select Game" size="lg">
            <div className={styles.body}>

                {/* ── Left: animated card stack ── */}
                <div
                    className={styles.leftPane}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    {n === 0 ? (
                        <div className={styles.empty}>No games yet — add some via Manage Games.</div>
                    ) : (
                        <div className={styles.scene}>
                            <div className={styles.stack} style={{ width: stackW, height: stackH }}>
                                {(games as GameModelExtended[]).map((game, i) => {
                                    const isPending = pendingGame?.filePath === game.filePath;
                                    const isConfirmed = game.filePath === selectedFilePath;
                                    return (
                                        <div
                                            key={game._id ?? game.id ?? i}
                                            ref={el => { cardRefs.current[i] = el; }}
                                            className={`${styles.card}${isPending ? ` ${styles.pending}` : ''}`}
                                            style={{ left: i * STEP_X, top: (n - 1 - i) * STEP_Y, zIndex: n - i }}
                                            onClick={() => setPendingGame(game)}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => e.key === 'Enter' && setPendingGame(game)}
                                            aria-label={`Preview ${game.title}`}
                                            aria-pressed={isPending}
                                        >
                                            <div className={styles.cardInner}>
                                                <div
                                                    className={styles.cover}
                                                    style={game.img ? undefined : { background: titleColor(game.title) }}
                                                >
                                                    {game.img
                                                        ? <img src={game.img} alt={game.title} className={styles.coverImg} />
                                                        : <span className={styles.coverInitial}>{game.title[0]}</span>
                                                    }
                                                    {isConfirmed && <div className={styles.checkBadge}>✓</div>}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Right: metadata + confirm ── */}
                <div className={styles.rightPane}>
                    {pendingGame ? (
                        <>
                            <div className='flex justify-between'>
                                <div className={styles.metaBody}>
                                    <h2 className={styles.gameTitle}>{pendingGame.title}</h2>
                                    {(m?.series || m?.generation) && (
                                        <div className={styles.tags}>
                                            {m.series && <span className={styles.tag}>{m.series}</span>}
                                            {m.generation && <span className={styles.tag}>Gen {m.generation}</span>}
                                        </div>
                                    )}
                                    {m?.releaseDate && (
                                        <div className={styles.metaRow}>
                                            <span className={styles.metaLabel}>Released</span>
                                            <span className={styles.metaValue}>{m.releaseDate}</span>
                                        </div>
                                    )}
                                    {m?.description && (
                                        <p className={styles.description}>{m.description}</p>
                                    )}
                                </div>
                                {pendingGame.img && (
                                <Image
                                    className={styles.preview}
                                    src={pendingGame.img}
                                    alt={pendingGame.title}
                                    width={160}
                                    height={160}
                                />
                                )}
                            </div>
                            <div className={styles.chooseRow}>
                                <button
                                    className={styles.chooseButton}
                                    onClick={() => onSelect(pendingGame)}
                                >
                                    Choose
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className={styles.metaEmpty}>
                            Select a cartridge
                        </div>
                    )}
                </div>

            </div>
        </BaseModal>,
        document.body
    );
}

export default CartridgePickerModal;
