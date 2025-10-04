/**
 * Utility functions for parsing and working with SRAM data
 * Provides type-safe access to Pokémon save data
 */

import {
  SRAMArray,
  SRAMByte,
  SRAMOffset,
  NameString,
  TextString,
  Bank0Data,
  Bank1Data,
  MainData,
  PokemonPartyData,
  PokemonBoxData,
  PokemonData,
  ItemList,
  ItemEntry,
  PokedexData,
  Money,
  GameOptions,
  Badges,
  PlayTime,
  SRAMData,
  HallOfFameData,
  HallOfFameEntry
} from '@/types/sram';

// Text encoding utilities
export class TextEncoder {
  private static readonly CHAR_TABLE: Record<number, string> = {
    0x00: '', // null
    0x50: '', // end
    0x7F: ' ', // space
    0x80: 'A', 0x81: 'B', 0x82: 'C', 0x83: 'D', 0x84: 'E', 0x85: 'F', 0x86: 'G', 0x87: 'H', 0x88: 'I', 0x89: 'J', 0x8A: 'K', 0x8B: 'L', 0x8C: 'M', 0x8D: 'N', 0x8E: 'O', 0x8F: 'P',
    0x90: 'Q', 0x91: 'R', 0x92: 'S', 0x93: 'T', 0x94: 'U', 0x95: 'V', 0x96: 'W', 0x97: 'X', 0x98: 'Y', 0x99: 'Z', 0x9A: '(', 0x9B: ')', 0x9C: ':', 0x9D: ';', 0x9E: '[', 0x9F: ']',
    0xA0: 'a', 0xA1: 'b', 0xA2: 'c', 0xA3: 'd', 0xA4: 'e', 0xA5: 'f', 0xA6: 'g', 0xA7: 'h', 0xA8: 'i', 0xA9: 'j', 0xAA: 'k', 0xAB: 'l', 0xAC: 'm', 0xAD: 'n', 0xAE: 'o', 0xAF: 'p',
    0xB0: 'q', 0xB1: 'r', 0xB2: 's', 0xB3: 't', 0xB4: 'u', 0xB5: 'v', 0xB6: 'w', 0xB7: 'x', 0xB8: 'y', 0xB9: 'z', 0xBA: 'é', 0xBB: "'d", 0xBC: "'l", 0xBD: "'s", 0xBE: "'t", 0xBF: "'v",
    0xE8: '.', 0xE9: 'ァ', 0xEA: 'ゥ', 0xEB: 'ェ', 0xEC: '▷', 0xED: '▶', 0xEE: '▼', 0xEF: '♂',
    0xF0: '$', 0xF1: '×', 0xF2: '.', 0xF3: '/', 0xF4: ',', 0xF5: '♀', 0xF6: '0', 0xF7: '1', 0xF8: '2', 0xF9: '3', 0xFA: '4', 0xFB: '5', 0xFC: '6', 0xFD: '7', 0xFE: '8', 0xFF: '9'
  };

  static decodeString(data: TextString): string {
    return data
      .map(byte => this.CHAR_TABLE[byte] || '')
      .join('')
      .replace(/\x50$/, ''); // Remove terminator
  }

  static encodeString(text: string): TextString {
    const reverseTable: Record<string, number> = {};
    for (const [key, value] of Object.entries(this.CHAR_TABLE)) {
      reverseTable[value] = parseInt(key, 16);
    }
    
    return text
      .split('')
      .map(char => reverseTable[char] || 0x50)
      .concat(0x50); // Add terminator
  }
}

// Binary Coded Decimal utilities
export class BCDConverter {
  static fromBCD(data: SRAMArray): number {
    let result = 0;
    for (let i = 0; i < data.length; i++) {
      const byte = data[i];
      const high = Math.floor(byte / 16);
      const low = byte % 16;
      result = result * 100 + high * 10 + low;
    }
    return result;
  }

  static toBCD(value: number, bytes: number): SRAMArray {
    const result: SRAMArray = [];
    for (let i = bytes - 1; i >= 0; i--) {
      const divisor = Math.pow(100, i);
      const digit = Math.floor(value / divisor) % 100;
      result.push((Math.floor(digit / 10) * 16) + (digit % 10));
    }
    return result;
  }
}

// Bit manipulation utilities
export class BitUtils {
  static getBit(data: SRAMByte, bit: number): boolean {
    return ((data >> bit) & 1) === 1;
  }

  static setBit(data: SRAMByte, bit: number, value: boolean): SRAMByte {
    if (value) {
      return data | (1 << bit);
    } else {
      return data & ~(1 << bit);
    }
  }

  static getBits(data: SRAMArray, startBit: number, length: number): number {
    let result = 0;
    for (let i = 0; i < length; i++) {
      const byteIndex = Math.floor((startBit + i) / 8);
      const bitIndex = (startBit + i) % 8;
      if (this.getBit(data[byteIndex], bitIndex)) {
        result |= (1 << i);
      }
    }
    return result;
  }

  static setBits(data: SRAMArray, startBit: number, length: number, value: number): void {
    for (let i = 0; i < length; i++) {
      const byteIndex = Math.floor((startBit + i) / 8);
      const bitIndex = (startBit + i) % 8;
      const bitValue = ((value >> i) & 1) === 1;
      data[byteIndex] = this.setBit(data[byteIndex], bitIndex, bitValue);
    }
  }
}

// Main SRAM parser class
export class SRAMParser {
  private data: SRAMArray;

  constructor(data: SRAMArray) {
    this.data = data;
  }

  // Bank parsing methods
  parseBank0(): Bank0Data {
    return {
      spriteBuffer0: this.data.slice(0x0000, 0x0188),
      spriteBuffer1: this.data.slice(0x0188, 0x0310),
      spriteBuffer2: this.data.slice(0x0310, 0x0498),
      unused1: this.data.slice(0x0498, 0x0598),
      hallOfFame: this.parseHallOfFame(this.data.slice(0x0598, 0x1858)),
      unused2: this.data.slice(0x1858, 0x2000)
    };
  }

  parseBank1(): Bank1Data {
    return {
      unused1: this.data.slice(0x2000, 0x2598),
      playerName: this.data.slice(0x2598, 0x25A3) as NameString,
      mainData: this.parseMainData(this.data.slice(0x25A3, 0x2D2C)),
      spriteData: this.data.slice(0x2D2C, 0x2F2C),
      partyData: this.parsePokemonParty(this.data.slice(0x2F2C, 0x30C0)),
      currentBoxData: this.parsePokemonBox(this.data.slice(0x30C0, 0x3522)),
      tilesetType: this.data[0x3522],
      mainDataChecksum: this.data[0x3523],
      unused: this.data.slice(0x3524, 0x4000)
    };
  }

  // Main data parsing
  parseMainData(data: SRAMArray): MainData {
    return {
      pokedexOwned: this.parsePokedexData(data.slice(0x00, 0x13)),
      pokedexSeen: this.parsePokedexData(data.slice(0x13, 0x26)),
      bagItems: this.parseItemList(data.slice(0x26, 0x50)),
      money: this.parseMoney(data.slice(0x50, 0x53)),
      rivalName: data.slice(0x53, 0x5E) as NameString,
      gameOptions: this.parseGameOptions(data[0x5E]),
      badges: this.parseBadges(data[0x5F]),
      padding1: data[0x60],
      letterDelay: data[0x61],
      playerId: this.readUint16(data, 0x62),
      musicId: data[0x64],
      musicBank: data[0x65],
      contrastId: data[0x66],
      currentMap: data[0x67],
      ulCornerCurViewTileBlockMapPtr: this.readUint16(data, 0x68),
      yCoord: data[0x6A],
      xCoord: data[0x6B],
      yBlockCoord: data[0x6C],
      xBlockCoord: data[0x6D],
      lastMap: data[0x6E],
      unused1: data[0x6F],
      currentTileset: data[0x70],
      mapHeightBlocks: data[0x71],
      mapWidthBlocks: data[0x72],
      mapDataPointer: this.readUint16(data, 0x73),
      mapTextPointer: this.readUint16(data, 0x75),
      mapScriptPointer: this.readUint16(data, 0x77),
      mapConnections: data[0x79],
      mapConnectionsNorth: data.slice(0x7A, 0x85),
      mapConnectionsSouth: data.slice(0x85, 0x90),
      mapConnectionsWest: data.slice(0x90, 0x9B),
      mapConnectionsEast: data.slice(0x9B, 0xA6),
      spriteSetIds: data.slice(0xA6, 0xB1),
      spriteSetId: data[0xB1],
      objectDataPointersTmp: data.slice(0xB2, 0xB6),
      outOfBoundsTile: data[0xB6],
      warpCount: data[0xB7],
      warpEntries: data.slice(0xB8, 0x138),
      warpDestinationId: data[0x138],
      pikachuFriendship: data[0x1A1],
      padding2: data.slice(0x1E0, 0x1E7),
      signCount: data[0x1E7],
      signCoords: data.slice(0x1E8, 0x208),
      signTextIds: data.slice(0x208, 0x218),
      spriteCount: data[0x218],
      yOffsetSinceLastSpecialWarp: data[0x219],
      xOffsetSinceLastSpecialWarp: data[0x21A],
      spriteData: data.slice(0x21B, 0x23B),
      spriteExtraData: data.slice(0x23B, 0x25B),
      map2x2MetaHeight: data[0x25B],
      map2x2MetaWidth: data[0x25C],
      mapViewVramPointer: this.readUint16(data, 0x25D),
      playerMovementDirection: data[0x25F],
      playerLastStopDirection: data[0x260],
      playerDirection: data[0x261],
      tilesetBank: data[0x262],
      tilesetBlockPointer: this.readUint16(data, 0x263),
      tilesetGfxPointer: this.readUint16(data, 0x265),
      tilesetCollisionPointer: this.readUint16(data, 0x267),
      tilesetTalkingOverTiles: data.slice(0x269, 0x26C),
      tilesetGrassTiles: data.slice(0x26C, 0x271),
      boxItems: this.parseItemBox(data.slice(0x271, 0x2B9)),
      currentBoxNumber: this.readUint16(data, 0x2B9),
      hallOfFameRecordCount: data[0x2BB],
      unused2: data[0x2BC],
      slotCoins: this.readUint16(data, 0x2BD),
      missableObjects: data.slice(0x2BF, 0x2DF),
      padding3: data.slice(0x2DF, 0x2E6),
      scratch: data[0x2E6],
      missableList: data.slice(0x2E7, 0x309),
      completedScripts: data.slice(0x309, 0x409),
      ownedHiddenItems: data.slice(0x409, 0x417),
      ownedHiddenCoins: this.readUint16(data, 0x417),
      walkingBikingOrSurfing: data[0x419],
      padding4: data.slice(0x41A, 0x42A),
      townsVisited: this.readUint16(data, 0x42A),
      safariSteps: this.readUint16(data, 0x42C),
      fossilItemGivenId: data[0x42E],
      fossilPokemonResultId: data.slice(0x42F, 0x432),
      enemyPokemonOrTrainerClass: data[0x432],
      playerJumpingYScreenCoords: data[0x433],
      rivalFirstPartnerPokemon: data[0x434],
      padding5: data[0x435],
      playerFirstPartnerPokemon: data[0x436],
      boulderSpriteIndex: data[0x437],
      lastBlackoutMap: data[0x438],
      destinationMap: data[0x439],
      unused3: data[0x43A],
      tileInFrontOfBoulderOrCollision: data[0x43B],
      dungeonWarpDestination: data[0x43C],
      whichDungeonWarpUsed: data[0x43D],
      unused4: data.slice(0x43E, 0x448),
      variousFlags1: data[0x448],
      padding6: data[0x449],
      defeatedGyms: data[0x44A],
      padding7: data[0x44B],
      variousFlags2: data[0x44C],
      variousFlags3: data[0x44D],
      variousFlags4: data[0x44E],
      padding8: data[0x44F],
      variousFlags5: data[0x450],
      padding9: data[0x451],
      variousFlags6: data[0x452],
      variousFlags7: data[0x453],
      defeatedLorelei: this.readUint16(data, 0x454),
      variousFlags8: data[0x456],
      inGameTrades: this.readUint16(data, 0x457),
      padding10: data[0x459],
      warpedFromWarp: data[0x45B],
      warpedFromMap: data[0x45C],
      padding11: data.slice(0x45D, 0x45F),
      cardKeyDoorY: data[0x45F],
      cardKeyDoorX: data[0x460],
      padding12: data.slice(0x461, 0x463),
      firstTrashCanLock: data[0x463],
      secondTrashCanLock: data[0x464],
      padding13: data.slice(0x465, 0x467),
      completedGameEvents: data.slice(0x467, 0x5A7),
      grassRate: data[0x5A7],
      linkTrainer: data[0x5A7], // shared space
      grassPokemon: data.slice(0x5A8, 0x5B3),
      linkData: data.slice(0x5B3, 0x5BC), // shared space
      enemyPartyCount: data[0x5BC],
      enemyPartyPokemon: data.slice(0x5BD, 0x5C4),
      waterRate: data[0x5C4], // shared space
      waterPokemon: data[0x5C5], // shared space
      enemyPartialPartyData: data.slice(0x5C4, 0x750), // shared space
      trainerHeaderPointer: this.readUint16(data, 0x750),
      padding14: data.slice(0x752, 0x758),
      opponentIdAfterWrongAnswer: data[0x758],
      currentMapScript: data[0x759],
      padding15: data.slice(0x75A, 0x761),
      playTime: this.parsePlayTime(data.slice(0x761, 0x765)),
      safariGameOver: data[0x765],
      safariBallCount: data[0x766],
      daycareInUse: data[0x767],
      daycarePokemonName: data.slice(0x768, 0x773) as NameString,
      daycareOriginalTrainer: data.slice(0x773, 0x77E) as NameString,
      daycarePokemon: this.parsePokemonData(data.slice(0x77E, 0x7B1))
    };
  }

  // Pokémon data parsing
  parsePokemonParty(data: SRAMArray): PokemonPartyData {
    const count = data[0];
    const species = data.slice(1, 7);
    const padding = data[7];
    const pokemon: PokemonData[] = [];
    const otNames: NameString[] = [];
    const nicknames: NameString[] = [];

    for (let i = 0; i < 6; i++) {
      const pokemonData = data.slice(8 + (i * 44), 8 + ((i + 1) * 44));
      pokemon.push(this.parsePokemonData(pokemonData));
      
      const otNameStart = 8 + (6 * 44) + (i * 11);
      otNames.push(data.slice(otNameStart, otNameStart + 11) as NameString);
      
      const nicknameStart = 8 + (6 * 44) + (6 * 11) + (i * 11);
      nicknames.push(data.slice(nicknameStart, nicknameStart + 11) as NameString);
    }

    return {
      count,
      species,
      padding,
      pokemon,
      otNames,
      nicknames
    };
  }

  parsePokemonBox(data: SRAMArray): PokemonBoxData {
    const count = data[0];
    const species = data.slice(1, 21);
    const padding = data[21];
    const pokemon: PokemonData[] = [];
    const otNames: NameString[] = [];
    const nicknames: NameString[] = [];

    for (let i = 0; i < 20; i++) {
      const pokemonData = data.slice(22 + (i * 33), 22 + ((i + 1) * 33));
      pokemon.push(this.parsePokemonData(pokemonData));
      
      const otNameStart = 22 + (20 * 33) + (i * 11);
      otNames.push(data.slice(otNameStart, otNameStart + 11) as NameString);
      
      const nicknameStart = 22 + (20 * 33) + (20 * 11) + (i * 11);
      nicknames.push(data.slice(nicknameStart, nicknameStart + 11) as NameString);
    }

    return {
      count,
      species,
      padding,
      pokemon,
      otNames,
      nicknames
    };
  }

  parsePokemonData(data: SRAMArray): PokemonData {
    return {
      species: data[0],
      hp: this.readUint16(data, 1),
      level: data[3],
      status: data[4],
      type1: data[5],
      type2: data[6],
      catchRate: data[7],
      moves: data.slice(8, 12),
      otId: this.readUint16(data, 12),
      exp: this.readUint24(data, 14),
      hpEv: this.readUint16(data, 17),
      attackEv: this.readUint16(data, 19),
      defenseEv: this.readUint16(data, 21),
      speedEv: this.readUint16(data, 23),
      specialEv: this.readUint16(data, 25),
      iv: this.readUint16(data, 27),
      pp: data.slice(29, 33),
      level2: data[33],
      maxHp: this.readUint16(data, 34),
      attack: this.readUint16(data, 36),
      defense: this.readUint16(data, 38),
      speed: this.readUint16(data, 40),
      special: this.readUint16(data, 42)
    };
  }

  // Other data parsing
  parseItemList(data: SRAMArray): ItemList {
    const items: ItemEntry[] = [];
    for (let i = 0; i < data.length; i += 2) {
      if (data[i] !== 0xFF) { // 0xFF indicates end of list
        items.push({
          item: data[i],
          quantity: data[i + 1]
        });
      }
    }
    return { items };
  }

  parseItemBox(data: SRAMArray): ItemList {
    return this.parseItemList(data);
  }

  parsePokedexData(data: SRAMArray): PokedexData {
    return {
      owned: data.slice(0, 19),
      seen: data.slice(19, 38)
    };
  }

  parseMoney(data: SRAMArray): Money {
    return {
      amount: BCDConverter.fromBCD(data)
    };
  }

  parseGameOptions(data: SRAMByte): GameOptions {
    return {
      battleEffects: !BitUtils.getBit(data, 7),
      battleStyle: BitUtils.getBit(data, 6),
      sound: BitUtils.getBit(data, 4),
      textSpeed: BitUtils.getBits([data], 0, 3)
    };
  }

  parseBadges(data: SRAMByte): Badges {
    return {
      boulder: BitUtils.getBit(data, 7),
      cascade: BitUtils.getBit(data, 6),
      thunder: BitUtils.getBit(data, 5),
      rainbow: BitUtils.getBit(data, 4),
      soul: BitUtils.getBit(data, 3),
      marsh: BitUtils.getBit(data, 2),
      volcano: BitUtils.getBit(data, 1),
      earth: BitUtils.getBit(data, 0)
    };
  }

  parsePlayTime(data: SRAMArray): PlayTime {
    return {
      hours: data[0],
      minutes: data[1],
      seconds: data[2],
      frames: data[3],
      maxed: data[4] || 0
    };
  }

  parseHallOfFame(data: SRAMArray): HallOfFameData {
    const entries: HallOfFameEntry[] = [];
    const entrySize = 0x78; // 120 bytes per entry
    
    for (let i = 0; i < 50; i++) {
      const entryData = data.slice(i * entrySize, (i + 1) * entrySize);
      if (entryData[0] !== 0xFF) { // Valid entry
        entries.push({
          party: this.parsePokemonParty(entryData.slice(0, 0x6C)),
          trainerName: entryData.slice(0x6C, 0x77) as NameString,
          trainerId: this.readUint16(entryData, 0x77),
          playTime: this.parsePlayTime(entryData.slice(0x79, 0x7D)),
          unused: entryData.slice(0x7D, 0x78)
        });
      }
    }

    return {
      entries,
      recordCount: entries.length
    };
  }

  // Utility methods
  private readUint16(data: SRAMArray, offset: number): number {
    return (data[offset + 1] << 8) | data[offset];
  }

  private readUint24(data: SRAMArray, offset: number): number {
    return (data[offset + 2] << 16) | (data[offset + 1] << 8) | data[offset];
  }

  // Checksum validation
  validateMainDataChecksum(): boolean {
    const checksum = this.calculateMainDataChecksum();
    return checksum === this.data[0x3523];
  }

  calculateMainDataChecksum(): SRAMByte {
    let checksum = 0;
    for (let i = 0x2598; i <= 0x3522; i++) {
      checksum += this.data[i];
    }
    return (~checksum) & 0xFF;
  }

  // Main parsing method
  parseSRAM(): SRAMData {
    return {
      raw: this.data,
      bank0: this.parseBank0(),
      bank1: this.parseBank1(),
      bank2: this.parsePokemonBox(this.data.slice(0x4000, 0x6000)),
      bank3: this.parsePokemonBox(this.data.slice(0x6000, 0x8000)),
      isValid: this.validateMainDataChecksum(),
      checksum: this.calculateMainDataChecksum()
    };
  }
}

// Export convenience functions
export function parseSRAM(data: SRAMArray): SRAMData {
  return new SRAMParser(data).parseSRAM();
}

export function parsePokemonParty(data: SRAMArray): PokemonPartyData {
  return new SRAMParser(data).parsePokemonParty(data);
}

export function parsePokemonBox(data: SRAMArray): PokemonBoxData {
  return new SRAMParser(data).parsePokemonBox(data);
}

export function parseMainData(data: SRAMArray): MainData {
  return new SRAMParser(data).parseMainData(data);
}

export function decodeNameString(data: NameString): string {
  return TextEncoder.decodeString(data);
}

export function encodeNameString(name: string): NameString {
  const encoded = TextEncoder.encodeString(name);
  // Pad to 11 bytes
  while (encoded.length < 11) {
    encoded.push(0x50);
  }
  return encoded.slice(0, 11) as NameString;
}
