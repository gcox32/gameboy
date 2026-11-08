import { MouseEvent, ReactNode, useEffect, useState } from 'react';
import {
    FolderDown,
    FolderOpen,
    Maximize,
    Minimize,
    Monitor,
    Pause,
    Play,
    Power,
    RotateCcw,
    Save,
    Volume2,
    VolumeX,
} from 'lucide-react';
import clsx from 'clsx';
import Tooltip from '@/components/common/Tooltip';
import CartridgeIcon from '@/components/icons/CartridgeIcon';
import GameManagement from '@/components/modals/GameManagement';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import { Loader } from '@/components/ui';
import { useCurrentGame } from '@/contexts/CurrentGameContext';
import { useEmulator } from '@/contexts/EmulatorContext';
import { useGames } from '@/contexts/GamesContext';
import { getNextSpeed, useSettings } from '@/contexts/SettingsContext';
import { GameModel, SaveStateModel } from '@/types';
import styles from './styles.module.css';

const ICON_SIZE = 18;
/** Fits the longest labels, like "Exit Fullscreen" */
const TOOLTIP_WIDTH = 210;
/** Number keys for the bar's controls, counting along it */
const SPEED_HOTKEY = '3';

/** Typing into a field keeps its keys */
const isTypingTarget = (target: EventTarget | null) =>
    target instanceof HTMLElement && (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

/** For a toggle that changes the whole view, where no next click would move focus off it */
const blurAfter = (action: () => void) => (e: MouseEvent<HTMLButtonElement>) => {
    action();
    e.currentTarget.blur();
};

interface BarButtonProps {
    label: string;
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
    isActive?: boolean;
    disabled?: boolean;
    className?: string;
    children: ReactNode;
}

function BarButton({ label, onClick, isActive, disabled, className, children }: BarButtonProps) {
    return (
        <Tooltip label={label} width={TOOLTIP_WIDTH}>
            <button
                type="button"
                aria-label={label}
                onClick={onClick}
                disabled={disabled}
                className={clsx(styles.button, isActive && styles.active, className)}
            >
                {children}
            </button>
        </Tooltip>
    );
}

/** The game's controls: choosing and starting one, then everything that acts on it while it runs */
export default function SessionBar() {
    const {
        activeROM,
        activeState,
        userSaveStates,
        isRomLoaded,
        isEmulatorPlaying,
        intervalPaused,
        isSaving,
        isImmersive,
        isBrowserFullscreen,
        handleROMSelected,
        requestLoadSaveState,
        onDeleteSaveState,
        handlePauseResume,
        handleSaveState,
        handleSaveAs,
        handleResetConfirm,
        handlePowerToggleConfirm,
        toggleFullscreenMode,
        toggleBrowserFullscreen,
    } = useEmulator();
    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn } = uiSettings;
    const { isLoading: isLoadingGames } = useGames();
    // A save chosen here or in the Lab, waiting to be played
    const { save: currentSave } = useCurrentGame();
    const continueSave = !isEmulatorPlaying ? currentSave : null;
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [isLoadStateOpen, setIsLoadStateOpen] = useState(false);

    const cycleSpeed = () => updateUISettings({ speed: getNextSpeed(speed) });

    useEffect(() => {
        if (!isEmulatorPlaying) return;
        // A key the player mapped to the Game Boy stays with the game
        const isMapped = uiSettings.keyMappings.some(mapping => mapping.key === SPEED_HOTKEY);
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== SPEED_HOTKEY || isMapped || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;
            if (isTypingTarget(e.target)) return;
            e.preventDefault();
            cycleSpeed();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    });

    const handleGameSelect = (game: GameModel) => {
        handleROMSelected(game);
        setIsLibraryOpen(false);
    };

    const handleGameEdited = (updatedGame: GameModel) => {
        // If this is the currently selected ROM, reload it
        if (activeROM?.id === updatedGame.id) handleROMSelected(updatedGame);
    };

    const handleLoadSaveState = (selectedSaveState: SaveStateModel) => {
        requestLoadSaveState(selectedSaveState, () => setIsLoadStateOpen(false));
    };

    return (
        <>
            {/* The bar's transform would trap a modal rendered inside it */}
            <div className={styles.bar} role="toolbar" aria-label="Game controls">
                <BarButton
                    label={isEmulatorPlaying ? 'Game Library' : 'Select Game'}
                    onClick={() => setIsLibraryOpen(true)}
                    disabled={isLoadingGames}
                >
                    <CartridgeIcon size={ICON_SIZE} />
                </BarButton>

                <span className={styles.divider} />

                {isEmulatorPlaying && (
                    <>
                        <BarButton label={intervalPaused ? 'Resume' : 'Pause'} onClick={handlePauseResume}>
                            {intervalPaused ? <Play size={ICON_SIZE} /> : <Pause size={ICON_SIZE} />}
                        </BarButton>
                        <BarButton label={`Game speed ${speed}x`} onClick={cycleSpeed} className={styles.speedButton}>
                            {speed}x
                        </BarButton>
                        <BarButton label={isSoundOn ? 'Mute' : 'Unmute'} onClick={() => updateUISettings({ isSoundOn: !isSoundOn })}>
                            {isSoundOn ? <Volume2 size={ICON_SIZE} /> : <VolumeX size={ICON_SIZE} />}
                        </BarButton>

                        <span className={styles.divider} />

                        <BarButton label="Save" onClick={handleSaveState} disabled={isSaving}>
                            {isSaving ? <Loader /> : <Save size={ICON_SIZE} />}
                        </BarButton>
                        <BarButton label="Save As" onClick={handleSaveAs} disabled={isSaving}>
                            <FolderDown size={ICON_SIZE} />
                        </BarButton>
                    </>
                )}
                <BarButton
                    label="Load State"
                    onClick={() => setIsLoadStateOpen(true)}
                    disabled={!isRomLoaded || userSaveStates.length === 0}
                >
                    <FolderOpen size={ICON_SIZE} />
                </BarButton>

                <span className={styles.divider} />

                {isEmulatorPlaying && (
                    <BarButton label="Reset" onClick={handleResetConfirm}>
                        <RotateCcw size={ICON_SIZE} />
                    </BarButton>
                )}
                {continueSave && (
                    <BarButton
                        label="Continue"
                        onClick={() => requestLoadSaveState(continueSave, () => {})}
                        disabled={!isRomLoaded}
                        className={styles.continueButton}
                    >
                        <Play size={ICON_SIZE} />
                    </BarButton>
                )}
                <BarButton label={isEmulatorPlaying ? 'Power Off' : 'New Game'} onClick={handlePowerToggleConfirm} disabled={!isRomLoaded}>
                    {isEmulatorPlaying || continueSave ? <Power size={ICON_SIZE} /> : <Play size={ICON_SIZE} />}
                </BarButton>

                <span className={styles.divider} />

                <BarButton label="Immersive" onClick={blurAfter(toggleFullscreenMode)} isActive={isImmersive} disabled={!isRomLoaded}>
                    <Monitor size={ICON_SIZE} />
                </BarButton>
                <BarButton label={isBrowserFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} onClick={blurAfter(toggleBrowserFullscreen)}>
                    {isBrowserFullscreen ? <Minimize size={ICON_SIZE} /> : <Maximize size={ICON_SIZE} />}
                </BarButton>
            </div>

            <GameManagement
                isOpen={isLibraryOpen}
                onClose={() => setIsLibraryOpen(false)}
                selectedGame={activeROM}
                onSelect={handleGameSelect}
                chooseDisabledReason={isEmulatorPlaying ? 'Power off to change games.' : undefined}
                onGameEdited={handleGameEdited}
            />
            <LoadStateModal
                isOpen={isLoadStateOpen}
                onClose={() => setIsLoadStateOpen(false)}
                saveStates={userSaveStates}
                onConfirm={handleLoadSaveState}
                onDelete={onDeleteSaveState}
                activeSaveId={activeState?.id}
            />
        </>
    );
}
