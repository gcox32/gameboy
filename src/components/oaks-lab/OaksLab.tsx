'use client';

import { CSSProperties, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { FedMonitor, FedPlatform, MonitorSource, SlideSwitch, StageFeedProvider, UI_MS, press, useFeedStore } from './stage';
import { useLabSave, type LabSave } from './save/useLabSave';
import styles from './lab.module.css';

type Mode = 'extract' | 'port' | 'edit';

/** How long the static holds once the next mode is on the stage, before it clears */
const STATIC_HOLD_MS = 100;

/**
 * Where each mode sets the monitor's switch when the Lab changes to it: the only source Leave
 * and Take can use, and the Ranch for Enhance. It can still be moved; a source a mode has
 * nothing for shows static.
 */
const MODE_SOURCE: Record<Mode, MonitorSource> = { extract: 'save', port: 'ranch', edit: 'ranch' };

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
    // Read once, on arrival (see enhanceAtRanchHref). The address is then cleared so a reload
    // starts fresh, and the Pokémon is forgotten once the Lab leaves Enhance.
    const params = useSearchParams();
    const router = useRouter();
    const [ranchId, setRanchId] = useState(() => (params.get('mode') === 'edit' && params.get('ranch')) || undefined);
    const startMode: Mode = ranchId ? 'edit' : 'extract';
    useEffect(() => {
        if (params.size) router.replace('/lab', { scroll: false });
    }, [params, router]);

    // The switch's position, which follows a press straight away
    const [mode, setMode] = useState<Mode>(startMode);
    // The mode on the stage, which waits for the old deck to leave
    const [shownMode, setShownMode] = useState<Mode>(startMode);
    const leaving = mode !== shownMode;
    // The monitor shows static from the press until the next mode has settled in
    const [tuning, setTuning] = useState(false);

    // The monitor's switch, which follows a press straight away
    const [source, setSource] = useState<MonitorSource>(MODE_SOURCE[startMode]);
    // What the monitor shows, which waits for the thumb to get there
    const [shownSource, setShownSource] = useState<MonitorSource>(MODE_SOURCE[startMode]);
    useEffect(() => {
        if (source === shownSource) return;
        const t = setTimeout(() => setShownSource(source), UI_MS);
        return () => clearTimeout(t);
    }, [source, shownSource]);

    const switchMode = (m: Mode) => {
        if (m === mode) return;
        setRanchId(undefined);
        setMode(m);
        setSource(MODE_SOURCE[m]);
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
    const feed = useFeedStore();

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
                <StageFeedProvider store={feed}>
                    <div className={styles.stage}>
                        {/* Keyed so each mode's deck slides in. The fixtures beside it stay put. */}
                        <div key={shownMode} className={styles.stagePanel}>
                            {shownMode === 'extract' && <ExtractTab lab={lab} />}
                            {shownMode === 'port' && <PortInTab lab={lab} />}
                            {shownMode === 'edit' && (
                                <EditTab lab={lab} ranchId={ranchId} source={source} shownSource={shownSource} />
                            )}
                        </div>
                        <div className={styles.stagePlatform}>
                            <FedPlatform store={feed} />
                        </div>
                        <div className={styles.stageMonitor}>
                            <FedMonitor
                                store={feed}
                                source={source}
                                shownSource={shownSource}
                                onSourceChange={setSource}
                            />
                        </div>
                    </div>
                </StageFeedProvider>
            </div>

            <LabConsole lab={lab} mode={mode} setMode={switchMode} />
            <LabSavePickers lab={lab} games={games} />
        </div>
    );
}
