// In-game memory typing (WRAM/IO/HRAM view) focusing on regions we watch live

export type HexString = `0x${string}`;

// Generic watcher config for a memory region inside the inGameMemory buffer
export interface InGameMemoryRegion {
  baseAddress: HexString; // e.g. '0xD000' or '0x0000' depending on how buffer is laid out
  offset: HexString;      // region offset from base
  size: HexString;        // byte length
  description?: string;
}

// Pokédex: two contiguous bitfields (owned then seen), 19 bytes each
export interface PokedexRegion extends InGameMemoryRegion {
  ownedLengthBytes: number; // 19
  seenLengthBytes: number;  // 19
}

// Gym badges: single byte bitfield, bits 0..7 map to 8 badges
export interface BadgesRegion extends InGameMemoryRegion {}

// Active Party block (varies by game); large contiguous structure we parse
export interface ActivePartyRegion extends InGameMemoryRegion {}

// High-level map of Regions we care about for live UI updates
export interface InGameMemoryMap {
  pokedex?: PokedexRegion;
  badges?: BadgesRegion;
  activeParty?: ActivePartyRegion;
  // Add more regions as we support them (money, options, names, etc.)
}

// Utility helpers to work with hex strings consistently
export function toHex(value: number): HexString {
  return (`0x${value.toString(16).toUpperCase()}`) as HexString;
}

export function fromHex(hex: HexString): number {
  return parseInt(hex, 16);
}

export function addHex(a: HexString, b: HexString): HexString {
  return toHex(fromHex(a) + fromHex(b));
}

// Derive start/end indices for slicing a plain number[] buffer given a region
export function regionSliceIndices(region: InGameMemoryRegion): { start: number; end: number } {
  const start = fromHex(region.baseAddress) + fromHex(region.offset);
  const end = start + fromHex(region.size);
  return { start, end };
}

// Known defaults for Gen 1 (may vary by ROM build). These are best-effort and
// should be discovered dynamically at runtime when possible.
export const Gen1Defaults: InGameMemoryMap = {
  // Example: Gym badges often around 0xD2xx; exact address is ROM-dependent
  badges: {
    baseAddress: '0xD000',
    offset: '0x2F6', // example; read dynamically in app where possible
    size: '0x01',
    description: 'Gym badges bitfield (LSB Boulder .. MSB Earth)'
  },
  // Example: Active party region varies; app parses based on discovered offset
  activeParty: {
    baseAddress: '0xD000',
    offset: '0x163',
    size: '0x195',
    description: 'Active party structure (species/moves/stats)'
  },
  // Pokedex defaults are intentionally omitted since we dynamically detect.
};


