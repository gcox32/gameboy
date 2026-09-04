import React from 'react';
import { Power, Pause, Play, RotateCcw, Save, FolderDown, Maximize, Minimize } from 'lucide-react';
import { Loader } from '@/components/ui';
import styles from './FullscreenSystemIcons.module.css';

interface FullscreenSystemIconsProps {
    intervalPaused: boolean;
    isEmulatorPlaying: boolean;
    isBrowserFullscreen: boolean;
    isRomLoaded: boolean;
    isSaving: boolean;
    onPowerToggle: () => void;
    onPauseResume: () => void;
    onReset: () => void;
    onSave: () => void;
    onSaveAs: () => void;
    onFullscreenToggle: () => void;
}

export default function FullscreenSystemIcons({
    intervalPaused,
    isEmulatorPlaying,
    isBrowserFullscreen,
    isRomLoaded,
    isSaving,
    onPowerToggle,
    onPauseResume,
    onReset,
    onSave,
    onSaveAs,
    onFullscreenToggle,
}: FullscreenSystemIconsProps) {
    return (
        <div className={styles.iconStrip}>
            <button
                type="button"
                title={isEmulatorPlaying ? 'Power Off' : 'New Game'}
                aria-label={isEmulatorPlaying ? 'Power Off' : 'New Game'}
                onClick={onPowerToggle}
                disabled={!isRomLoaded}
                className={styles.iconButton}
            >
                <Power size={18} />
            </button>

            <button
                type="button"
                title={intervalPaused ? 'Resume' : 'Pause'}
                aria-label={intervalPaused ? 'Resume' : 'Pause'}
                onClick={onPauseResume}
                disabled={!isEmulatorPlaying}
                className={styles.iconButton}
            >
                {intervalPaused ? <Play size={18} /> : <Pause size={18} />}
            </button>

            <button
                type="button"
                title="Reset"
                aria-label="Reset"
                onClick={onReset}
                disabled={!isEmulatorPlaying}
                className={styles.iconButton}
            >
                <RotateCcw size={18} />
            </button>

            <button
                type="button"
                title="Save"
                aria-label="Save"
                onClick={onSave}
                disabled={!isEmulatorPlaying}
                className={styles.iconButton}
            >
                {isSaving ? <Loader /> : <Save size={18} />}
            </button>

            <button
                type="button"
                title="Save As"
                aria-label="Save As"
                onClick={onSaveAs}
                disabled={!isEmulatorPlaying}
                className={styles.iconButton}
            >
                {isSaving ? <Loader /> : <FolderDown size={18} />}
            </button>

            <button
                type="button"
                title={isBrowserFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                aria-label={isBrowserFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                onClick={onFullscreenToggle}
                className={styles.iconButton}
            >
                {isBrowserFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
        </div>
    );
}
