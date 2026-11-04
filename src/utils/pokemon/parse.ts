import { translateIntegerArray } from "../MemoryWatcher";
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
        pokedexNo: dexDict[structureData[0x00]].pokedexNo,
        currentHP: readWord(structureData, 0x01),
        level: structureData[0x21],
        statusCondition: parseStatus(structureData[0x04]),
        type1: typeDict[structureData[0x05]],
        type2: typeDict[structureData[0x06]],
        catchRateHeldItem: structureData[0x07],
        moves: [
            parseMove(structureData[0x08], structureData[0x1D]),
            parseMove(structureData[0x09], structureData[0x1E]),
            parseMove(structureData[0x0A], structureData[0x1F]),
            parseMove(structureData[0x0B], structureData[0x20])
        ],
        originalTrainerID: readWord(structureData, 0x0C),
        EVs: {
            hp: (structureData[0x11] << 8) | structureData[0x12],
            attack: (structureData[0x13] << 8) | structureData[0x14],
            defense: (structureData[0x15] << 8) | structureData[0x16],
            speed: (structureData[0x17] << 8) | structureData[0x18],
            special: (structureData[0x19] << 8) | structureData[0x1A]
        },
        // First DV byte is attack/defense, second is speed/special (see CalcStat in pokered)
        IVs: calculateIVs(readWord(structureData, 0x1B)),
        levelStats: {
            maxHP: readWord(structureData, 0x22),
            attack: readWord(structureData, 0x24),
            defense: readWord(structureData, 0x26),
            speed: readWord(structureData, 0x28),
            special: readWord(structureData, 0x2A)
        }
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