import { useState, useRef, useEffect, useCallback } from 'react';
import { loadInGameFile } from '@/utils/saveLoad';
import { useSettings } from '@/contexts/SettingsContext';
import { useGame } from '@/contexts/GameContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrentGame } from '@/contexts/CurrentGameContext';
import { useSaveState, SaveConflictError } from '@/hooks/useSaveState';
import { useBrowserFullscreen } from '@/hooks/useBrowserFullscreen';
import { useSystemActions } from '@/hooks/useSystemActions';
import { useToast } from '@/components/ui';
import GameBoyCore from '@/utils/GameBoyCore';
import { captureScreenshot } from '@/utils/captureScreenshot';
import { GameBoyCoreInstance, GameModel, SaveStateModel, SRAMArray } from '@/types';
import {
    registerGUIEvents,
    keyDown,
    keyUp
} from '@/utils/other/gui';
import {
    GameBoyEmulatorInitialized,
    GameBoyEmulatorPlaying,
    settings,
    clearLastEmulation
} from '@/utils/GameBoyIO';

/**
 * Owns the running emulator: its lifecycle, canvases, loaded game and saves.
 * Read it through useEmulator() from EmulatorContext, not directly.
 */
export function useEmulatorController() {
    const { uiSettings } = useSettings();
    const { speed, isSoundOn } = uiSettings;

    // Refs to access the DOM elements
    const gameBoyInstance = useRef<GameBoyCoreInstance>(null);
    const runInterval = useRef<NodeJS.Timeout | null>(null);
    const mainCanvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenCanvasRef = useRef<HTMLCanvasElement>(null);
    const fullscreenContainerRef = useRef<HTMLDivElement>(null);
    const mbcRamRef = useRef<SRAMArray>([]);
    const inGameMemory = useRef<SRAMArray>([]);
    const gbcMemory = useRef<SRAMArray>([]);

    // Maintain states
    const auth = useAuth();
    const currentUser = auth?.user ?? null;
    const [ROMImage, setROMImage] = useState<string | null>(null);
    const [activeROM, setActiveROM] = useState<GameModel | null>(null);
    // The game and save Play, the Lab and the Ranch share. The save list lives there too.
    const currentGame = useCurrentGame();
    const { saveStates: userSaveStates, refreshSaves, setSave: setCurrentSave } = currentGame;
    const [activeState, setActiveState] = useState<SaveStateModel | null>(null);
    const [activeSaveArray, setActiveSaveArray] = useState<SRAMArray>([]);
    const [isRomLoaded, setIsRomLoaded] = useState(false);
    const [intervalPaused, setIntervalPaused] = useState(false);
    const [isEmulatorPlaying, setIsEmulatorPlaying] = useState(false);
    const [isEmulatorOn, setIsEmulatorOn] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenBackground, setFullscreenBackground] = useState('');

    const { gameState, startGame, stopGame, setMemoryRefs, setRom } = useGame();
    const { showToast } = useToast();

    const { saveThisState, isSaving } = useSaveState(
        gameBoyInstance.current || { saveSRAMState: () => [] },
        activeROM || { id: '', userId: '', title: '', filePath: '', metadata: {} },
        currentUser?.userId || '',
        currentUser?.email || '',
    );

    // Real browser Fullscreen API (distinct from `isFullscreen` above, which is
    // the app's own Immersive overlay/canvas-swap mode)
    const { isFullscreen: isBrowserFullscreen, toggle: toggleBrowserFullscreen } =
        useBrowserFullscreen();

    // Update game context when emulator state changes
    useEffect(() => {
        if (isEmulatorPlaying && activeROM) {
            startGame({
                id: activeROM.id,
                title: activeROM.title || 'title',
                userId: activeROM.userId,
                filePath: activeROM.filePath,
                metadata: activeROM.metadata
            });
        } else {
            stopGame();
        }
    }, [isEmulatorPlaying, activeROM, startGame, stopGame]);

    // Warns before a refresh or closing the tab. Confirming an in-app prompt clears
    // isPlaying first, so a logout's redirect doesn't ask a second time.
    const shouldWarnBeforeLeaving = gameState.isPlaying && !uiSettings.skipConfirmations;
    useEffect(() => {
        if (!shouldWarnBeforeLeaving) return;
        const handleBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, [shouldWarnBeforeLeaving]);

    const run = (gameboyInstance: GameBoyCoreInstance) => {
        setIntervalPaused(false);
        if (GameBoyEmulatorInitialized(gameboyInstance) && gameboyInstance) {
            if (!GameBoyEmulatorPlaying(gameboyInstance)) {
                mbcRamRef.current = gameboyInstance.MBCRam;
                gameboyInstance.stopEmulator &= 1;
                console.log("Starting the iterator.");
                const dateObj = new Date();
                gameboyInstance.firstIteration = dateObj.getTime();
                gameboyInstance.iterations = 0;
                gameboyInstance.setSpeed(speed);
                inGameMemory.current = gameboyInstance.memory;
                gbcMemory.current = gameboyInstance.GBCMemory || [];
                // Sync memory refs to context for scanning access
                // GBCMemory contains WRAM bank 1+ (0xD000+) for GBC games
                setMemoryRefs(
                    gameboyInstance.memory,
                    gameboyInstance.GBCMemory || [],
                    gameboyInstance.MBCRam
                );
                setRom(gameboyInstance.ROM);
                runInterval.current = setInterval(function () {
                    if (!document.hidden) {
                        gameboyInstance.run();
                    }
                }, settings[6]);
            } else {
                console.log("The GameBoy core is already running.");
            }
        } else {
            console.log("GameBoy core cannot run while it has not been initialized.");
        }
    };

    const handleROMSelected = async (selectedROM: GameModel) => {
        if (selectedROM) {
            setActiveROM(selectedROM);
            currentGame.setGame(selectedROM);
            try {
                const response = await loadInGameFile(selectedROM.filePath, selectedROM.updatedAt);
                const blob = await response.blob();
                const reader = new FileReader();
                reader.onloadend = () => {
                    setROMImage(reader.result as string);
                    setIsRomLoaded(true);
                };
                reader.onerror = (error) => {
                    console.error("Failed to read ROM:", error);
                    setIsRomLoaded(false);
                };
                reader.readAsBinaryString(blob);
            } catch (error) {
                console.error("Failed to load ROM:", error);
                setIsRomLoaded(false);
            }
        } else {
            setROMImage(null);
            setIsRomLoaded(false);
        }
    };

    const handlePowerToggle = () => {
        if (gameBoyInstance.current && (isEmulatorPlaying || intervalPaused)) {
            console.log("Turning off the emulator...");
            if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '0';
            if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '0';
            if (runInterval.current) clearInterval(runInterval.current);
            setIsEmulatorPlaying(false);
            setIntervalPaused(false);
            setIsRomLoaded(true);
            setActiveState(null);
        } else {
            // Logic to initialize and start the emulator using the ROMImage from state
            if (ROMImage) {
                console.log("Starting GameBoyCore instance...");
                const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
                if (currentCanvas) {
                    if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '1';
                    if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '1';
                    gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas) as GameBoyCoreInstance;
                    if (gameBoyInstance.current) {
                        gameBoyInstance.current.start();
                        console.log("Calling run() function...");
                        run(gameBoyInstance.current);
                    }
                    setIsEmulatorPlaying(true);
                    // A new game isn't playing from any save
                    setCurrentSave(null);
                }
            } else {
                console.log("Game not selected. Cannot start.");
            }
        }
    };

    const keyDownHandler = (event: KeyboardEvent) => {
        if (gameBoyInstance.current && !intervalPaused) {
            keyDown(event, gameBoyInstance.current, uiSettings.keyMappings);
        }
    };

    const keyUpHandler = (event: KeyboardEvent) => {
        if (gameBoyInstance.current && !intervalPaused) {
            keyUp(event, gameBoyInstance.current, uiSettings.keyMappings);
        }
    };

    const handleReset = () => {
        if (ROMImage) {
            console.log("Resetting GameBoy with the same ROM...");
            if (runInterval.current) clearInterval(runInterval.current);
            setIsEmulatorPlaying(false);
            setIntervalPaused(false);
            const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
            if (currentCanvas) {
                if (activeState) {
                    gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, activeSaveArray) as GameBoyCoreInstance;
                } else {
                    gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas) as GameBoyCoreInstance;
                }
                if (gameBoyInstance.current) {
                    gameBoyInstance.current.start();
                    console.log("Calling run() function...");
                    run(gameBoyInstance.current);
                }
                setIsEmulatorPlaying(true);
            }
        }
    };

    const handlePauseResume = () => {
        if (GameBoyEmulatorInitialized(gameBoyInstance.current)) {
            if (GameBoyEmulatorPlaying(gameBoyInstance.current)) {
                console.log("Pausing...");
                clearLastEmulation(gameBoyInstance.current, runInterval);
                setIntervalPaused(true);
            } else {
                console.log("Resuming...");
                if (runInterval.current) {
                    clearInterval(runInterval.current);
                }
                run(gameBoyInstance.current);
                setIntervalPaused(false);
            }
        } else {
            console.log("GameBoy core cannot be paused/resumed while it has not been initialized.", 1);
        }
    };

    const toggleFullscreenMode = useCallback(() => {
        console.log('Starting toggle fullscreen...');
        console.log('Screen orientation:', window.innerWidth > window.innerHeight ? 'landscape' : 'portrait');

        if (window.innerWidth > window.innerHeight) {
            if (!isFullscreen) {
                console.log('Entering fullscreen mode...');
                if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "flex";
                if (gameBoyInstance.current && fullscreenCanvasRef.current) {
                    console.log('Switching to fullscreen canvas...');
                    gameBoyInstance.current.canvas = fullscreenCanvasRef.current;
                }
            } else {
                console.log('Exiting fullscreen mode...');
                if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "none";
                if (gameBoyInstance.current && mainCanvasRef.current) {
                    console.log('Switching to main canvas...');
                    gameBoyInstance.current.canvas = mainCanvasRef.current;
                }
            }
        } else {
            console.log('In portrait mode, using main canvas...');
            if (fullscreenContainerRef.current) fullscreenContainerRef.current.style.display = "none";
            if (gameBoyInstance.current && mainCanvasRef.current) {
                gameBoyInstance.current.canvas = mainCanvasRef.current;
            }
        }

        if (gameBoyInstance.current) {
            console.log('Initializing LCD...');
            gameBoyInstance.current.initLCD();
        }

        console.log('Setting fullscreen state to:', !isFullscreen);
        setIsFullscreen(!isFullscreen);
    }, [isFullscreen, gameBoyInstance]);

    /**
     * Returns the save's current file if it has changed since this session read it, so
     * nothing was saved. `expectedFilePath` saves over that file, once the player has chosen to.
     */
    const onSaveConfirmed = async (
        saveModalData: SaveStateModel,
        isUpdate = false,
        expectedFilePath?: string,
    ): Promise<{ currentFilePath: string } | void> => {
        if (!gameBoyInstance.current || !activeROM || !isEmulatorPlaying) return;

        // First, before the game moves on while the save uploads
        const screenshot = captureScreenshot(gameBoyInstance.current.canvas);

        try {
            const imgFile = (await screenshot) ?? undefined;
            // Only treat it as an update if we have an active state and isUpdate is true
            const saveData: SaveStateModel = isUpdate ? {
                ...saveModalData,
                id: activeState?.id,
                filePath: expectedFilePath ?? activeState?.filePath ?? '',
                img: activeState?.img,
                imgFile,
            } : { ...saveModalData, imgFile };

            const savedState = await saveThisState(saveData, isUpdate);
            console.log('Saved successfully.');
            showToast(
                isUpdate ? `Save updated: ${saveData.title}` : `Saved: ${saveData.title}`,
                'success'
            );

            if (savedState) {
                setActiveState(savedState);
                setCurrentSave(savedState);
                await refreshSaves();
                setActiveSaveArray(gameBoyInstance.current.saveSRAMState());
            } else {
                throw new Error('Save operation failed');
            }
        } catch (error) {
            if (error instanceof SaveConflictError) {
                // Load State should offer what's there now
                await refreshSaves();
                return { currentFilePath: error.currentFilePath };
            }
            console.error('Save failed:', error);
            const message = error instanceof Error ? error.message : 'Save operation failed';
            showToast(`Save failed: ${message}`, 'error');
        }
    };

    // Shared power/reset/save confirmation + Save State modal wiring, used by
    // the session bar and the mobile drawer.
    const {
        setActiveROMData,
        handleActionWithConfirmation,
        handlePowerToggleConfirm,
        handleResetConfirm,
        handleSaveState,
        handleSaveAs,
        confirmModalMessage,
        confirmModalProps,
        saveStateModalProps,
        saveConflictModalProps,
    } = useSystemActions({
        isRomLoaded,
        isEmulatorPlaying,
        intervalPaused,
        handlePowerToggle,
        handleReset,
        handlePauseResume,
        onSaveConfirmed,
    });

    const runFromSaveState = (sramArray: SRAMArray, selectedSaveState: SaveStateModel) => {
        console.log('Initiating state from load...');

        // A save can load over a running game, whose loop has to stop first
        if (runInterval.current) clearInterval(runInterval.current);
        const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;
        if (mainCanvasRef.current) mainCanvasRef.current.style.opacity = '1';
        if (fullscreenCanvasRef.current) fullscreenCanvasRef.current.style.opacity = '1';
        gameBoyInstance.current = new GameBoyCore(ROMImage, currentCanvas, sramArray) as GameBoyCoreInstance;
        if (gameBoyInstance.current) {
            gameBoyInstance.current.start();
            run(gameBoyInstance.current);
        }
        setIsEmulatorPlaying(true);
        setActiveState(selectedSaveState as SaveStateModel);
        setCurrentSave(selectedSaveState);
        setActiveSaveArray(sramArray);
    };

    /** Resolves to whether the save loaded, so the caller knows to close its modal */
    const loadSaveState = async (selectedSaveState: SaveStateModel) => {
        try {
            // filePath is a Vercel Blob permanent URL — fetch directly
            const response = await fetch(selectedSaveState.filePath, { cache: 'no-store' });
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            const saveDataObject = JSON.parse(await response.text());
            const sramArray = saveDataObject.MBCRam;
            if (!sramArray || !Array.isArray(sramArray)) {
                throw new Error('Invalid or corrupted MBCRam data in the save state.');
            }
            runFromSaveState(sramArray, selectedSaveState);
            setActiveROMData(selectedSaveState);
            return true;
        } catch (error) {
            console.error('Error loading save state:', error);
            return false;
        }
    };

    /** Loads a save, asking first if that would replace a running game */
    const requestLoadSaveState = (selectedSaveState: SaveStateModel, onLoaded: () => void) => {
        const load = async () => {
            if (await loadSaveState(selectedSaveState)) onLoaded();
        };
        if (isEmulatorPlaying) {
            handleActionWithConfirmation(load, `Load "${selectedSaveState.title}"? Any unsaved progress in the current game will be lost.`);
        } else {
            load();
        }
    };

    const onDeleteSaveState = async () => {
        console.log('Deleting save state...');
        await refreshSaves();
    };

    // Arriving with a game chosen elsewhere loads its cartridge, ready to start
    const sharedGame = currentGame.game;
    useEffect(() => {
        if (sharedGame && sharedGame.id !== activeROM?.id && !isEmulatorPlaying) {
            handleROMSelected(sharedGame);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sharedGame?.id]);

    // Register GUI events on load
    useEffect(() => {
        registerGUIEvents();
        window.addEventListener('keydown', keyDownHandler);
        window.addEventListener('keyup', keyUpHandler);
        return () => {
            window.removeEventListener('keydown', keyDownHandler);
            window.removeEventListener('keyup', keyUpHandler);
        };
    },
        // eslint-disable-next-line
        [intervalPaused, uiSettings.keyMappings]
    );

    // Initialize gameBoyInstance with the first ROMImage on component mount
    useEffect(() => {
        if (ROMImage) {
            try {
                console.log("Clearing previous emulation...");
                clearLastEmulation(gameBoyInstance.current, runInterval);

                console.log("Creating new GameBoyCore instance...");
                const currentCanvas = isFullscreen ? fullscreenCanvasRef.current : mainCanvasRef.current;

                if (currentCanvas) {
                    const instance = new GameBoyCore(ROMImage, currentCanvas) as GameBoyCoreInstance;
                    // Apply initial settings
                    settings[0] = isSoundOn;
                    if (instance) {
                        instance.setSpeed(speed);
                        gameBoyInstance.current = instance;
                        console.log("GameBoyCore instance created. Waiting for start command.");
                    } else {
                        console.error("Failed to create GameBoyCore instance.");
                    }
                }
            } catch (error) {
                console.error("Error during GameBoy instance initialization:", error);
            }
        }
        // Clear the interval when the component unmounts
        return () => {
            if (runInterval.current) {
                console.log("Clearing interval during cleanup");
                clearInterval(runInterval.current);
            }
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ROMImage, isRomLoaded]); // Explicitly ignore other dependencies

    // Add separate effect for handling settings changes
    useEffect(() => {
        if (gameBoyInstance.current && isEmulatorPlaying) {
            // Update speed
            gameBoyInstance.current.setSpeed(speed);

            // Update interval if running
            if (runInterval.current) {
                clearInterval(runInterval.current);
                runInterval.current = setInterval(() => {
                    if (!document.hidden && gameBoyInstance.current) {
                        gameBoyInstance.current.run();
                    }
                }, settings[6]);
            }

            // Update sound
            if (settings[0] !== isSoundOn) {
                settings[0] = isSoundOn;
                // Must run even with no audio handle yet: a game started muted has none,
                // and the core reads it on every run once sound is on
                gameBoyInstance.current.initSound();
            }
        }
    }, [speed, isSoundOn, isEmulatorPlaying]);

    // Maintain emulator-on awareness
    useEffect(() => {
        const isEmulatorOn = !!(gameBoyInstance.current && (isEmulatorPlaying || intervalPaused));
        setIsEmulatorOn(isEmulatorOn);
    },
        [isEmulatorPlaying, intervalPaused] // Dependencies: Update when gameBoyInstance or intervalPaused changes
    );

    // Keep canvases clear when emulator off
    useEffect(() => {
        if (!isEmulatorOn) {
            if (mainCanvasRef.current) {
                const context = mainCanvasRef.current.getContext('2d');
                if (context) {
                    context.clearRect(0, 0, mainCanvasRef.current.width, mainCanvasRef.current.height); // Clear the canvas
                }
                mainCanvasRef.current.style.visibility = 'hidden';
            }

            if (fullscreenCanvasRef.current) {
                const fsContext = fullscreenCanvasRef.current.getContext('2d');
                if (fsContext) {
                    fsContext.clearRect(0, 0, fullscreenCanvasRef.current.width, fullscreenCanvasRef.current.height);
                    fullscreenCanvasRef.current.style.visibility = 'hidden';
                }
            }
        }
    },
        [isEmulatorOn] // Removed the refs from the dependency array
    );

    // Listen for window resize to exit fullscreen mode
    useEffect(() => {
        const checkOrientationAndFullscreen = () => {
            if (window.innerWidth <= window.innerHeight && isFullscreen) {
                console.log('conditions met');
                toggleFullscreenMode(); // This will turn off fullscreen if the orientation isn't correct
            }
        };
        window.addEventListener('resize', checkOrientationAndFullscreen);

        return () => {
            window.removeEventListener('resize', checkOrientationAndFullscreen);
        };
    },
        [isFullscreen, toggleFullscreenMode]
    );

    // Listen for update to MBCRam
    useEffect(() => {
        if (gameBoyInstance.current && isEmulatorPlaying) {
            mbcRamRef.current = gameBoyInstance.current.MBCRam;
        }
    },
        [isEmulatorPlaying]
    );

    // Watch for background changes in settings
    useEffect(() => {
        setFullscreenBackground(uiSettings.background);
    }, [uiSettings.background, activeROM]);

    // DEBUG: Memory dump on Ctrl+Shift+M
    useEffect(() => {
        const handleDebugKey = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                if (inGameMemory.current && inGameMemory.current.length > 0) {
                    console.log('=== IN-GAME MEMORY DUMP ===');
                    console.log('Total length:', inGameMemory.current.length);
                    console.log('Full memory array:', inGameMemory.current);

                    // Log some common Pokemon memory regions (Gen 1)
                    // Player name: 0xD158
                    // Party Pokemon: 0xD163
                    // Current box Pokemon: 0xDA80
                    // Pokedex owned: 0xD2F7
                    // Pokedex seen: 0xD30A
                    console.log('--- Common Pokemon Memory Regions (Gen 1) ---');
                    console.log('0xD158 (Player name region):', inGameMemory.current.slice(0xD158, 0xD158 + 11));
                    console.log('0xD163 (Party count + species):', inGameMemory.current.slice(0xD163, 0xD163 + 50));
                    console.log('0xD2F7 (Pokedex owned):', inGameMemory.current.slice(0xD2F7, 0xD2F7 + 19));
                    console.log('0xD30A (Pokedex seen):', inGameMemory.current.slice(0xD30A, 0xD30A + 19));

                    // Also expose to window for easy inspection
                    (window as unknown as { __gbMemory: number[] }).__gbMemory = [...inGameMemory.current];
                    console.log('Memory also available at window.__gbMemory');
                } else {
                    console.log('No in-game memory available. Is a game running?');
                }

                if (mbcRamRef.current && mbcRamRef.current.length > 0) {
                    console.log('=== MBC RAM (SRAM) DUMP ===');
                    console.log('Total length:', mbcRamRef.current.length);
                    console.log('Full SRAM array:', mbcRamRef.current);
                    (window as unknown as { __gbSRAM: number[] }).__gbSRAM = [...mbcRamRef.current];
                    console.log('SRAM also available at window.__gbSRAM');
                }
            }
        };

        window.addEventListener('keydown', handleDebugKey);
        return () => window.removeEventListener('keydown', handleDebugKey);
    }, []);

    return {
        // Canvases and memory
        mainCanvasRef,
        fullscreenCanvasRef,
        fullscreenContainerRef,
        inGameMemory,
        gbcMemory,

        // Game and saves
        activeROM,
        activeState,
        userSaveStates,
        isRomLoaded,
        isSaving,
        handleROMSelected,
        requestLoadSaveState,
        onDeleteSaveState,

        // Running state
        isEmulatorOn,
        isEmulatorPlaying,
        intervalPaused,
        handlePauseResume,

        // Display
        fullscreenBackground,
        isImmersive: isFullscreen,
        isBrowserFullscreen,
        toggleFullscreenMode,
        toggleBrowserFullscreen,

        // Actions behind the shared confirm and save modals
        handleActionWithConfirmation,
        handlePowerToggleConfirm,
        handleResetConfirm,
        handleSaveState,
        handleSaveAs,
        confirmModalMessage,
        confirmModalProps,
        saveStateModalProps,
        saveConflictModalProps,
    };
}
