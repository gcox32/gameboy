'use client';

import { KeyboardEvent, useRef, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { ArrowDownToLine, ArrowUpFromLine, FolderOpen, Sparkles, type LucideIcon } from 'lucide-react';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import { useGames } from '@/contexts/GamesContext';
import NowPlaying from '@/components/layout/NowPlaying';
import ExtractTab from './ExtractTab';
import PortInTab from './PortInTab';
import EditTab from './EditTab';
import { LabSavePickers } from './LabSave';
import { useLabSave, type LabSave } from './useLabSave';
import styles from './lab.module.css';

type Mode = 'extract' | 'port' | 'edit';

const MODES: { id: Mode; label: string; Icon: LucideIcon }[] = [
    { id: 'extract', label: 'Leave a Pokémon', Icon: ArrowDownToLine },
    { id: 'port', label: 'Take a Pokémon', Icon: ArrowUpFromLine },
    { id: 'edit', label: 'Enhance a Pokémon', Icon: Sparkles },
];

/** The light over the Save button: off with no save, amber until it's connected and read, then green */
function saveLed(lab: LabSave): 'off' | 'warn' | 'ready' {
    const { selectedGame, selectedSave, currentSave, contents } = lab;
    if (!selectedGame || !selectedSave?.id) return 'off';
    if (!currentSave?.connected || !contents) return 'warn';
    return 'ready';
}

/** A three-position slide switch, so it's plain that only one mode is on */
function ModeSwitch({ mode, setMode }: { mode: Mode; setMode: (m: Mode) => void }) {
    const index = MODES.findIndex(m => m.id === mode);
    const refs = useRef<(HTMLButtonElement | null)[]>([]);

    const handleKey = (e: KeyboardEvent) => {
        const by = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1
            : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
        if (!by) return;
        e.preventDefault();
        const next = Math.min(Math.max(index + by, 0), MODES.length - 1);
        setMode(MODES[next].id);
        refs.current[next]?.focus();
    };

    return (
        <div className={styles.switch} role="radiogroup" aria-label="Lab mode" onKeyDown={handleKey}>
            <div className={styles.track} aria-hidden>
                <span className={styles.thumb} style={{ transform: `translateX(${index * 100}%)` }} />
            </div>
            {MODES.map(({ id, label }, i) => (
                <button
                    key={id}
                    ref={el => { refs.current[i] = el; }}
                    type="button"
                    role="radio"
                    aria-checked={mode === id}
                    aria-label={label}
                    title={label}
                    tabIndex={mode === id ? 0 : -1}
                    className={styles.stop}
                    style={{ gridColumn: i + 1 }}
                    onClick={() => setMode(id)}
                >
                    <i className={clsx(styles.lamp, mode === id ? styles.lamp_on : styles.lamp_off)} aria-hidden />
                </button>
            ))}
        </div>
    );
}

/** The bottom console: game and save buttons, and the mode switch */
function LabConsole({ lab, mode, setMode }: { lab: LabSave; mode: Mode; setMode: (m: Mode) => void }) {
    return (
        <footer className={styles.console}>
            <div className={styles.consoleSlots}>
                <div className={styles.control}>
                    <button
                        type="button"
                        className={styles.pill}
                        onClick={() => lab.setGamePickerOpen(true)}
                        aria-label="Choose game"
                        title="Choose game"
                    >
                        <CartridgeIcon size={18} />
                    </button>
                </div>
                <div className={styles.control}>
                    <i className={clsx(styles.led, styles[`led_${saveLed(lab)}`])} aria-hidden />
                    <button
                        type="button"
                        className={styles.pill}
                        onClick={() => lab.setSavePickerOpen(true)}
                        disabled={!lab.selectedGame}
                        aria-label="Choose save file"
                        title="Choose save file"
                    >
                        <FolderOpen size={18} aria-hidden />
                    </button>
                </div>
            </div>

            <ModeSwitch mode={mode} setMode={setMode} />
        </footer>
    );
}

export default function OaksLab() {
    const [mode, setMode] = useState<Mode>('extract');
    const { games } = useGames();
    // Shared by every mode, and with Play and the Ranch
    const lab = useLabSave();

    return (
        <div className={styles.page}>
            <div className={styles.hero}>
                <Image
                    src="/images/oaks_lab.jpg"
                    alt=""
                    fill
                    className={styles.heroImg}
                    priority
                    unoptimized
                />
                <div className={styles.heroOverlay} />
            </div>

            <NowPlaying />

            <div className={styles.main}>
                {mode === 'extract' && <ExtractTab lab={lab} />}
                {mode === 'port' && <PortInTab lab={lab} />}
                {mode === 'edit' && <EditTab lab={lab} />}
            </div>

            <LabConsole lab={lab} mode={mode} setMode={setMode} />
            <LabSavePickers lab={lab} games={games} />
        </div>
    );
}
