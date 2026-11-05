'use client';

import { ReactNode, useState } from 'react';
import { createPortal } from 'react-dom';
import BaseModal from '@/components/modals/BaseModal';
import { getAppShell } from '@/lib/appShell';
import { GameModel } from '@/types';
import paper from '../paper.module.css';
import styles from './styles.module.css';

// Cartridge layout — narrow spine at rest, widens to a square cover when picked
const SPINE_W = 34;
const CARD_H = 190;
const COVER_W = CARD_H;
const GAP = 6;

// Stage: cards sit in a row along the top; picking one docks it centered
// in the bottom half, as if pulled out for inspection.
const STAGE_H = 420;
const REST_TOP = 0;
const DOCK_TOP = STAGE_H - CARD_H - 16;

function titleColor(title: string): string {
    let h = 0;
    for (let i = 0; i < title.length; i++) h = (h * 31 + title.charCodeAt(i)) & 0x7fffffff;
    const hue = h % 360;
    return `linear-gradient(135deg, hsl(${hue},50%,28%) 0%, hsl(${(hue + 40) % 360},55%,20%) 100%)`;
}

interface CartridgeShelfProps {
    games: GameModel[];
    onSelect: (game: GameModel) => void;
    /** The game already chosen, marked with a check */
    selectedFilePath?: string;
    /** The game to show pulled out when the shelf opens */
    initialGameId?: string;
    emptyMessage: string;
    /** When given, stops a game being chosen and says why */
    chooseDisabledReason?: string;
    /** Extra actions beside Choose, for the game being looked at */
    renderActions?: (game: GameModel) => ReactNode;
    footer?: ReactNode;
}

export function CartridgeShelf({
    games,
    onSelect,
    selectedFilePath,
    initialGameId,
    emptyMessage,
    chooseDisabledReason,
    renderActions,
    footer,
}: CartridgeShelfProps) {
    const [pendingId, setPendingId] = useState(initialGameId ?? null);
    const pendingGame = games.find(game => game.id === pendingId) ?? null;
    const n = games.length;
    const m = pendingGame?.metadata;

    return (
        <>
            <div className={styles.body}>

                <div className={styles.leftPane}>
                    {n === 0 ? (
                        <div className={styles.empty}>{emptyMessage}</div>
                    ) : (
                        <div className={styles.scene}>
                            <div className={styles.stage} style={{ height: STAGE_H, width: n * SPINE_W + (n - 1) * GAP }}>
                                {games.map((game, i) => {
                                    const isPending = pendingId === game.id;
                                    const isConfirmed = game.filePath === selectedFilePath;
                                    const gradient = titleColor(game.title);
                                    const toggle = () => setPendingId(prev => prev === game.id ? null : game.id);
                                    return (
                                        <div
                                            key={game.id}
                                            className={styles.card}
                                            style={isPending
                                                ? { width: COVER_W, height: CARD_H, left: '50%', marginLeft: -COVER_W / 2, top: DOCK_TOP, zIndex: 10 }
                                                : { width: SPINE_W, height: CARD_H, left: i * (SPINE_W + GAP), marginLeft: 0, top: REST_TOP, zIndex: 1 }
                                            }
                                            onClick={toggle}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={e => e.key === 'Enter' && toggle()}
                                            aria-label={`Preview ${game.title}`}
                                            aria-pressed={isPending}
                                        >
                                            <div className={`${styles.cardInner}${isPending ? ` ${styles.pending}` : ''}`}>
                                                <div className={styles.faceSpine}>
                                                    <span className={styles.spineTitle}>{game.title}</span>
                                                    {isConfirmed && <div className={styles.checkBadge}>✓</div>}
                                                </div>
                                                <div
                                                    className={styles.faceFront}
                                                    style={game.img ? undefined : { background: gradient }}
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

                <div className={styles.rightPane}>
                    {pendingGame ? (
                        <div className="flex flex-col h-full justify-between">
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
                            <div>
                                <div className={styles.chooseRow}>
                                    {renderActions?.(pendingGame)}
                                    <button
                                        className={paper.primaryButton}
                                        onClick={() => onSelect(pendingGame)}
                                        disabled={!!chooseDisabledReason}
                                    >
                                        Choose
                                    </button>
                                </div>
                                {chooseDisabledReason && <p className={styles.chooseHint}>{chooseDisabledReason}</p>}
                            </div>
                        </div>
                    ) : (
                        <div className={styles.metaEmpty}>
                            Select a cartridge
                        </div>
                    )}
                </div>

            </div>
            {footer && <div className={styles.footer}>{footer}</div>}
        </>
    );
}

interface CartridgePickerModalProps {
    isOpen: boolean;
    onClose: () => void;
    games: GameModel[];
    onSelect: (game: GameModel) => void;
    selectedFilePath?: string;
}

function CartridgePickerModal({ isOpen, onClose, games, onSelect, selectedFilePath }: CartridgePickerModalProps) {
    if (!isOpen) return null;

    return createPortal(
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            ariaLabel="Select Game"
            size="lg"
            className={`${paper.modalContent} ${paper.paperModal}`}
        >
            <h2 className={paper.modalTitle}>Select Game</h2>
            <CartridgeShelf
                games={games}
                onSelect={onSelect}
                selectedFilePath={selectedFilePath}
                initialGameId={games.find(game => game.filePath === selectedFilePath)?.id}
                emptyMessage="No games yet. Import a ROM from the Play page to get started."
            />
        </BaseModal>,
        // Outside any panel whose backdrop blur would trap the modal, but inside the shell for fullscreen
        getAppShell() ?? document.body
    );
}

export default CartridgePickerModal;
