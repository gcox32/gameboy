/**
 * React hook for working with SRAM data
 * Provides typed access to Pokémon save data with state management
 */

import { useState, useCallback, useMemo } from 'react';
import {
  SRAMArray,
  SRAMData,
  PokemonPartyData,
  PokemonBoxData,
  MainData,
  PokedexData,
  Money,
  GameOptions,
  Badges,
  PlayTime,
  NameString
} from '@/types/sram';
import {
  parseSRAM,
  parsePokemonParty,
  parsePokemonBox,
  parseMainData,
  decodeNameString,
  encodeNameString,
  TextEncoder,
  BCDConverter,
  BitUtils
} from '@/utils/sramParser';

export interface UseSRAMDataReturn {
  // Raw data
  sramData: SRAMData | null;
  rawData: SRAMArray | null;
  
  // Parsed data
  playerName: string;
  rivalName: string;
  party: PokemonPartyData | null;
  currentBox: PokemonBoxData | null;
  boxes: PokemonBoxData[];
  mainData: MainData | null;
  pokedex: PokedexData | null;
  money: Money | null;
  gameOptions: GameOptions | null;
  badges: Badges | null;
  playTime: PlayTime | null;
  
  // State
  isLoading: boolean;
  isValid: boolean;
  error: string | null;
  
  // Actions
  loadSRAM: (data: SRAMArray) => void;
  updatePlayerName: (name: string) => void;
  updateRivalName: (name: string) => void;
  updateMoney: (amount: number) => void;
  updateGameOptions: (options: Partial<GameOptions>) => void;
  updateBadges: (badges: Partial<Badges>) => void;
  updatePlayTime: (time: Partial<PlayTime>) => void;
  getPokemonFromParty: (index: number) => any;
  getPokemonFromBox: (boxIndex: number, pokemonIndex: number) => any;
  isPokemonOwned: (speciesId: number) => boolean;
  isPokemonSeen: (speciesId: number) => boolean;
  setPokemonOwned: (speciesId: number, owned: boolean) => void;
  setPokemonSeen: (speciesId: number, seen: boolean) => void;
  exportSRAM: () => SRAMArray | null;
  reset: () => void;
}

export function useSRAMData(): UseSRAMDataReturn {
  const [sramData, setSramData] = useState<SRAMData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load SRAM data
  const loadSRAM = useCallback((data: SRAMArray) => {
    if (data.length !== 0x8000) {
      setError('Invalid SRAM data: must be exactly 32KB (0x8000 bytes)');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const parsed = parseSRAM(data);
      setSramData(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse SRAM data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Computed values
  const rawData = useMemo(() => sramData?.raw || null, [sramData]);
  
  const playerName = useMemo(() => {
    if (!sramData?.bank1.playerName) return '';
    return decodeNameString(sramData.bank1.playerName);
  }, [sramData]);

  const rivalName = useMemo(() => {
    if (!sramData?.bank1.mainData.rivalName) return '';
    return decodeNameString(sramData.bank1.mainData.rivalName);
  }, [sramData]);

  const party = useMemo(() => sramData?.bank1.partyData || null, [sramData]);
  
  const currentBox = useMemo(() => sramData?.bank1.currentBoxData || null, [sramData]);
  
  const boxes = useMemo(() => {
    if (!sramData) return [];
    return [sramData.bank2, sramData.bank3];
  }, [sramData]);

  const mainData = useMemo(() => sramData?.bank1.mainData || null, [sramData]);
  
  const pokedex = useMemo(() => {
    if (!mainData) return null;
    return {
      owned: mainData.pokedexOwned,
      seen: mainData.pokedexSeen
    };
  }, [mainData]);

  const money = useMemo(() => mainData?.money || null, [mainData]);
  
  const gameOptions = useMemo(() => mainData?.gameOptions || null, [mainData]);
  
  const badges = useMemo(() => mainData?.badges || null, [mainData]);
  
  const playTime = useMemo(() => mainData?.playTime || null, [mainData]);

  const isValid = useMemo(() => sramData?.isValid || false, [sramData]);

  // Update functions
  const updatePlayerName = useCallback((name: string) => {
    if (!sramData) return;
    
    const encoded = encodeNameString(name);
    const newData = [...sramData.raw];
    
    // Update in raw data
    for (let i = 0; i < encoded.length; i++) {
      newData[0x2598 + i] = encoded[i];
    }
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.playerName = encoded;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const updateRivalName = useCallback((name: string) => {
    if (!sramData) return;
    
    const encoded = encodeNameString(name);
    const newData = [...sramData.raw];
    
    // Update in raw data
    for (let i = 0; i < encoded.length; i++) {
      newData[0x25F6 + i] = encoded[i];
    }
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.rivalName = encoded;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const updateMoney = useCallback((amount: number) => {
    if (!sramData || amount < 0 || amount > 999999) return;
    
    const encoded = BCDConverter.toBCD(amount, 3);
    const newData = [...sramData.raw];
    
    // Update in raw data
    for (let i = 0; i < encoded.length; i++) {
      newData[0x25F3 + i] = encoded[i];
    }
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.money.amount = amount;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const updateGameOptions = useCallback((options: Partial<GameOptions>) => {
    if (!sramData) return;
    
    const currentOptions = sramData.bank1.mainData.gameOptions;
    const newOptions = { ...currentOptions, ...options };
    
    let newByte = 0;
    if (!newOptions.battleEffects) newByte |= 0x80;
    if (newOptions.battleStyle) newByte |= 0x40;
    if (newOptions.sound) newByte |= 0x10;
    newByte |= newOptions.textSpeed & 0x07;
    
    const newData = [...sramData.raw];
    newData[0x2601] = newByte;
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.gameOptions = newOptions;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const updateBadges = useCallback((badges: Partial<Badges>) => {
    if (!sramData) return;
    
    const currentBadges = sramData.bank1.mainData.badges;
    const newBadges = { ...currentBadges, ...badges };
    
    let newByte = 0;
    if (newBadges.boulder) newByte |= 0x80;
    if (newBadges.cascade) newByte |= 0x40;
    if (newBadges.thunder) newByte |= 0x20;
    if (newBadges.rainbow) newByte |= 0x10;
    if (newBadges.soul) newByte |= 0x08;
    if (newBadges.marsh) newByte |= 0x04;
    if (newBadges.volcano) newByte |= 0x02;
    if (newBadges.earth) newByte |= 0x01;
    
    const newData = [...sramData.raw];
    newData[0x2602] = newByte;
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.badges = newBadges;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const updatePlayTime = useCallback((time: Partial<PlayTime>) => {
    if (!sramData) return;
    
    const currentTime = sramData.bank1.mainData.playTime;
    const newTime = { ...currentTime, ...time };
    
    const newData = [...sramData.raw];
    newData[0x2CED] = newTime.hours;
    newData[0x2CEE] = newTime.minutes;
    newData[0x2CEF] = newTime.seconds;
    newData[0x2CF0] = newTime.frames;
    if (newTime.maxed !== undefined) {
      newData[0x2CEE] = newTime.maxed;
    }
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.playTime = newTime;
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  // Pokémon access functions
  const getPokemonFromParty = useCallback((index: number) => {
    if (!party || index < 0 || index >= 6) return null;
    return party.pokemon[index];
  }, [party]);

  const getPokemonFromBox = useCallback((boxIndex: number, pokemonIndex: number) => {
    if (!boxes || boxIndex < 0 || boxIndex >= boxes.length) return null;
    const box = boxes[boxIndex];
    if (!box || pokemonIndex < 0 || pokemonIndex >= 20) return null;
    return box.pokemon[pokemonIndex];
  }, [boxes]);

  // Pokédex functions
  const isPokemonOwned = useCallback((speciesId: number) => {
    if (!pokedex || speciesId < 0 || speciesId >= 152) return false;
    const byteIndex = Math.floor(speciesId / 8);
    const bitIndex = speciesId % 8;
    return BitUtils.getBit(pokedex.owned[byteIndex], bitIndex);
  }, [pokedex]);

  const isPokemonSeen = useCallback((speciesId: number) => {
    if (!pokedex || speciesId < 0 || speciesId >= 152) return false;
    const byteIndex = Math.floor(speciesId / 8);
    const bitIndex = speciesId % 8;
    return BitUtils.getBit(pokedex.seen[byteIndex], bitIndex);
  }, [pokedex]);

  const setPokemonOwned = useCallback((speciesId: number, owned: boolean) => {
    if (!sramData || speciesId < 0 || speciesId >= 152) return;
    
    const newData = [...sramData.raw];
    const byteIndex = Math.floor(speciesId / 8);
    const bitIndex = speciesId % 8;
    const currentByte = newData[0x25A3 + byteIndex];
    newData[0x25A3 + byteIndex] = BitUtils.setBit(currentByte, bitIndex, owned);
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.pokedexOwned[byteIndex] = newData[0x25A3 + byteIndex];
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  const setPokemonSeen = useCallback((speciesId: number, seen: boolean) => {
    if (!sramData || speciesId < 0 || speciesId >= 152) return;
    
    const newData = [...sramData.raw];
    const byteIndex = Math.floor(speciesId / 8);
    const bitIndex = speciesId % 8;
    const currentByte = newData[0x25B6 + byteIndex];
    newData[0x25B6 + byteIndex] = BitUtils.setBit(currentByte, bitIndex, seen);
    
    // Update in parsed data
    const newSramData = { ...sramData };
    newSramData.bank1.mainData.pokedexSeen[byteIndex] = newData[0x25B6 + byteIndex];
    newSramData.raw = newData;
    
    setSramData(newSramData);
  }, [sramData]);

  // Export function
  const exportSRAM = useCallback(() => {
    return sramData?.raw || null;
  }, [sramData]);

  // Reset function
  const reset = useCallback(() => {
    setSramData(null);
    setError(null);
    setIsLoading(false);
  }, []);

  return {
    // Raw data
    sramData,
    rawData,
    
    // Parsed data
    playerName,
    rivalName,
    party,
    currentBox,
    boxes,
    mainData,
    pokedex,
    money,
    gameOptions,
    badges,
    playTime,
    
    // State
    isLoading,
    isValid,
    error,
    
    // Actions
    loadSRAM,
    updatePlayerName,
    updateRivalName,
    updateMoney,
    updateGameOptions,
    updateBadges,
    updatePlayTime,
    getPokemonFromParty,
    getPokemonFromBox,
    isPokemonOwned,
    isPokemonSeen,
    setPokemonOwned,
    setPokemonSeen,
    exportSRAM,
    reset
  };
}
