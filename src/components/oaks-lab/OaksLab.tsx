'use client';

import { CSSProperties, useEffect, useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { FolderOpen } from 'lucide-react';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import { useGames } from '@/contexts/GamesContext';
import NowPlaying from '@/components/layout/NowPlaying';
import ExtractTab from './modes/ExtractTab';
import PortInTab from './modes/PortInTab';
import EditTab from './modes/EditTab';
import { LabSavePickers } from './save/LabSave';
import { SlideSwitch, press } from './stage';
import { useLabSave, type LabSave } from './save/useLabSave';
import styles from './lab.module.css';

type Mode = 'extract' | 'port' | 'edit';

/** How long every press, slide and fade in the Lab takes. Becomes --ui-ms for the styles. */
const UI_MS = 300;

/** How long the static holds once the next mode is on the stage, before it clears */
const STATIC_HOLD_MS = 100;

const MODES: { id: Mode; label: string }[] = [
    { id: 'extract', label: 'Leave a Pokémon' },
    { id: 'port', label: 'Take a Pokémon' },
    { id: 'edit', label: 'Enhance a Pokémon' },
];

/** The light over the Save button: off with no save, amber until it's connected and read, then green */
function saveLed(lab: LabSave): 'off' | 'warn' | 'ready' {
    const { selectedGame, selectedSave, currentSave, contents } = lab;
    if (!selectedGame || !selectedSave?.id) return 'off';
    if (!currentSave?.connected || !contents) return 'warn';
    return 'ready';
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
                        {...press(!lab.selectedGame, () => lab.setSavePickerOpen(true))}
                        aria-label="Choose save file"
                        title="Choose save file"
                    >
                        <FolderOpen size={18} aria-hidden />
                    </button>
                </div>
            </div>

            <SlideSwitch label="Lab mode" options={MODES} value={mode} onChange={setMode} />
        </footer>
    );
}

export default function OaksLab() {
    // The switch's position, which follows a press straight away
    const [mode, setMode] = useState<Mode>('extract');
    // The mode on the stage, which waits for the old deck to leave
    const [shownMode, setShownMode] = useState<Mode>('extract');
    const leaving = mode !== shownMode;
    // The monitor shows static from the press until the next mode has settled in
    const [tuning, setTuning] = useState(false);

    const switchMode = (m: Mode) => {
        if (m === mode) return;
        setMode(m);
        setTuning(true);
    };

    useEffect(() => {
        if (mode === shownMode) return;
        const t = setTimeout(() => setShownMode(mode), UI_MS);
        return () => clearTimeout(t);
    }, [mode, shownMode]);

    useEffect(() => {
        if (!tuning || leaving) return;
        const t = setTimeout(() => setTuning(false), STATIC_HOLD_MS);
        return () => clearTimeout(t);
    }, [tuning, leaving]);
    const { games } = useGames();
    // Shared by every mode, and with Play and the Ranch
    const lab = useLabSave();

    return (
        <div className={styles.page} style={{ '--ui-ms': `${UI_MS}ms` } as CSSProperties}>
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

            <div className={clsx(styles.main, leaving && styles.leaving, tuning && styles.tuning)}>
                {shownMode === 'extract' && <ExtractTab lab={lab} />}
                {shownMode === 'port' && <PortInTab lab={lab} />}
                {shownMode === 'edit' && <EditTab lab={lab} />}
            </div>

            <LabConsole lab={lab} mode={mode} setMode={switchMode} />
            <LabSavePickers lab={lab} games={games} />
        </div>
    );
}
