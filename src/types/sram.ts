/**
 * Comprehensive TypeScript types for Pokémon Red/Blue/Yellow SRAM data
 * Based on the detailed save data structure documentation
 */

// Base types
export type SRAMByte = number; // 0-255
export type SRAMArray = SRAMByte[]; // Array of bytes
export type SRAMOffset = number; // Memory offset in hex

// Text encoding types
export type TextChar = SRAMByte; // 0x00-0xFF character codes
export type TextString = TextChar[]; // Array of character codes
export type NameString = TextChar[]; // 11-byte name (max 10 chars + terminator)

// Bank structure
export interface SRAMBank {
  offset: SRAMOffset;
  size: number;
  data: SRAMArray;
}

export interface SRAMStructure {
  bank0: SRAMBank; // Scratch and Hall of Fame
  bank1: SRAMBank; // Main data
  bank2: SRAMBank; // Boxes 1-6
  bank3: SRAMBank; // Boxes 7-12
}

// Bank 0 - Scratch and Hall of Fame
export interface Bank0Data {
  spriteBuffer0: SRAMArray; // 0x0000-0x0187 (0x188 bytes)
  spriteBuffer1: SRAMArray; // 0x0188-0x030F (0x188 bytes)
  spriteBuffer2: SRAMArray; // 0x0310-0x0497 (0x188 bytes)
  unused1: SRAMArray; // 0x0498-0x0597 (0x100 bytes)
  hallOfFame: HallOfFameData; // 0x0598-0x1857 (0x12C0 bytes)
  unused2: SRAMArray; // 0x1858-0x1FFF (0x7A8 bytes)
}

// Hall of Fame data structure
export interface HallOfFameEntry {
  party: PokemonPartyData; // 6 Pokémon max
  trainerName: NameString; // 11 bytes
  trainerId: number; // 2 bytes
  playTime: PlayTime; // 4 bytes
  unused: SRAMArray; // 2 bytes
}

export interface HallOfFameData {
  entries: HallOfFameEntry[]; // Up to 50 entries
  recordCount: number; // Number of entries
}

// Bank 1 - Main data structure
export interface Bank1Data {
  unused1: SRAMArray; // 0x2000-0x2597 (0x598 bytes)
  playerName: NameString; // 0x2598-0x25A2 (0xB bytes)
  mainData: MainData; // 0x25A3-0x2D2B (0x789 bytes)
  spriteData: SRAMArray; // 0x2D2C-0x2F2B (0x200 bytes)
  partyData: PokemonPartyData; // 0x2F2C-0x30BF (0x194 bytes)
  currentBoxData: PokemonBoxData; // 0x30C0-0x3521 (0x462 bytes)
  tilesetType: SRAMByte; // 0x3522 (0x1 byte)
  mainDataChecksum: SRAMByte; // 0x3523 (0x1 byte)
  unused2: SRAMArray; // 0x3524-0x3FFF (0xADC bytes)
}

// Main data structure (most comprehensive)
export interface MainData {
  pokedexOwned: PokedexData; // 0x25A3-0x25B5 (0x13 bytes)
  pokedexSeen: PokedexData; // 0x25B6-0x25C8 (0x13 bytes)
  bagItems: ItemList; // 0x25C9-0x25F2 (0x2A bytes)
  money: Money; // 0x25F3-0x25F5 (0x3 bytes)
  rivalName: NameString; // 0x25F6-0x2600 (0xB bytes)
  gameOptions: GameOptions; // 0x2601 (0x1 byte)
  badges: Badges; // 0x2602 (0x1 byte)
  padding1: SRAMByte; // 0x2603 (0x1 byte)
  letterDelay: SRAMByte; // 0x2604 (0x1 byte)
  playerId: number; // 0x2605-0x2606 (0x2 bytes)
  musicId: SRAMByte; // 0x2607 (0x1 byte)
  musicBank: SRAMByte; // 0x2608 (0x1 byte)
  contrastId: SRAMByte; // 0x2609 (0x1 byte)
  currentMap: SRAMByte; // 0x260A (0x1 byte)
  ulCornerCurViewTileBlockMapPtr: number; // 0x260B-0x260C (0x2 bytes)
  yCoord: SRAMByte; // 0x260D (0x1 byte)
  xCoord: SRAMByte; // 0x260E (0x1 byte)
  yBlockCoord: SRAMByte; // 0x260F (0x1 byte)
  xBlockCoord: SRAMByte; // 0x2610 (0x1 byte)
  lastMap: SRAMByte; // 0x2611 (0x1 byte)
  unused1: SRAMByte; // 0x2612 (0x1 byte)
  currentTileset: SRAMByte; // 0x2613 (0x1 byte)
  mapHeightBlocks: SRAMByte; // 0x2614 (0x1 byte)
  mapWidthBlocks: SRAMByte; // 0x2615 (0x1 byte)
  mapDataPointer: number; // 0x2616-0x2617 (0x2 bytes)
  mapTextPointer: number; // 0x2618-0x2619 (0x2 bytes)
  mapScriptPointer: number; // 0x261A-0x261B (0x2 bytes)
  mapConnections: SRAMByte; // 0x261C (0x1 byte)
  mapConnectionsNorth: SRAMArray; // 0x261D-0x2627 (0xB bytes)
  mapConnectionsSouth: SRAMArray; // 0x2628-0x2632 (0xB bytes)
  mapConnectionsWest: SRAMArray; // 0x2633-0x263D (0xB bytes)
  mapConnectionsEast: SRAMArray; // 0x263E-0x2648 (0xB bytes)
  spriteSetIds: SRAMArray; // 0x2649-0x2653 (0xB bytes)
  spriteSetId: SRAMByte; // 0x2654 (0x1 byte)
  objectDataPointersTmp: SRAMArray; // 0x2655-0x2658 (0x4 bytes)
  outOfBoundsTile: SRAMByte; // 0x2659 (0x1 byte)
  warpCount: SRAMByte; // 0x265A (0x1 byte)
  warpEntries: SRAMArray; // 0x265B-0x26DA (0x80 bytes)
  warpDestinationId: SRAMByte; // 0x26DB (0x1 byte)
  pikachuFriendship: SRAMByte; // 0x271C (0x1 byte)
  padding2: SRAMArray; // 0x275B-0x275B (0x7 bytes)
  signCount: SRAMByte; // 0x275C (0x1 byte)
  signCoords: SRAMArray; // 0x275D-0x277C (0x20 bytes)
  signTextIds: SRAMArray; // 0x277D-0x278C (0x10 bytes)
  spriteCount: SRAMByte; // 0x278D (0x1 byte)
  yOffsetSinceLastSpecialWarp: SRAMByte; // 0x278E (0x1 byte)
  xOffsetSinceLastSpecialWarp: SRAMByte; // 0x278F (0x1 byte)
  spriteData: SRAMArray; // 0x2790-0x27AF (0x20 bytes)
  spriteExtraData: SRAMArray; // 0x27B0-0x27CF (0x20 bytes)
  map2x2MetaHeight: SRAMByte; // 0x27D0 (0x1 byte)
  map2x2MetaWidth: SRAMByte; // 0x27D1 (0x1 byte)
  mapViewVramPointer: number; // 0x27D2-0x27D3 (0x2 bytes)
  playerMovementDirection: SRAMByte; // 0x27D4 (0x1 byte)
  playerLastStopDirection: SRAMByte; // 0x27D5 (0x1 byte)
  playerDirection: SRAMByte; // 0x27D6 (0x1 byte)
  tilesetBank: SRAMByte; // 0x27D7 (0x1 byte)
  tilesetBlockPointer: number; // 0x27D8-0x27D9 (0x2 bytes)
  tilesetGfxPointer: number; // 0x27DA-0x27DB (0x2 bytes)
  tilesetCollisionPointer: number; // 0x27DC-0x27DD (0x2 bytes)
  tilesetTalkingOverTiles: SRAMArray; // 0x27DE-0x27E0 (0x3 bytes)
  tilesetGrassTiles: SRAMArray; // 0x27E1-0x27E5 (0x5 bytes)
  boxItems: ItemBox; // 0x27E6-0x284B (0x68 bytes)
  currentBoxNumber: number; // 0x284C-0x284D (0x2 bytes)
  hallOfFameRecordCount: SRAMByte; // 0x284E (0x1 byte)
  unused2: SRAMByte; // 0x284F (0x1 byte)
  slotCoins: number; // 0x2850-0x2851 (0x2 bytes)
  missableObjects: SRAMArray; // 0x2852-0x2871 (0x20 bytes)
  padding3: SRAMArray; // 0x2872-0x2878 (0x7 bytes)
  scratch: SRAMByte; // 0x2879 (0x1 byte)
  missableList: SRAMArray; // 0x287A-0x289B (0x22 bytes)
  completedScripts: SRAMArray; // 0x289C-0x299B (0x100 bytes)
  ownedHiddenItems: SRAMArray; // 0x299C-0x29A9 (0xE bytes)
  ownedHiddenCoins: number; // 0x29AA-0x29AB (0x2 bytes)
  walkingBikingOrSurfing: SRAMByte; // 0x29AC (0x1 byte)
  padding4: SRAMArray; // 0x29AD-0x29B6 (0x10 bytes)
  townsVisited: number; // 0x29B7-0x29B8 (0x2 bytes)
  safariSteps: number; // 0x29B9-0x29BA (0x2 bytes)
  fossilItemGivenId: SRAMByte; // 0x29BB (0x1 byte)
  fossilPokemonResultId: SRAMArray; // 0x29BC-0x29BE (0x3 bytes)
  enemyPokemonOrTrainerClass: SRAMByte; // 0x29BF (0x1 byte)
  playerJumpingYScreenCoords: SRAMByte; // 0x29C0 (0x1 byte)
  rivalFirstPartnerPokemon: SRAMByte; // 0x29C1 (0x1 byte)
  padding5: SRAMByte; // 0x29C2 (0x1 byte)
  playerFirstPartnerPokemon: SRAMByte; // 0x29C3 (0x1 byte)
  boulderSpriteIndex: SRAMByte; // 0x29C4 (0x1 byte)
  lastBlackoutMap: SRAMByte; // 0x29C5 (0x1 byte)
  destinationMap: SRAMByte; // 0x29C6 (0x1 byte)
  unused3: SRAMByte; // 0x29C7 (0x1 byte)
  tileInFrontOfBoulderOrCollision: SRAMByte; // 0x29C8 (0x1 byte)
  dungeonWarpDestination: SRAMByte; // 0x29C9 (0x1 byte)
  whichDungeonWarpUsed: SRAMByte; // 0x29CA (0x1 byte)
  unused4: SRAMArray; // 0x29CB-0x29D3 (0x9 bytes)
  variousFlags1: SRAMByte; // 0x29D4 (0x1 byte)
  padding6: SRAMByte; // 0x29D5 (0x1 byte)
  defeatedGyms: SRAMByte; // 0x29D6 (0x1 byte)
  padding7: SRAMByte; // 0x29D7 (0x1 byte)
  variousFlags2: SRAMByte; // 0x29D8 (0x1 byte)
  variousFlags3: SRAMByte; // 0x29D9 (0x1 byte)
  variousFlags4: SRAMByte; // 0x29DA (0x1 byte)
  padding8: SRAMByte; // 0x29DB (0x1 byte)
  variousFlags5: SRAMByte; // 0x29DC (0x1 byte)
  padding9: SRAMByte; // 0x29DD (0x1 byte)
  variousFlags6: SRAMByte; // 0x29DE (0x1 byte)
  variousFlags7: SRAMByte; // 0x29DF (0x1 byte)
  defeatedLorelei: number; // 0x29E0-0x29E1 (0x2 bytes)
  variousFlags8: SRAMByte; // 0x29E2 (0x1 byte)
  inGameTrades: number; // 0x29E3-0x29E4 (0x2 bytes)
  padding10: SRAMByte; // 0x29E5 (0x1 byte)
  warpedFromWarp: SRAMByte; // 0x29E7 (0x1 byte)
  warpedFromMap: SRAMByte; // 0x29E8 (0x1 byte)
  padding11: SRAMArray; // 0x29E9-0x29EA (0x2 bytes)
  cardKeyDoorY: SRAMByte; // 0x29EB (0x1 byte)
  cardKeyDoorX: SRAMByte; // 0x29EC (0x1 byte)
  padding12: SRAMArray; // 0x29ED-0x29EE (0x2 bytes)
  firstTrashCanLock: SRAMByte; // 0x29EF (0x1 byte)
  secondTrashCanLock: SRAMByte; // 0x29F0 (0x1 byte)
  padding13: SRAMArray; // 0x29F1-0x29F2 (0x2 bytes)
  completedGameEvents: SRAMArray; // 0x29F3-0x2B32 (0x140 bytes)
  grassRate: SRAMByte; // 0x2B33 (0x1 byte)
  linkTrainer: SRAMByte; // 0x2B33 (0x1 byte) - shared space
  grassPokemon: SRAMArray; // 0x2B34-0x2B3E (0xB bytes)
  linkData: SRAMArray; // 0x2B3F-0x2B47 (0x9 bytes) - shared space
  enemyPartyCount: SRAMByte; // 0x2B48 (0x1 byte)
  enemyPartyPokemon: SRAMArray; // 0x2B49-0x2B4F (0x7 bytes)
  waterRate: SRAMByte; // 0x2B50 (0x1 byte) - shared space
  waterPokemon: SRAMByte; // 0x2B51 (0x1 byte) - shared space
  enemyPartialPartyData: SRAMArray; // 0x2B50-0x2CDB (0x18C bytes) - shared space
  trainerHeaderPointer: number; // 0x2CDC-0x2CDD (0x2 bytes)
  padding14: SRAMArray; // 0x2CDE-0x2CE3 (0x6 bytes)
  opponentIdAfterWrongAnswer: SRAMByte; // 0x2CE4 (0x1 byte)
  currentMapScript: SRAMByte; // 0x2CE5 (0x1 byte)
  padding15: SRAMArray; // 0x2CE6-0x2CEC (0x7 bytes)
  playTime: PlayTime; // 0x2CED-0x2CF0 (0x4 bytes)
  safariGameOver: SRAMByte; // 0x2CF2 (0x1 byte)
  safariBallCount: SRAMByte; // 0x2CF3 (0x1 byte)
  daycareInUse: SRAMByte; // 0x2CF4 (0x1 byte)
  daycarePokemonName: NameString; // 0x2CF5-0x2CFF (0xB bytes)
  daycareOriginalTrainer: NameString; // 0x2D00-0x2D0A (0xB bytes)
  daycarePokemon: PokemonData; // 0x2D0B (0x1 byte)
}

// Pokémon data structures
export interface PokemonData {
  species: SRAMByte; // Species ID
  hp: number; // Current HP (2 bytes)
  level: SRAMByte; // Level
  status: SRAMByte; // Status condition
  type1: SRAMByte; // Primary type
  type2: SRAMByte; // Secondary type
  catchRate: SRAMByte; // Catch rate
  moves: SRAMArray; // 4 moves (4 bytes)
  otId: number; // Original Trainer ID (2 bytes)
  exp: number; // Experience points (3 bytes)
  hpEv: number; // HP EV (2 bytes)
  attackEv: number; // Attack EV (2 bytes)
  defenseEv: number; // Defense EV (2 bytes)
  speedEv: number; // Speed EV (2 bytes)
  specialEv: number; // Special EV (2 bytes)
  iv: number; // IV data (2 bytes)
  pp: SRAMArray; // PP for 4 moves (4 bytes)
  level2: SRAMByte; // Level (duplicate)
  maxHp: number; // Max HP (2 bytes)
  attack: number; // Attack stat (2 bytes)
  defense: number; // Defense stat (2 bytes)
  speed: number; // Speed stat (2 bytes)
  special: number; // Special stat (2 bytes)
}

export interface PokemonPartyData {
  count: SRAMByte; // Number of Pokémon (max 6)
  species: SRAMArray; // Species IDs (6 bytes)
  padding: SRAMByte; // Unused
  pokemon: PokemonData[]; // Pokémon data (6 × 44 bytes)
  otNames: NameString[]; // Original Trainer names (6 × 11 bytes)
  nicknames: NameString[]; // Pokémon nicknames (6 × 11 bytes)
}

export interface PokemonBoxData {
  count: SRAMByte; // Number of Pokémon (max 20)
  species: SRAMArray; // Species IDs (20 bytes)
  padding: SRAMByte; // Unused
  pokemon: PokemonData[]; // Pokémon data (20 × 33 bytes)
  otNames: NameString[]; // Original Trainer names (20 × 11 bytes)
  nicknames: NameString[]; // Pokémon nicknames (20 × 11 bytes)
}

// Item data structures
export interface ItemEntry {
  item: SRAMByte; // Item ID
  quantity: SRAMByte; // Quantity
}

export interface ItemList {
  items: ItemEntry[]; // Up to 20 items
}

export interface ItemBox {
  items: ItemEntry[]; // Up to 50 items
}

// Game state data
export interface PokedexData {
  owned: SRAMArray; // 19 bytes (152 bits for owned status)
  seen: SRAMArray; // 19 bytes (152 bits for seen status)
}

export interface Money {
  amount: number; // 3 bytes BCD (6 digits)
}

export interface GameOptions {
  battleEffects: boolean; // bit 7
  battleStyle: boolean; // bit 6 (Set vs Switch)
  sound: boolean; // bit 4 (Mono vs Stereo)
  textSpeed: number; // bits 2-0 (001=Fast, 011=Normal, 101=Slow)
}

export interface Badges {
  boulder: boolean; // bit 7
  cascade: boolean; // bit 6
  thunder: boolean; // bit 5
  rainbow: boolean; // bit 4
  soul: boolean; // bit 3
  marsh: boolean; // bit 2
  volcano: boolean; // bit 1
  earth: boolean; // bit 0
}

export interface PlayTime {
  hours: SRAMByte;
  minutes: SRAMByte;
  seconds: SRAMByte;
  frames: SRAMByte;
  maxed: SRAMByte; // 0xFF when maxed out
}

// Utility types for parsing
export interface SRAMParser {
  parseBank0(data: SRAMArray): Bank0Data;
  parseBank1(data: SRAMArray): Bank1Data;
  parseMainData(data: SRAMArray): MainData;
  parsePokemonParty(data: SRAMArray): PokemonPartyData;
  parsePokemonBox(data: SRAMArray): PokemonBoxData;
  parseItemList(data: SRAMArray): ItemList;
  parsePokedexData(data: SRAMArray): PokedexData;
  parseMoney(data: SRAMArray): Money;
  parseGameOptions(data: SRAMByte): GameOptions;
  parseBadges(data: SRAMByte): Badges;
  parsePlayTime(data: SRAMArray): PlayTime;
  parseNameString(data: SRAMArray): string;
  parseTextString(data: SRAMArray): string;
}

// Checksum validation
export interface ChecksumValidator {
  validateMainDataChecksum(data: SRAMArray): boolean;
  calculateMainDataChecksum(data: SRAMArray): SRAMByte;
}

// Main SRAM interface
export interface SRAMData {
  raw: SRAMArray; // Raw 32KB array
  bank0: Bank0Data;
  bank1: Bank1Data;
  bank2: PokemonBoxData; // Boxes 1-6
  bank3: PokemonBoxData; // Boxes 7-12
  isValid: boolean;
  checksum: SRAMByte;
}

// Export the sample data as a typed constant
export const sampleSRAMData: SRAMArray = [
  // This would be populated with the actual sample data
  // For now, it's just a placeholder
] as const;