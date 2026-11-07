'use client';

import { useState, useEffect, useCallback, ChangeEvent } from 'react';
import { signOut } from 'next-auth/react';
import { Loader } from '@/components/ui';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import CustomSwitch from '@/components/common/CustomSwitch';
import ProfileModal from '@/components/modals/ProfileModal';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentGame } from '@/contexts/CurrentGameContext';
import { useEmulator } from '@/contexts/EmulatorContext';
import { useGame } from '@/contexts/GameContext';
import { useGames } from '@/contexts/GamesContext';
import { useProfile } from '@/contexts/ProfileContext';
import { getNextSpeed, useSettings } from '@/contexts/SettingsContext';
import styles from './styles.module.css';
import { SaveStateModel } from '@/types';

export default function MobileControls() {
    const currentUser = useAuth()?.user;
    const { stopGame } = useGame();
    const {
        handleROMSelected: onROMSelected,
        isEmulatorPlaying,
        intervalPaused,
        handlePauseResume: onPauseResume,
        isRomLoaded,
        userSaveStates,
        isSaving,
        activeState: activeSaveState,
        requestLoadSaveState,
        onDeleteSaveState,
        handleActionWithConfirmation,
        handlePowerToggleConfirm,
        handleResetConfirm,
        handleSaveState,
        handleSaveAs,
    } = useEmulator();
    const [isOpen, setIsOpen] = useState(false);
    const { games, isLoading: loading } = useGames();
    const { game: currentGame, save: currentSave } = useCurrentGame();
    const continueSave = !isEmulatorPlaying ? currentSave : null;
    const { profile: userProfile } = useProfile();
    const avatarUrl = userProfile?.avatar || null;

    const [showLoadModal, setShowLoadModal] = useState(false);

    const { uiSettings, updateUISettings } = useSettings();
    const { speed, isSoundOn, skipConfirmations } = uiSettings;
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    const fetchNotificationCount = useCallback(async () => {
        if (!currentUser?.userId) return;
        try {
            const res = await fetch('/api/notifications?unread=true');
            if (!res.ok) return;
            const items = await res.json();
            setUnreadNotifCount(Array.isArray(items) ? items.length : 0);
        } catch (error) {
            console.error('Error fetching notifications:', error);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser?.userId) fetchNotificationCount();
    }, [currentUser, fetchNotificationCount]);

    const handleROMChange = (e: ChangeEvent<HTMLSelectElement>) => {
        const selectedROM = games.find(game => game.filePath === e.target.value);
        if (selectedROM) { onROMSelected(selectedROM); setIsOpen(false); }
    };

    // Closes the drawer first, so any modal the action opens has the screen to itself
    const runAndCloseDrawer = (action: () => void) => {
        setIsOpen(false);
        action();
    };

    const handleLoadSaveState = (selectedSaveState: SaveStateModel) => {
        requestLoadSaveState(selectedSaveState, () => {
            setShowLoadModal(false);
            setIsOpen(false);
        });
    };

    const handleLogout = async () => {
        try {
            // The player has already agreed to leave, so the page-leave warning shouldn't ask again
            stopGame();
            await signOut({ callbackUrl: '/' });
        } catch (error) {
            console.error('Error signing out:', error);
        }
    };

    return (
        <>
            <button className={styles.toggleButton} onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {isOpen ? (<><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>) : (<><line x1="4" y1="8" x2="20" y2="8" /><line x1="4" y1="16" x2="20" y2="16" /></>)}
                </svg>
                {unreadNotifCount > 0 && !isOpen && (
                    <span className={styles.badge}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
                )}
            </button>

            {isOpen && <div className={styles.backdrop} onClick={() => setIsOpen(false)} />}

            <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
                <div className={styles.panelContent}>
                    <div className={styles.userSection}>
                        <div className={styles.userInfo}>
                            {avatarUrl ? (
                                /* eslint-disable-next-line @next/next/no-img-element */
                                <img src={avatarUrl} alt="Avatar" className={styles.avatar} />
                            ) : (
                                <div className={styles.avatarPlaceholder}>
                                    {userProfile?.username?.[0] || currentUser?.userId?.[0] || '?'}
                                </div>
                            )}
                            <span className={styles.userName}>{userProfile?.username || 'Player'}</span>
                        </div>
                        <div className={styles.userActions}>
                            <button onClick={() => setShowProfileModal(true)} className={styles.iconButton} aria-label="Profile">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                            </button>
                            <button
                                onClick={() => isEmulatorPlaying
                                    ? handleActionWithConfirmation(handleLogout, "Logging out will turn off the game. Are you sure?")
                                    : handleLogout()}
                                className={`${styles.iconButton} ${styles.logoutButton}`}
                                aria-label="Logout"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                            </button>
                        </div>
                    </div>

                    <div className={styles.divider} />

                    <div className={styles.section}>
                        <label className={styles.label}>Game</label>
                        {loading ? (
                            <div className={styles.loading}>Loading games...</div>
                        ) : (
                            <select onChange={handleROMChange} disabled={isEmulatorPlaying} className={styles.select} value={currentGame?.filePath ?? ''}>
                                <option value="" disabled>Select a game</option>
                                {games.map(game => (
                                    <option key={game.id} value={game.filePath}>{game.title}</option>
                                ))}
                            </select>
                        )}
                        {activeSaveState && <div className={styles.activeSave}>Playing: {activeSaveState.title}</div>}
                    </div>

                    <div className={styles.section}>
                        {continueSave && (
                            <div className={styles.buttonRow}>
                                <button
                                    onClick={() => requestLoadSaveState(continueSave, () => setIsOpen(false))}
                                    disabled={!isRomLoaded}
                                    className={`${styles.button} ${styles.primary}`}
                                >
                                    Continue {continueSave.title}
                                </button>
                            </div>
                        )}
                        <div className={styles.buttonRow}>
                            <button onClick={() => runAndCloseDrawer(handlePowerToggleConfirm)} disabled={!isRomLoaded} className={`${styles.button} ${continueSave ? '' : styles.primary}`}>
                                {isEmulatorPlaying ? 'Off' : continueSave ? 'New Game' : 'Start'}
                            </button>
                            <button onClick={onPauseResume} disabled={!isEmulatorPlaying} className={styles.button}>
                                {intervalPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button onClick={() => runAndCloseDrawer(handleResetConfirm)} disabled={!isEmulatorPlaying} className={`${styles.button} ${styles.warning}`}>
                                Reset
                            </button>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <div className={styles.buttonRow}>
                            <button onClick={() => updateUISettings({ speed: getNextSpeed(speed) })} className={styles.button}>
                                Speed {speed}x
                            </button>
                            <button onClick={() => updateUISettings({ isSoundOn: !isSoundOn })} className={styles.button} aria-pressed={isSoundOn}>
                                {isSoundOn ? 'Sound On' : 'Sound Off'}
                            </button>
                        </div>
                        <CustomSwitch
                            className={styles.settingRow}
                            label="Ask before interrupting a running game"
                            isChecked={!skipConfirmations}
                            onChange={() => updateUISettings({ skipConfirmations: !skipConfirmations })}
                        />
                    </div>

                    <div className={styles.section}>
                        <div className={styles.buttonRow}>
                            <button onClick={() => runAndCloseDrawer(handleSaveState)} disabled={!isEmulatorPlaying} className={`${styles.button} ${styles.primary}`}>
                                {isSaving ? <Loader /> : 'Save'}
                            </button>
                            <button onClick={() => runAndCloseDrawer(handleSaveAs)} disabled={!isEmulatorPlaying} className={styles.button}>
                                Save As
                            </button>
                            <button onClick={() => setShowLoadModal(true)} disabled={!isRomLoaded || userSaveStates.length === 0} className={styles.button}>
                                Load
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <LoadStateModal
                isOpen={showLoadModal}
                onClose={() => setShowLoadModal(false)}
                saveStates={userSaveStates}
                onConfirm={handleLoadSaveState}
                onDelete={onDeleteSaveState}
                activeSaveId={activeSaveState?.id}
            />

            <ProfileModal isOpen={showProfileModal} onClose={() => setShowProfileModal(false)} />
        </>
    );
}
