/**
 * TypeScript declaration file for GameBoyCore.js
 * This provides type information for the JavaScript GameBoyCore class
 */

import { IGameBoyCore, ROMImage, CanvasElement } from '../types/gameboy';

declare class GameBoyCore implements IGameBoyCore {
  // Constructor
  constructor(ROMImage: ROMImage | null, canvas: CanvasElement, saveStateArray?: number[]);

  // Core properties
  canvas: CanvasElement;
  drawContext: CanvasRenderingContext2D | null;
  ROMImage: ROMImage;
  saveStateArray: number[];

  // CPU Registers and Flags
  registerA: number;
  FZero: boolean;
  FSubtract: boolean;
  FHalfCarry: boolean;
  FCarry: boolean;
  registerB: number;
  registerC: number;
  registerD: number;
  registerE: number;
  registersHL: number;
  stackPointer: number;
  programCounter: number;

  // CPU Emulation State
  CPUCyclesTotal: number;
  CPUCyclesTotalBase: number;
  CPUCyclesTotalCurrent: number;
  CPUCyclesTotalRoundoff: number;
  baseCPUCyclesPerIteration: number;
  remainingClocks: number;
  inBootstrap: boolean;
  usedBootROM: boolean;
  usedGBCBootROM: boolean;
  halt: boolean;
  skipPCIncrement: boolean;
  stopEmulator: number;
  IME: boolean;
  IRQLineMatched: number;
  interruptsRequested: number;
  interruptsEnabled: number;
  hdmaRunning: boolean;
  CPUTicks: number;
  doubleSpeedShifter: number;
  JoyPad: number;
  CPUStopped: boolean;
  firstIteration: number;
  iterations: number;

  // Memory arrays
  memoryReader: Array<(parentObj: GameBoyCore, address: number) => number>;
  memoryWriter: Array<(parentObj: GameBoyCore, address: number, value: number) => void>;
  memoryHighReader: Array<(parentObj: GameBoyCore, address: number) => number>;
  memoryHighWriter: Array<(parentObj: GameBoyCore, address: number, value: number) => void>;
  ROM: number[];
  memory: number[];
  MBCRam: number[];
  VRAM: number[];
  GBCMemory: number[];

  // MBC (Memory Bank Controller) properties
  MBC1Mode: boolean;
  MBCRAMBanksEnabled: boolean;
  currMBCRAMBank: number;
  currMBCRAMBankPosition: number;
  currROMBank: number;
  currentROMBank: number;
  numRAMBanks: number;
  numROMBanks: number;
  ROMBank1offs: number;
  RAMBanks: number[];

  // Cartridge properties
  cartridgeType: number;
  name: string;
  gameCode: string;
  cGBC: boolean;
  cSGB: boolean;
  cBATT: boolean;
  cTIMER: boolean;
  cRUMBLE: boolean;
  cMBC1: boolean;
  cMBC2: boolean;
  cMBC3: boolean;
  cMBC5: boolean;
  cMBC7: boolean;
  cSRAM: boolean;
  cMMMO1: boolean;
  cCamera: boolean;
  fromSaveState: boolean;
  savedStateFileName: string;

  // Display properties
  onscreenWidth: number;
  onscreenHeight: number;
  offscreenWidth: number;
  offscreenHeight: number;
  offscreenRGBCount: number;
  swizzledFrame: Uint8Array | null;

  // Audio properties
  soundMasterEnabled: boolean;
  audioHandle: any;
  audioDestinationPosition: number;
  numSamplesTotal: number;
  audioIndex: number;
  audioResamplerFirstPassFactor: number;
  sequencerClocks: number;
  audioClocksUntilNextEventCounter: number;

  // RTC (Real Time Clock) properties
  RTCisLatched: boolean;
  latchedSeconds: number;
  latchedMinutes: number;
  latchedHours: number;
  latchedLDays: number;
  latchedHDays: number;
  RTCSeconds: number;
  RTCMinutes: number;
  RTCHours: number;
  RTCDays: number;
  RTCDayOverFlow: boolean;
  RTCHALT: boolean;
  RTCData: number[];

  // Public methods
  saveSRAMState(): number[];
  saveRTCState(): number[];
  saveState(): number[];
  returnFromState(returnedFrom: number): void;
  returnFromRTCState(): void;
  start(): void;
  initMemory(): void;
  generateCacheArray(tileAmount: number): void;
  initSkipBootstrap(): void;
  initBootstrap(): void;
  ROMLoad(): void;
  getROMImage(): number[];
  interpretCartridge(): void;
  disableBootROM(): void;
  initializeTiming(): void;
  setSpeed(speed: number): void;
  setupRAM(): void;
  MBCRAMUtilized(): boolean;
  recomputeDimension(): void;
  initLCD(): void;
  graphicsBlit(): void;
  JoyPadEvent(key: number, down: boolean): void;
  GyroEvent(x: number, y: number): void;
  initSound(): void;
  changeVolume(): void;
  initAudioBuffer(): void;
  intializeWhiteNoise(): void;
  audioUnderrunAdjustment(): void;
  initializeAudioStartState(): void;
  outputAudio(): void;
  generateAudio(numSamples: number): void;
  generateAudioFake(numSamples: number): void;

  // Internal methods
  run(): void;
  getTypedArray(length: number, value: number, type: string): Uint8Array | number[];

  // Static properties (instruction tables)
  static InstructionTable: Array<(parentObj: GameBoyCore) => void>;
  static SecondaryInstructionTable: Array<(parentObj: GameBoyCore) => void>;
  static TICKTable: number[];
  static SecondaryTICKTable: number[];
}

export default GameBoyCore;
