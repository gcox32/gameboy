/**
 * TypeScript interface definitions for GameBoyCore
 * This provides type safety for the GameBoy emulator throughout the application
 */

// Canvas and DOM types
export type CanvasElement = HTMLCanvasElement | null;
export type CanvasContext = CanvasRenderingContext2D | null;

// Memory and array types
export type MemoryArray = Uint8Array | number[];
export type ROMImage = string | Uint8Array | number[];

// Cartridge and memory bank types
export type CartridgeType = 
  | 0x00  // ROM ONLY
  | 0x01  // MBC1
  | 0x02  // MBC1+RAM
  | 0x03  // MBC1+RAM+BATTERY
  | 0x05  // MBC2
  | 0x06  // MBC2+BATTERY
  | 0x08  // ROM+RAM
  | 0x09  // ROM+RAM+BATTERY
  | 0x0B  // MMM01
  | 0x0C  // MMM01+RAM
  | 0x0D  // MMM01+RAM+BATTERY
  | 0x0F  // MBC3+TIMER+BATTERY
  | 0x10  // MBC3+TIMER+RAM+BATTERY
  | 0x11  // MBC3
  | 0x12  // MBC3+RAM
  | 0x13  // MBC3+RAM+BATTERY
  | 0x19  // MBC5
  | 0x1A  // MBC5+RAM
  | 0x1B  // MBC5+RAM+BATTERY
  | 0x1C  // MBC5+RUMBLE
  | 0x1D  // MBC5+RUMBLE+RAM
  | 0x1E  // MBC5+RUMBLE+RAM+BATTERY
  | 0x20  // MBC6
  | 0x22  // MBC7+SENSOR+RUMBLE+RAM+BATTERY
  | 0xFC  // POCKET CAMERA
  | 0xFD  // BANDAI TAMA5
  | 0xFE  // HuC3
  | 0xFF; // HuC1+RAM+BATTERY

export type RAMBankSize = 0 | 2 | 8 | 32 | 128 | 64;

// Joypad button types
export type JoypadButton = 
  | 0  // Right
  | 1  // Left
  | 2  // Up
  | 3  // Down
  | 4  // A
  | 5  // B
  | 6  // Select
  | 7; // Start

// CPU flag types
export interface CPUFlags {
  FZero: boolean;
  FSubtract: boolean;
  FHalfCarry: boolean;
  FCarry: boolean;
}

// CPU registers
export interface CPURegisters {
  registerA: number;
  registerB: number;
  registerC: number;
  registerD: number;
  registerE: number;
  registersHL: number;
  stackPointer: number;
  programCounter: number;
}

// Memory bank controller types
export interface MBCState {
  MBC1Mode: boolean;
  MBCRAMBanksEnabled: boolean;
  currMBCRAMBank: number;
  currROMBank: number;
  numRAMBanks: number;
  numROMBanks: number;
}

// Audio and sound types
export interface AudioState {
  soundMasterEnabled: boolean;
  audioHandle: any;
  audioDestinationPosition: number;
  numSamplesTotal: number;
  audioIndex: number;
  audioResamplerFirstPassFactor: number;
  sequencerClocks: number;
  audioClocksUntilNextEventCounter: number;
}

// Graphics and display types
export interface DisplayState {
  onscreenWidth: number;
  onscreenHeight: number;
  offscreenWidth: number;
  offscreenHeight: number;
  offscreenRGBCount: number;
  swizzledFrame: Uint8Array | null;
  drawContext: CanvasContext;
}

// Save state types
export interface SaveStateData {
  saveStateArray: number[];
  MBCRam: number[];
  RTCData: number[];
  RTCHALT: number;
}

// Main GameBoyCore interface
export interface IGameBoyCore {
  // Core properties
  canvas: CanvasElement;
  drawContext: CanvasContext;
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
  memoryReader: Array<(parentObj: IGameBoyCore, address: number) => number>;
  memoryWriter: Array<(parentObj: IGameBoyCore, address: number, value: number) => void>;
  memoryHighReader: Array<(parentObj: IGameBoyCore, address: number) => number>;
  memoryHighWriter: Array<(parentObj: IGameBoyCore, address: number, value: number) => void>;
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
  cartridgeType: CartridgeType;
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
  JoyPadEvent(key: JoypadButton, down: boolean): void;
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

  // Internal methods (for advanced usage)
  run(): void;
  getTypedArray(length: number, value: number, type: string): MemoryArray;
}

// Constructor type
export type GameBoyCoreConstructor = new (
  ROMImage: ROMImage,
  canvas: CanvasElement,
  saveStateArray?: number[]
) => IGameBoyCore;

// Factory function type
export type GameBoyCoreFactory = (
  ROMImage: ROMImage,
  canvas: CanvasElement,
  saveStateArray?: number[]
) => IGameBoyCore;

// Settings type for emulator configuration
export interface EmulatorSettings {
  soundEnabled: boolean;
  speed: number;
  mobileZoom: number;
  [key: string]: any;
}

// Event handler types
export type JoypadEventHandler = (key: JoypadButton, down: boolean) => void;
export type GyroEventHandler = (x: number, y: number) => void;
export type AudioEventHandler = (numSamples: number) => void;

// Utility types for working with GameBoyCore
export type GameBoyCoreRef = React.RefObject<IGameBoyCore>;
export type GameBoyCoreInstance = IGameBoyCore | null;

// Memory access function types
export type MemoryReader = (parentObj: IGameBoyCore, address: number) => number;
export type MemoryWriter = (parentObj: IGameBoyCore, address: number, value: number) => void;
export type MemoryHighReader = (parentObj: IGameBoyCore, address: number) => number;
export type MemoryHighWriter = (parentObj: IGameBoyCore, address: number, value: number) => void;
