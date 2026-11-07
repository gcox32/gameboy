'use client';

import { useState } from 'react';
import Image from 'next/image';
import clsx from 'clsx';
import { FolderOpen } from 'lucide-react';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import { useGames } from '@/contexts/GamesContext';
import NowPlaying from '@/components/layout/NowPlaying';
import ExtractTab from './ExtractTab';
import PortInTab from './PortInTab';
import EditTab from './EditTab';
import { LabSavePickers } from './LabSave';
import { SlideSwitch, press } from './LabStage';
import { useLabSave, type LabSave } from './useLabSave';
import styles from './lab.module.css';

type Mode = 'extract' | 'port' | 'edit';

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
