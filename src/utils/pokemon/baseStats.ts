export interface BaseStats { hp: number; atk: number; def: number; spd: number; spc: number }

// Keyed by Gen 1 internal species index (from dexDict), not Pokédex number
export const BASE_STATS: Record<number, BaseStats> = {
    1:   { hp:105, atk:130, def:120, spd: 40, spc: 45 }, // Rhydon
    2:   { hp:105, atk: 95, def: 80, spd: 90, spc: 40 }, // Kangaskhan
    3:   { hp: 46, atk: 57, def: 40, spd: 50, spc: 40 }, // Nidoran_m
    4:   { hp: 70, atk: 45, def: 48, spd: 35, spc: 60 }, // Clefairy
    5:   { hp: 40, atk: 60, def: 30, spd: 70, spc: 31 }, // Spearow
    6:   { hp: 40, atk: 30, def: 50, spd:100, spc: 55 }, // Voltorb
    7:   { hp: 81, atk: 92, def: 77, spd: 85, spc: 75 }, // Nidoking
    8:   { hp: 95, atk: 75, def:110, spd: 30, spc: 80 }, // Slowbro
    9:   { hp: 60, atk: 62, def: 63, spd: 60, spc: 80 }, // Ivysaur
    10:  { hp: 95, atk: 95, def: 85, spd: 55, spc:125 }, // Exeggutor
    11:  { hp: 90, atk: 55, def: 75, spd: 30, spc: 60 }, // Lickitung
    12:  { hp: 60, atk: 40, def: 80, spd: 40, spc: 60 }, // Exeggcute
    13:  { hp: 80, atk: 80, def: 50, spd: 25, spc: 40 }, // Grimer
    14:  { hp: 60, atk: 65, def: 60, spd:110, spc:130 }, // Gengar
    15:  { hp: 55, atk: 47, def: 52, spd: 41, spc: 40 }, // Nidoran_f
    16:  { hp: 90, atk: 82, def: 87, spd: 76, spc: 75 }, // Nidoqueen
    17:  { hp: 50, atk: 50, def: 95, spd: 35, spc: 40 }, // Cubone
    18:  { hp: 80, atk: 85, def: 95, spd: 25, spc: 30 }, // Rhyhorn
    19:  { hp:130, atk: 85, def: 80, spd: 60, spc: 95 }, // Lapras
    20:  { hp: 90, atk:110, def: 80, spd: 95, spc: 80 }, // Arcanine
    21:  { hp:100, atk:100, def:100, spd:100, spc:100 }, // Mew
    22:  { hp: 95, atk:125, def: 79, spd: 81, spc:100 }, // Gyarados
    23:  { hp: 30, atk: 65, def:100, spd: 40, spc: 45 }, // Shellder
    24:  { hp: 40, atk: 40, def: 35, spd: 70, spc:100 }, // Tentacool
    25:  { hp: 30, atk: 35, def: 30, spd: 80, spc:100 }, // Gastly
    26:  { hp: 70, atk:110, def: 80, spd:105, spc: 55 }, // Scyther
    27:  { hp: 30, atk: 45, def: 55, spd: 85, spc: 70 }, // Staryu
    28:  { hp: 79, atk: 83, def:100, spd: 78, spc: 85 }, // Blastoise
    29:  { hp: 65, atk:125, def:100, spd: 85, spc: 55 }, // Pinsir
    30:  { hp: 65, atk: 55, def:115, spd: 60, spc:100 }, // Tangela
    33:  { hp: 55, atk: 70, def: 45, spd: 60, spc: 50 }, // Growlithe
    34:  { hp: 35, atk: 45, def:160, spd: 70, spc: 30 }, // Onix
    35:  { hp: 65, atk: 90, def: 65, spd:100, spc: 61 }, // Fearow
    36:  { hp: 40, atk: 45, def: 40, spd: 56, spc: 35 }, // Pidgey
    37:  { hp: 90, atk: 65, def: 65, spd: 15, spc: 40 }, // Slowpoke
    38:  { hp: 40, atk: 35, def: 30, spd:105, spc:120 }, // Kadabra
    39:  { hp: 55, atk: 95, def:115, spd: 35, spc: 45 }, // Graveler
    40:  { hp:250, atk:  5, def:  5, spd: 50, spc:105 }, // Chansey
    41:  { hp: 80, atk:100, def: 70, spd: 45, spc: 50 }, // Machoke
    42:  { hp: 40, atk: 45, def: 65, spd: 90, spc:100 }, // Mr.mime
    43:  { hp: 50, atk:120, def: 53, spd: 87, spc: 35 }, // Hitmonlee
    44:  { hp: 50, atk:105, def: 79, spd: 76, spc: 35 }, // Hitmonchan
    45:  { hp: 60, atk: 85, def: 69, spd: 80, spc: 65 }, // Arbok
    46:  { hp: 60, atk: 95, def: 80, spd: 30, spc: 80 }, // Parasect
    47:  { hp: 50, atk: 52, def: 48, spd: 55, spc: 50 }, // Psyduck
    48:  { hp: 60, atk: 48, def: 45, spd: 42, spc: 90 }, // Drowzee
    49:  { hp: 80, atk:110, def:130, spd: 45, spc: 55 }, // Golem
    51:  { hp: 65, atk: 95, def: 57, spd: 93, spc: 85 }, // Magmar
    53:  { hp: 65, atk: 83, def: 57, spd:105, spc: 85 }, // Electabuzz
    54:  { hp: 50, atk: 60, def: 95, spd: 70, spc:120 }, // Magneton
    55:  { hp: 40, atk: 65, def: 95, spd: 35, spc: 60 }, // Koffing
    57:  { hp: 40, atk: 80, def: 35, spd: 70, spc: 35 }, // Mankey
    58:  { hp: 65, atk: 45, def: 55, spd: 45, spc: 70 }, // Seel
    59:  { hp: 10, atk: 55, def: 25, spd: 95, spc: 45 }, // Diglett
    60:  { hp: 75, atk:100, def: 95, spd:110, spc: 70 }, // Tauros
    64:  { hp: 52, atk: 65, def: 55, spd: 60, spc: 58 }, // Farfetch'd
    65:  { hp: 60, atk: 55, def: 50, spd: 45, spc: 40 }, // Venonat
    66:  { hp: 91, atk:134, def: 95, spd: 80, spc:100 }, // Dragonite
    70:  { hp: 35, atk: 85, def: 45, spd: 75, spc: 35 }, // Doduo
    71:  { hp: 40, atk: 50, def: 40, spd: 90, spc: 40 }, // Poliwag
    72:  { hp: 65, atk: 50, def: 35, spd: 95, spc: 95 }, // Jynx
    73:  { hp: 90, atk:100, def: 90, spd: 90, spc:125 }, // Moltres
    74:  { hp: 90, atk: 85, def:100, spd: 85, spc:125 }, // Articuno
    75:  { hp: 90, atk: 90, def: 85, spd:100, spc:125 }, // Zapdos
    76:  { hp: 48, atk: 48, def: 48, spd: 48, spc: 48 }, // Ditto
    77:  { hp: 40, atk: 45, def: 35, spd: 90, spc: 40 }, // Meowth
    78:  { hp: 30, atk:105, def: 90, spd: 50, spc: 25 }, // Krabby
    82:  { hp: 38, atk: 41, def: 40, spd: 65, spc: 65 }, // Vulpix
    83:  { hp: 73, atk: 76, def: 75, spd:100, spc:100 }, // Ninetales
    84:  { hp: 35, atk: 55, def: 30, spd: 90, spc: 50 }, // Pikachu
    85:  { hp: 60, atk: 90, def: 55, spd:100, spc: 90 }, // Raichu
    88:  { hp: 41, atk: 64, def: 45, spd: 50, spc: 50 }, // Dratini
    89:  { hp: 61, atk: 84, def: 65, spd: 70, spc: 70 }, // Dragonair
    90:  { hp: 30, atk: 80, def: 90, spd: 55, spc: 45 }, // Kabuto
    91:  { hp: 60, atk:115, def:105, spd: 80, spc: 70 }, // Kabutops
    92:  { hp: 30, atk: 40, def: 70, spd: 60, spc: 70 }, // Horsea
    93:  { hp: 55, atk: 65, def: 95, spd: 85, spc: 95 }, // Seadra
    96:  { hp: 50, atk: 75, def: 85, spd: 40, spc: 30 }, // Sandshrew
    97:  { hp: 75, atk:100, def:110, spd: 65, spc: 55 }, // Sandslash
    98:  { hp: 35, atk: 40, def:100, spd: 35, spc: 90 }, // Omanyte
    99:  { hp: 70, atk: 60, def:125, spd: 55, spc:115 }, // Omastar
    100: { hp:115, atk: 45, def: 20, spd: 20, spc: 25 }, // Jigglypuff
    101: { hp:140, atk: 70, def: 45, spd: 45, spc: 50 }, // Wigglytuff
    102: { hp: 55, atk: 55, def: 50, spd: 55, spc: 65 }, // Eevee
    103: { hp: 65, atk:130, def: 60, spd: 65, spc:110 }, // Flareon
    104: { hp: 65, atk: 65, def: 60, spd:130, spc:110 }, // Jolteon
    105: { hp:130, atk: 65, def: 60, spd: 65, spc:110 }, // Vaporeon
    106: { hp: 70, atk: 80, def: 50, spd: 35, spc: 35 }, // Machop
    107: { hp: 40, atk: 45, def: 35, spd: 55, spc: 40 }, // Zubat
    108: { hp: 35, atk: 60, def: 44, spd: 55, spc: 40 }, // Ekans
    109: { hp: 35, atk: 70, def: 55, spd: 25, spc: 55 }, // Paras
    110: { hp: 65, atk: 65, def: 65, spd: 90, spc: 50 }, // Poliwhirl
    111: { hp: 90, atk: 85, def: 95, spd: 70, spc: 70 }, // Poliwrath
    112: { hp: 40, atk: 35, def: 30, spd: 50, spc: 20 }, // Weedle
    113: { hp: 45, atk: 25, def: 50, spd: 35, spc: 25 }, // Kakuna
    114: { hp: 65, atk: 80, def: 40, spd: 75, spc: 45 }, // Beedrill
    116: { hp: 60, atk:110, def: 70, spd:100, spc: 60 }, // Dodrio
    117: { hp: 65, atk:105, def: 60, spd: 95, spc: 60 }, // Primeape
    118: { hp: 35, atk: 80, def: 50, spd:120, spc: 70 }, // Dugtrio
    119: { hp: 70, atk: 65, def: 60, spd: 90, spc: 90 }, // Venomoth
    120: { hp: 90, atk: 70, def: 80, spd: 70, spc: 95 }, // Dewgong
    123: { hp: 45, atk: 30, def: 35, spd: 45, spc: 20 }, // Caterpie
    124: { hp: 50, atk: 20, def: 55, spd: 30, spc: 25 }, // Metapod
    125: { hp: 60, atk: 45, def: 50, spd: 70, spc: 80 }, // Butterfree
    126: { hp: 90, atk:130, def: 80, spd: 55, spc: 65 }, // Machamp
    128: { hp: 80, atk: 82, def: 78, spd: 85, spc: 80 }, // Golduck
    129: { hp: 85, atk: 73, def: 70, spd: 67, spc:115 }, // Hypno
    130: { hp: 75, atk: 80, def: 70, spd: 90, spc: 75 }, // Golbat
    131: { hp:106, atk:110, def: 90, spd:130, spc:154 }, // Mewtwo
    132: { hp:160, atk:110, def: 65, spd: 30, spc: 65 }, // Snorlax
    133: { hp: 20, atk: 10, def: 55, spd: 80, spc: 20 }, // Magikarp
    136: { hp:105, atk:105, def: 75, spd: 50, spc: 65 }, // Muk
    138: { hp: 55, atk:130, def:115, spd: 75, spc: 50 }, // Kingler
    139: { hp: 50, atk: 95, def:180, spd: 70, spc: 85 }, // Cloyster
    141: { hp: 60, atk: 50, def: 70, spd:140, spc: 80 }, // Electrode
    142: { hp: 95, atk: 70, def: 73, spd: 60, spc: 85 }, // Clefable
    143: { hp: 65, atk: 90, def:120, spd: 60, spc: 85 }, // Weezing
    144: { hp: 65, atk: 70, def: 60, spd:115, spc: 65 }, // Persian
    145: { hp: 60, atk: 80, def:110, spd: 45, spc: 50 }, // Marowak
    147: { hp: 45, atk: 50, def: 45, spd: 95, spc:115 }, // Haunter
    148: { hp: 25, atk: 20, def: 15, spd: 90, spc:105 }, // Abra
    149: { hp: 55, atk: 50, def: 45, spd:120, spc:135 }, // Alakazam
    150: { hp: 63, atk: 60, def: 55, spd: 71, spc: 50 }, // Pidgeotto
    151: { hp: 83, atk: 80, def: 75, spd: 91, spc: 70 }, // Pidgeot
    152: { hp: 60, atk: 75, def: 85, spd:115, spc:100 }, // Starmie
    153: { hp: 45, atk: 49, def: 49, spd: 45, spc: 65 }, // Bulbasaur
    154: { hp: 80, atk: 82, def: 83, spd: 80, spc:100 }, // Venusaur
    155: { hp: 80, atk: 70, def: 65, spd:100, spc:120 }, // Tentacruel
    157: { hp: 45, atk: 67, def: 60, spd: 63, spc: 50 }, // Goldeen
    158: { hp: 80, atk: 92, def: 65, spd: 68, spc: 80 }, // Seaking
    163: { hp: 50, atk: 85, def: 55, spd: 90, spc: 65 }, // Ponyta
    164: { hp: 65, atk:100, def: 70, spd:105, spc: 80 }, // Rapidash
    165: { hp: 30, atk: 56, def: 35, spd: 72, spc: 25 }, // Rattata
    166: { hp: 55, atk: 81, def: 60, spd: 97, spc: 50 }, // Raticate
    167: { hp: 61, atk: 72, def: 57, spd: 65, spc: 55 }, // Nidorino
    168: { hp: 70, atk: 62, def: 67, spd: 56, spc: 55 }, // Nidorina
    169: { hp: 40, atk: 80, def:100, spd: 20, spc: 30 }, // Geodude
    170: { hp: 65, atk: 60, def: 70, spd: 40, spc: 75 }, // Porygon
    171: { hp: 80, atk:105, def: 65, spd:130, spc: 60 }, // Aerodactyl
    173: { hp: 25, atk: 35, def: 70, spd: 45, spc: 95 }, // Magnemite
    176: { hp: 39, atk: 52, def: 43, spd: 65, spc: 50 }, // Charmander
    177: { hp: 44, atk: 48, def: 65, spd: 43, spc: 50 }, // Squirtle
    178: { hp: 58, atk: 64, def: 58, spd: 80, spc: 65 }, // Charmeleon
    179: { hp: 59, atk: 63, def: 80, spd: 58, spc: 65 }, // Wartortle
    180: { hp: 78, atk: 84, def: 78, spd:100, spc: 85 }, // Charizard
    185: { hp: 45, atk: 50, def: 55, spd: 30, spc: 75 }, // Oddish
    186: { hp: 60, atk: 65, def: 70, spd: 40, spc: 85 }, // Gloom
    187: { hp: 75, atk: 80, def: 85, spd: 50, spc:100 }, // Vileplume
    188: { hp: 50, atk: 75, def: 35, spd: 40, spc: 70 }, // Bellsprout
    189: { hp: 65, atk: 90, def: 50, spd: 55, spc: 85 }, // Weepinbell
    190: { hp: 80, atk:105, def: 65, spd: 70, spc:100 }, // Victreebel
};
