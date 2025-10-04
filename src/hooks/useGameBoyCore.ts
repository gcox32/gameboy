/**
 * Custom hook for typed GameBoyCore operations
 * Provides type-safe access to GameBoyCore functionality
 */

import { useRef, useCallback, RefObject } from 'react';
import { IGameBoyCore, GameBoyCoreInstance, JoypadButton, ROMImage, CanvasElement } from '@/types/gameboy';

export interface UseGameBoyCoreReturn {
  gameBoyRef: RefObject<GameBoyCoreInstance>;
  isInitialized: boolean;
  isPlaying: boolean;
  createInstance: (ROMImage: ROMImage, canvas: CanvasElement, saveStateArray?: number[]) => IGameBoyCore | null;
  start: () => void;
  pause: () => void;
  stop: () => void;
  setSpeed: (speed: number) => void;
  changeVolume: () => void;
  joypadEvent: (key: JoypadButton, down: boolean) => void;
  gyroEvent: (x: number, y: number) => void;
  saveState: () => number[] | null;
  loadState: (stateArray: number[]) => void;
  saveSRAMState: () => number[] | null;
  saveRTCState: () => number[] | null;
  getROMImage: () => number[] | null;
  getCanvas: () => CanvasElement;
  getDisplayDimensions: () => { width: number; height: number } | null;
  getCPURegisters: () => {
    registerA: number;
    registerB: number;
    registerC: number;
    registerD: number;
    registerE: number;
    registersHL: number;
    stackPointer: number;
    programCounter: number;
  } | null;
  getCPUFlags: () => {
    FZero: boolean;
    FSubtract: boolean;
    FHalfCarry: boolean;
    FCarry: boolean;
  } | null;
}

export function useGameBoyCore(): UseGameBoyCoreReturn {
  const gameBoyRef = useRef<GameBoyCoreInstance>(null);

  const isInitialized = gameBoyRef.current !== null;

  const isPlaying = isInitialized && (gameBoyRef.current?.stopEmulator ?? 3) === 0;

  const createInstance = useCallback((
    ROMImage: ROMImage,
    canvas: CanvasElement,
    saveStateArray: number[] = []
  ): IGameBoyCore | null => {
    if (!canvas) return null;
    
    try {
      // Dynamic import to avoid issues with the JS file
      const GameBoyCore = require('@/utils/GameBoyCore').default;
      const instance = new GameBoyCore(ROMImage, canvas, saveStateArray);
      gameBoyRef.current = instance;
      return instance;
    } catch (error) {
      console.error('Failed to create GameBoyCore instance:', error);
      return null;
    }
  }, []);

  const start = useCallback(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.start();
    }
  }, []);

  const pause = useCallback(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.stopEmulator |= 2;
    }
  }, []);

  const stop = useCallback(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.stopEmulator |= 3;
    }
  }, []);

  const setSpeed = useCallback((speed: number) => {
    if (gameBoyRef.current) {
      gameBoyRef.current.setSpeed(speed);
    }
  }, []);

  const changeVolume = useCallback(() => {
    if (gameBoyRef.current) {
      gameBoyRef.current.changeVolume();
    }
  }, []);

  const joypadEvent = useCallback((key: JoypadButton, down: boolean) => {
    if (gameBoyRef.current) {
      gameBoyRef.current.JoyPadEvent(key, down);
    }
  }, []);

  const gyroEvent = useCallback((x: number, y: number) => {
    if (gameBoyRef.current) {
      gameBoyRef.current.GyroEvent(x, y);
    }
  }, []);

  const saveState = useCallback((): number[] | null => {
    if (gameBoyRef.current) {
      return gameBoyRef.current.saveState();
    }
    return null;
  }, []);

  const loadState = useCallback((stateArray: number[]) => {
    if (gameBoyRef.current) {
      gameBoyRef.current.returnFromState(0); // Assuming 0 is the default return value
    }
  }, []);

  const saveSRAMState = useCallback((): number[] | null => {
    if (gameBoyRef.current) {
      return gameBoyRef.current.saveSRAMState();
    }
    return null;
  }, []);

  const saveRTCState = useCallback((): number[] | null => {
    if (gameBoyRef.current) {
      return gameBoyRef.current.saveRTCState();
    }
    return null;
  }, []);

  const getROMImage = useCallback((): number[] | null => {
    if (gameBoyRef.current) {
      return gameBoyRef.current.getROMImage();
    }
    return null;
  }, []);

  const getCanvas = useCallback((): CanvasElement => {
    return gameBoyRef.current?.canvas ?? null;
  }, []);

  const getDisplayDimensions = useCallback(() => {
    if (gameBoyRef.current) {
      return {
        width: gameBoyRef.current.onscreenWidth,
        height: gameBoyRef.current.onscreenHeight
      };
    }
    return null;
  }, []);

  const getCPURegisters = useCallback(() => {
    if (gameBoyRef.current) {
      return {
        registerA: gameBoyRef.current.registerA,
        registerB: gameBoyRef.current.registerB,
        registerC: gameBoyRef.current.registerC,
        registerD: gameBoyRef.current.registerD,
        registerE: gameBoyRef.current.registerE,
        registersHL: gameBoyRef.current.registersHL,
        stackPointer: gameBoyRef.current.stackPointer,
        programCounter: gameBoyRef.current.programCounter
      };
    }
    return null;
  }, []);

  const getCPUFlags = useCallback(() => {
    if (gameBoyRef.current) {
      return {
        FZero: gameBoyRef.current.FZero,
        FSubtract: gameBoyRef.current.FSubtract,
        FHalfCarry: gameBoyRef.current.FHalfCarry,
        FCarry: gameBoyRef.current.FCarry
      };
    }
    return null;
  }, []);

  return {
    gameBoyRef,
    isInitialized,
    isPlaying,
    createInstance,
    start,
    pause,
    stop,
    setSpeed,
    changeVolume,
    joypadEvent,
    gyroEvent,
    saveState,
    loadState,
    saveSRAMState,
    saveRTCState,
    getROMImage,
    getCanvas,
    getDisplayDimensions,
    getCPURegisters,
    getCPUFlags
  };
}
