import { translateIntegerArray } from './text';
import { typeDict, dexDict } from "./dicts";
import { PokemonDetails, PartyDataStructure } from "@/types/pokemon";

// HP and stats are stored big-endian (see party_struct in pokered)
function readWord(data: number[], offset: number) {
    return (data[offset] << 8) | data[offset + 1];
}

// The low 3 bits count remaining sleep turns; the other conditions are single bits
function parseStatus(statusByte: number) {
    if (statusByte & 0b0000111) return 'ASLEEP';
    if (statusByte & 0b0001000) return 'POISON';
    if (statusByte & 0b0010000) return 'BURNED';
    if (statusByte & 0b0100000) return 'FROZEN';
    if (statusByte & 0b1000000) return 'PARALYZED';
    return 'HEALTHY';
}

export function parseParty(dataArray: number[]) {
    const numberOfPokemon = dataArray[0]; // Number of Pokémon in party
    const partyData: PartyDataStructure = {
        numberOfPokemon: numberOfPokemon,
        pokemonList: []
    };

    // Loop to process each Pokémon's data
    for (let i = 0; i < numberOfPokemon; i++) {
        const baseOffset = 0x08 + i * 44; // Calculate base offset for each Pokémon
        const otNameOffset = 0x110 + i * 11;
        const nicknameOffset = 0x152 + i * 11;

        const pokemonData: PokemonDetails = {
            speciesIndex: dataArray[0x01 + i],
            pokedexNo: dexDict[dataArray[0x01 + i]].pokedexNo,
            speciesName: dexDict[dataArray[0x01 + i]].name,
            structure: parsePokemonStructure(dataArray.slice(baseOffset, baseOffset + 44)),
            otName: translateIntegerArray(dataArray.slice(otNameOffset, otNameOffset + 11)),
            nickname: translateIntegerArray(dataArray.slice(nicknameOffset, nicknameOffset + 11))
        };
        partyData.pokemonList.push(pokemonData);
    }

    return partyData;
}

function parsePokemonStructure(structureData: number[]) {
    return {
        ...parseBoxStructure(structureData),
        level: structureData[0x21],
        levelStats: {
            maxHP: readWord(structureData, 0x22),
            attack: readWord(structureData, 0x24),
            defense: readWord(structureData, 0x26),
            speed: readWord(structureData, 0x28),
            special: readWord(structureData, 0x2A)
        }
    };
}

/**
 * The first 33 bytes, which a boxed Pokémon has too. Its level and stats live in the
 * party-only bytes after these, so a box Pokémon's come from elsewhere.
 */
export function parseBoxStructure(structureData: ArrayLike<number>) {
    const data = Array.from(structureData);
    return {
        pokedexNo: dexDict[data[0x00]]?.pokedexNo,
        currentHP: readWord(data, 0x01),
        statusCondition: parseStatus(data[0x04]),
        type1: typeDict[data[0x05]],
        type2: typeDict[data[0x06]],
        catchRateHeldItem: data[0x07],
        moves: [
            parseMove(data[0x08], data[0x1D]),
            parseMove(data[0x09], data[0x1E]),
            parseMove(data[0x0A], data[0x1F]),
            parseMove(data[0x0B], data[0x20])
        ],
        originalTrainerID: readWord(data, 0x0C),
        EVs: {
            hp: (data[0x11] << 8) | data[0x12],
            attack: (data[0x13] << 8) | data[0x14],
            defense: (data[0x15] << 8) | data[0x16],
            speed: (data[0x17] << 8) | data[0x18],
            special: (data[0x19] << 8) | data[0x1A]
        },
        // First DV byte is attack/defense, second is speed/special (see CalcStat in pokered)
        IVs: calculateIVs(readWord(data, 0x1B)),
    };
}

// The PP byte packs PP Ups used into the top 2 bits and current PP into the low 6
function parseMove(id: number, ppByte: number) {
    return { id, pp: ppByte & 0x3F, ppUps: ppByte >> 6 };
}

function calculateIVs(ivNumber: number) {
    // Extract individual IVs (each IV is 4 bits)
    const attackIV = (ivNumber >> 12) & 0xF;
    const defenseIV = (ivNumber >> 8) & 0xF;
    const speedIV = (ivNumber >> 4) & 0xF;
    const specialIV = ivNumber & 0xF;

    // Calculate HP IV
    const hpIV = ((attackIV & 1) << 3) | ((defenseIV & 1) << 2) | ((speedIV & 1) << 1) | (specialIV & 1);

    return {
        hp: hpIV,
        attack: attackIV,
        defense: defenseIV,
        speed: speedIV,
        special: specialIV
    };
}