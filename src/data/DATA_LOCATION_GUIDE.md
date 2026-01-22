# How Rhydon Locates Data in Pokemon RBY Save Files

## Overview

**Important:** This application works with **SAVE FILES** (`.sav` or `.dat` files), not ROM files. The save file is a binary file that contains all your game progress, Pokemon, items, etc.

## How Data Location Works

The application uses **hardcoded memory addresses** (called "offsets") to find different types of data within the save file. These offsets are like street addresses - they tell the program exactly where in the file each piece of data is stored.

### Key Concept: Offsets

An offset is a number (in hexadecimal, like `0x2598`) that represents a position in the save file, counting from the beginning (byte 0). Think of it like:
- The save file is a long street
- Each byte is a house
- The offset tells you which house number to go to

## Where Data Locations Are Defined

All data locations are defined in **`Rhydon/SAV1.cs`**. This file contains two classes:

1. **`USAV1`** - For US/European save files
2. **`JSAV1`** - For Japanese save files

Each class defines the same data types but with different offsets because Japanese and US saves have slightly different layouts.

## Types of Data and Their Locations

### 1. Player Information

Located at these offsets:

**US Version:**
- **Player Name (OT_Name)**: `0x2598` (11 bytes)
- **Rival Name**: `0x25F6` (11 bytes)
- **Trainer ID (TID)**: `0x2605` (2 bytes)
- **Money**: `0x25F3` (3 bytes)
- **Coins**: `0x2850` (2 bytes)

**Japanese Version:**
- **Player Name (OT_Name)**: `0x2598` (6 bytes)
- **Rival Name**: `0x25F1` (6 bytes)
- **Trainer ID (TID)**: `0x25FB` (2 bytes)
- **Money**: `0x25EE` (3 bytes)
- **Coins**: `0x2846` (2 bytes)

### 2. Pokedex Data

**US Version:**
- **Owned Pokemon**: `0x25A3` (bitfield - each bit represents one Pokemon)
- **Seen Pokemon**: `0x25B6` (bitfield)

**Japanese Version:**
- **Owned Pokemon**: `0x259E` (bitfield)
- **Seen Pokemon**: `0x25B1` (bitfield)

The Pokedex uses a **bitfield** - meaning each Pokemon is represented by a single bit (0 or 1) rather than a full byte. This is why 151 Pokemon can fit in just 19 bytes (151 bits ÷ 8 bits per byte = ~19 bytes).

### 3. Items

**US Version:**
- **Items in Bag**: `0x25C9` (variable length)
- **Items in PC**: `0x27E6` (variable length)

**Japanese Version:**
- **Items in Bag**: `0x25C4` (variable length)
- **Items in PC**: `0x27DC` (variable length)

Item lists start with a count byte, followed by pairs of (item ID, quantity) bytes.

### 4. Pokemon Data

#### Party Pokemon

**US Version:**
- **Party Pokemon**: `0x2F2C` (up to 6 Pokemon)

**Japanese Version:**
- **Party Pokemon**: `0x2ED5` (up to 6 Pokemon)

Each Pokemon in the party is stored as a **44-byte structure** (`PK1.SIZE_PARTY = 0x2C`). The structure includes:
- Species, level, stats, moves, experience, etc.

#### Boxed Pokemon

**US Version:**
- **Current Box**: `0x30C0`
- **All Boxes**: Starting at `0x4000`, then:
  - Box 1: `0x4000`
  - Box 2: `0x4462`
  - Box 3: `0x48C4`
  - Box 4: `0x4D26`
  - Box 5: `0x5188`
  - Box 6: `0x55EA`
  - Box 7: `0x6000`
  - Box 8: `0x6462`
  - Box 9: `0x68C4`
  - Box 10: `0x6D26`
  - Box 11: `0x7188`
  - Box 12: `0x75EA`

**Japanese Version:**
- **Current Box**: `0x302D`
- **All Boxes**: Starting at `0x4000`, then:
  - Box 1: `0x4000`
  - Box 2: `0x4566`
  - Box 3: `0x4ACC`
  - Box 4: `0x5032`
  - Box 5: `0x6000`
  - Box 6: `0x6566`
  - Box 7: `0x6ACC`
  - Box 8: `0x7032`

Each boxed Pokemon is stored as a **33-byte structure** (`PK1.SIZE_STORED = 0x21`).

#### Daycare Pokemon

**US Version:**
- **Daycare**: `0x2CF4` (1 Pokemon)

**Japanese Version:**
- **Daycare**: `0x2CA7` (1 Pokemon)

### 5. Game Settings

**US Version:**
- **Options**: `0x2601` (1 byte containing battle effects, battle style, sound, text speed)
- **Badges**: `0x2602` (1 byte - each bit represents one badge)
- **Time Played**: `0x2CED` (3 bytes: hours, minutes, seconds)
- **Current Box Index**: `0x284C` (which box is currently selected)

**Japanese Version:**
- **Options**: `0x25F7` (1 byte)
- **Badges**: `0x25F8` (1 byte)
- **Time Played**: `0x2CA0` (3 bytes)
- **Current Box Index**: `0x2842` (1 byte)

### 6. Checksum

**US Version:**
- **Checksum**: `0x3523` (1 byte)

**Japanese Version:**
- **Checksum**: `0x3594` (1 byte)

The checksum is calculated from bytes `0x2598` to the checksum offset. It's used to verify the save file hasn't been corrupted.

## How Pokemon Data is Structured

Each Pokemon is stored as a byte array. The structure is defined in **`PK1.cs`**:

### Party Pokemon Structure (44 bytes = 0x2C)

```
Offset | Size | Field
-------|------|------
0x00   | 1    | Species ID
0x01   | 2    | Current HP
0x03   | 1    | Level
0x04   | 1    | Status Condition
0x05   | 1    | Type 1
0x06   | 1    | Type 2
0x07   | 1    | Catch Rate
0x08   | 1    | Move 1
0x09   | 1    | Move 2
0x0A   | 1    | Move 3
0x0B   | 1    | Move 4
0x0C   | 2    | Trainer ID
0x0E   | 3    | Experience (24-bit)
0x11   | 2    | HP Stat Experience
0x13   | 2    | Attack Stat Experience
0x15   | 2    | Defense Stat Experience
0x17   | 2    | Speed Stat Experience
0x19   | 2    | Special Stat Experience
0x1B   | 2    | DVs (Determinant Values) - packed into 16 bits
0x1D   | 1    | Move 1 PP + PP Up (bits 0-5: PP, bits 6-7: PP Up)
0x1E   | 1    | Move 2 PP + PP Up
0x1F   | 1    | Move 3 PP + PP Up
0x20   | 1    | Move 4 PP + PP Up
0x21   | 1    | Current Level (for party)
0x22   | 2    | Max HP (for party)
0x24   | 2    | Attack Stat (for party)
0x26   | 2    | Defense Stat (for party)
0x28   | 2    | Speed Stat (for party)
0x2A   | 2    | Special Stat (for party)
```

### Stored Pokemon Structure (33 bytes = 0x21)

Stored Pokemon (in boxes) are the same as party Pokemon but without the last 11 bytes (current level and calculated stats).

### Pokemon Names

Pokemon names are stored **separately** from the Pokemon data:
- **OT Name**: Stored after all Pokemon data in the list
- **Nickname**: Stored after OT names

For US saves: 11 bytes per name
For Japanese saves: 6 bytes per name

## How the Code Reads Data

### Example: Reading Player Name

```csharp
// In SAV1.cs, line 55-64
public string OT_Name
{
    get { 
        // Skip to offset OT_NAME_OFS, take STR_LEN bytes
        return RBY_Encoding.GetString(
            Data.Skip(OT_NAME_OFS).Take(STR_LEN).ToArray(), 
            IS_JAPANESE
        ); 
    }
}
```

This code:
1. Takes the raw save file data (`Data`)
2. Skips to the offset (`OT_NAME_OFS` = `0x2598`)
3. Takes the next `STR_LEN` bytes (11 for US, 6 for JP)
4. Converts those bytes to a string using Pokemon's special encoding

### Example: Reading a Pokemon

```csharp
// In PokemonList.cs, line 59-64
int base_ofs = 2 + Capacity;
byte[] dat = Data.Skip(base_ofs + Entry_Size*i).Take(Entry_Size).ToArray();
Pokemon[i] = new PK1(dat);
```

This code:
1. Calculates where Pokemon data starts (`base_ofs`)
2. Skips to the specific Pokemon's position (`Entry_Size * i`)
3. Takes the Pokemon's data (`Entry_Size` bytes)
4. Creates a `PK1` object from that data

## How Pokemon Stats Are Calculated

Pokemon stats aren't stored directly - they're **calculated** from:
- Base stats (from `Tables.cs` - `ID_To_Base_Stats`)
- Level
- DVs (Determinant Values - like IVs)
- Stat Experience (like EVs)

See `PK1.cs` lines 349-364 for the calculation formula.

## Summary

1. **Save files are binary files** - just a sequence of bytes
2. **Offsets are addresses** - they tell you where data is located
3. **Different data types** have different offsets (player name, Pokemon, items, etc.)
4. **US and Japanese saves** have different layouts (different offsets)
5. **The code reads data** by jumping to an offset and reading a specific number of bytes
6. **Pokemon data structures** are well-defined byte layouts (44 bytes for party, 33 for stored)

The application doesn't need to "search" for data - it knows exactly where everything is based on these hardcoded offsets!
