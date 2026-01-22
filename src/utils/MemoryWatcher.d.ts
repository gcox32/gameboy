import { SRAMArray } from '@/types';

export function useMBCRamWatcher(
    mbcRamRef: { current: SRAMArray },
    offsetHex: string,
    sizeHex: string,
    onChange: (data: number[]) => void,
    interval?: number
): void;

export function translateInteger(integerValue: number): string;

export function translateIntegerArray(integerArray: number[], breakInt?: number): string;

export function useInGameMemoryWatcher(
    gameMemoryRef: SRAMArray | number[],
    baseAddressHex: string | undefined,
    offsetHex: string | undefined,
    sizeHex: string | undefined,
    onChange: (data: number[]) => void,
    interval?: number,
    gbcMemoryRef?: SRAMArray | number[] | { current: SRAMArray | number[] } | null
): void;

export function parseMetadata<T = Record<string, unknown>>(
    activeROM: { metadata?: string | Record<string, unknown> } | null,
    key: string,
    defaultConfig?: T
): T;
