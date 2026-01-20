'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { generateClient } from 'aws-amplify/api';
import { type Schema } from '@/amplify/data/resource';
import { getUrl } from 'aws-amplify/storage';
import { signOut } from 'aws-amplify/auth';
import { Loader } from '@/components/ui';
import SaveStateModal, { PartialSaveStateModel } from '@/components/modals/SaveStateManagement/SaveStateModal';
import LoadStateModal from '@/components/modals/SaveStateManagement/LoadStateModal';
import ConfirmModal from '@/components/modals/utilities/ConfirmModal';
import SettingsModal from '@/components/modals/SettingsModal';
import ProfileModal from '@/components/modals/ProfileModal';
import { getS3Url } from '@/utils/saveLoad';
import styles from './styles.module.css';
import { GameModel, SaveStateModel, AuthenticatedUser, SRAMArray, ProfileModel } from '@/types';

const client = generateClient<Schema>();

interface MobileControlsProps {
  // Game selection
  onROMSelected: (rom: GameModel) => void;
  isEmulatorPlaying: boolean;
  currentUser: AuthenticatedUser;
  // System controls
  intervalPaused: boolean;
  onPauseResume: () => void;
  onReset: () => void;
  onPowerToggle: () => void;
  isRomLoaded: boolean;
  userSaveStates: SaveStateModel[];
  isSaving: boolean;
  activeSaveState: SaveStateModel | null;
  // Save/Load handlers
  onSaveConfirmed: (saveData: SaveStateModel, isUpdate: boolean) => Promise<void>;
  runFromSaveState: (sramArray: SRAMArray, selectedSaveState: SaveStateModel) => void;
  onDeleteSaveState: () => void;
}

export default function MobileControls({
  onROMSelected,
  isEmulatorPlaying,
  currentUser,
  intervalPaused,
  onPauseResume,
  onReset,
  onPowerToggle,
  isRomLoaded,
  userSaveStates,
  isSaving,
  activeSaveState,
  onSaveConfirmed,
  runFromSaveState,
  onDeleteSaveState,
}: MobileControlsProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [games, setGames] = useState<GameModel[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states for game controls
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState<(() => void) | null>(null);
  const [confirmMessage, setConfirmMessage] = useState('');
  const [skipConfirmation, setSkipConfirmation] = useState(false);
  const [activeROMData, setActiveROMData] = useState<SaveStateModel | null>(null);

  // Nav-related states
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userProfile, setUserProfile] = useState<ProfileModel | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  const fetchGames = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const gamesList = await client.models.Game.list({
        filter: {
          owner: { eq: currentUser.userId }
        }
      });
      setGames(gamesList.data as GameModel[]);
    } catch (err) {
      console.error('Failed to fetch games:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  const fetchUserProfile = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const profiles = await client.models.Profile.list({
        filter: {
          owner: { eq: currentUser.userId }
        }
      });
      if (profiles.data.length > 0) {
        const profile = profiles.data[0];
        setUserProfile(profile as ProfileModel);
        if (profile.avatar) {
          const url = await getS3Url(profile.avatar);
          setAvatarUrl(url);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  }, [currentUser]);

  const fetchNotificationCount = useCallback(async () => {
    if (!currentUser?.userId) return;
    try {
      const resp = await client.models.Notification.list({
        filter: {
          or: [
            { owner: { eq: currentUser.userId } },
            { sender: { eq: 'SYSTEM' } }
          ]
        },
        limit: 50
      });
      const unread = (resp.data ?? []).filter((n) => !n.readAt).length;
      setUnreadNotifCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [currentUser]);

  useEffect(() => {
    if (isOpen && games.length === 0) {
      fetchGames();
    }
  }, [isOpen, games.length, fetchGames]);

  useEffect(() => {
    if (currentUser?.userId) {
      fetchUserProfile();
      fetchNotificationCount();
    }
  }, [currentUser, fetchUserProfile, fetchNotificationCount]);

  // Sync activeROMData with activeSaveState
  useEffect(() => {
    if (activeSaveState) {
      setActiveROMData(activeSaveState);
    }
  }, [activeSaveState]);

  const handleROMChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    const selectedROM = games.find(game => game.filePath === selectedValue);
    if (selectedROM) {
      onROMSelected(selectedROM);
      setIsOpen(false);
    }
  };

  const handleActionWithConfirmation = (action: () => void, message: string) => {
    if (skipConfirmation) {
      action();
      return;
    }
    if (!intervalPaused) onPauseResume();
    setConfirmMessage(message);
    setShowConfirmModal(true);
    setConfirmAction(() => action);
  };

  const handlePowerToggle = () => {
    if (isEmulatorPlaying) {
      handleActionWithConfirmation(onPowerToggle, "Are you sure you want to turn off the game?");
    } else {
      onPowerToggle();
      setIsOpen(false);
    }
  };

  const handleResetConfirm = () => {
    handleActionWithConfirmation(onReset, "Are you sure you want to reset the game?");
  };

  const handleSave = async () => {
    if (!isRomLoaded || !isEmulatorPlaying) return;
    if (activeROMData) {
      // Quick save - update existing
      try {
        await onSaveConfirmed(activeROMData, true);
        setIsOpen(false);
      } catch (error) {
        console.error('Error during save:', error);
      }
    } else {
      // Open save modal for new save
      if (!intervalPaused) onPauseResume();
      setShowSaveModal(true);
    }
  };

  const handleSaveAs = () => {
    if (!isRomLoaded || !isEmulatorPlaying) return;
    if (!intervalPaused) onPauseResume();
    setShowSaveModal(true);
  };

  const handleLoadSaveState = async (selectedSaveState: SaveStateModel) => {
    try {
      const signedUrl = await getUrl({ path: selectedSaveState.filePath });
      const response = await fetch(signedUrl.url);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const saveDataObject = JSON.parse(await response.text());
      const sramArray = saveDataObject.MBCRam;
      if (!sramArray || !Array.isArray(sramArray)) {
        throw new Error('Invalid or corrupted MBCRam data in the save state.');
      }
      runFromSaveState(sramArray, selectedSaveState);
      setShowLoadModal(false);
      setActiveROMData(selectedSaveState);
      setIsOpen(false);
    } catch (error) {
      console.error('Error loading save state:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <>
      {/* Toggle button - small icon in corner */}
      <button
        className={styles.toggleButton}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isOpen ? (
            // X icon
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            // Menu icon (hamburger)
            <>
              <line x1="4" y1="8" x2="20" y2="8" />
              <line x1="4" y1="16" x2="20" y2="16" />
            </>
          )}
        </svg>
        {/* Notification badge on menu button */}
        {unreadNotifCount > 0 && !isOpen && (
          <span className={styles.badge}>{unreadNotifCount > 9 ? '9+' : unreadNotifCount}</span>
        )}
      </button>

      {/* Overlay backdrop */}
      {isOpen && (
        <div
          className={styles.backdrop}
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Control panel */}
      <div className={`${styles.panel} ${isOpen ? styles.open : ''}`}>
        <div className={styles.panelContent}>
          {/* User section */}
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
              <span className={styles.userName}>
                {userProfile?.username || 'Player'}
              </span>
            </div>
            <div className={styles.userActions}>
              <button
                onClick={() => setShowProfileModal(true)}
                className={styles.iconButton}
                aria-label="Profile"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
              </button>
              <button
                onClick={() => setShowSettingsModal(true)}
                className={styles.iconButton}
                aria-label="Settings"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
                </svg>
              </button>
              <button
                onClick={handleLogout}
                className={`${styles.iconButton} ${styles.logoutButton}`}
                aria-label="Logout"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Divider */}
          <div className={styles.divider} />

          {/* Game Selection */}
          <div className={styles.section}>
            <label className={styles.label}>Game</label>
            {loading ? (
              <div className={styles.loading}>Loading games...</div>
            ) : (
              <select
                onChange={handleROMChange}
                disabled={isEmulatorPlaying}
                className={styles.select}
                defaultValue=""
              >
                <option value="" disabled>Select a game</option>
                {games.map(game => (
                  <option key={game.id} value={game.filePath}>
                    {game.title}
                  </option>
                ))}
              </select>
            )}
            {activeSaveState && (
              <div className={styles.activeSave}>
                Playing: {activeSaveState.title}
              </div>
            )}
          </div>

          {/* Power Controls */}
          <div className={styles.section}>
            <div className={styles.buttonRow}>
              <button
                onClick={handlePowerToggle}
                disabled={!isRomLoaded}
                className={`${styles.button} ${styles.primary}`}
              >
                {isEmulatorPlaying ? 'Power Off' : 'Start'}
              </button>
              <button
                onClick={onPauseResume}
                disabled={!isEmulatorPlaying}
                className={styles.button}
              >
                {intervalPaused ? 'Resume' : 'Pause'}
              </button>
              <button
                onClick={handleResetConfirm}
                disabled={!isEmulatorPlaying}
                className={`${styles.button} ${styles.warning}`}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Save/Load Controls */}
          <div className={styles.section}>
            <div className={styles.buttonRow}>
              <button
                onClick={handleSave}
                disabled={!isEmulatorPlaying}
                className={`${styles.button} ${styles.primary}`}
              >
                {isSaving ? <Loader /> : 'Save'}
              </button>
              <button
                onClick={handleSaveAs}
                disabled={!isEmulatorPlaying}
                className={styles.button}
              >
                Save As
              </button>
              <button
                onClick={() => setShowLoadModal(true)}
                disabled={!isRomLoaded || isEmulatorPlaying || userSaveStates.length === 0}
                className={styles.button}
              >
                Load
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Game Modals */}
      <ConfirmModal
        isOpen={showConfirmModal}
        onClose={() => {
          setShowConfirmModal(false);
          if (intervalPaused) onPauseResume();
        }}
        onConfirm={() => {
          if (confirmAction) confirmAction();
          setShowConfirmModal(false);
        }}
        skipConfirmation={skipConfirmation}
        toggleSkipConfirmation={() => setSkipConfirmation(!skipConfirmation)}
      >
        {confirmMessage}
      </ConfirmModal>

      <SaveStateModal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          if (intervalPaused) onPauseResume();
        }}
        onConfirm={async (saveData: PartialSaveStateModel) => {
          try {
            await onSaveConfirmed(saveData as SaveStateModel, false);
            setActiveROMData(saveData as SaveStateModel);
            setShowSaveModal(false);
            setIsOpen(false);
          } catch (error) {
            console.error('Error during save:', error);
          }
        }}
        initialData={activeROMData as PartialSaveStateModel}
      />

      <LoadStateModal
        isOpen={showLoadModal}
        onClose={() => setShowLoadModal(false)}
        saveStates={userSaveStates}
        onConfirm={handleLoadSaveState}
        onDelete={onDeleteSaveState}
      />

      {/* Nav Modals */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
      />

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        userProfile={userProfile as ProfileModel}
        onUpdate={fetchUserProfile}
      />
    </>
  );
}
