The save data structure for Generation I is stored in the cartridge's volatile battery-backed RAM chip (SRAM), or as a ".sav" file by most emulators. The structure consists of 32 KB of data divided between 4 banks each 8KB, or 0x2000, and overall contains potentially hundreds of variables, though there are quite a few areas that are either completely left alone, only read from, or only written to. There are also a number of areas that are only used in certain game states that can't be saved to, including various runtime-only data.

Most areas can freely be written to with custom data or at the very least cleared out. Most of these areas will not be altered by the game unless the "Clear Save Dialog" is triggered on the title screen. Some sections of the data will load untouched into the in-game memory during gameplay and re-saved back on each save.

Sections of the data are protected with a simple integrity check using a checksum to detect data corruption in cases such as the power being lost during the saving process. PC boxes have additional checksums for each box's contents on the bank in addition to the normal whole-bank checksum. The Hall of Fame is the only section of used data which doesn't have a checksum and furthermore lies on an unusual bank number because it's so large.

# Save Data Structure

_Note: These values apply to the North American Pokémon Red, Blue, and Yellow games. They could be different for other releases._

The 32KiB save data, equal to 0x8000 bytes, is divided into 4 banks, each 8KiB in size, equal to 0x2000 bytes.\

## Bank Overview


| Bank |  Offset  |         Name           |
|------|----------|-----------------------|
|  0   | 0x0000   | Scratch and Hall of Fame |
|  1   | 0x2000   | Main                  |
|  2   | 0x4000   | Boxes 1-6             |
|  3   | 0x6000   | Boxes 7-12            |

### Bank 0 - Scratch and Hall of Fame

Consists of 3 sprite decompression buffers which seem to contain misc or varying data and the Hall of Fame because of its size (4,800 bytes).

### Bank 1 - Main

The primary bank for just about all data across the game, most is directly loaded into the in-game memory byte-by-byte. It contains hundreds of variables including a full byte-by-byte copy of the current PC box.

### Bank 2 - Boxes 1-6

Storage for PC boxes 1-6

### Bank 3 - Boxes 7-12

Storage for PC Boxes 7-12


## Save Data to In-Game Memory

| Offset   | Size   | Contents           | Copied To | Diff   |
|----------|--------|--------------------|-----------|--------|
| 0x2000   | 0x598  | Unused             |           |        |
| 0x2598   | 0xB    | Player Name        | 0xD158    | 0xABC0 |
| 0x25A3   | 0x789  | Main Data          | 0xD2F7    | 0xAD54 |
| 0x2D2C   | 0x200  | Sprite Data        | 0xC100    | 0x93D4 |
| 0x2F2C   | 0x194  | Party Data         | 0xD163    | 0xA237 |
| 0x30C0   | 0x462  | Current Box Data   | 0xDA80    | 0xA9C0 |
| 0x3522   | 0x1    | Tileset Type       | 0xD0D4    | 0x9BB2 |
| 0x3523   | 0x1    | Main Data Checksum |           |        |
| 0x3524   | 0xADC  | Unused             |           |        |

## Bank 1
This is the prime bank that all of the information is stored in that's ever needed or used in gameplay. Bank 2 and 3 really pull into data into Bank 1 when needed or are occasionally updated.

Furthermore most sections in this bank directly correspond byte-by-byte to their counterparts in in-game memory meaning you can apply a simple offset to translate the save data address to and from the in-game memory address. It also means unused areas in such sections will be loaded and available in-game and even saved back to save data.

As such, this is a mammoth of a bank and contains hundreds of variables.

The bank starts at address 0x2000 and is 0x2000 in size.

### Main Data

Goes over all the elements inside of Main Data, one of the most comprehensive areas in the save data. To translate the offset to in-game memory and/or back simply use the difference number mentioned in the above table, 0xAD54.

| Offset      | Size    | Contents                          |
|-------------|---------|-----------------------------------|
| 0x25A3      | 0x13    | Pokédex Owned                     |
| 0x25B6      | 0x13    | Pokédex Seen                      |
| 0x25C9      | 0x2A    | Bag Items                         |
| 0x25F3      | 0x3     | Money                             |
| 0x25F6      | 0xB     | Rival Name                        |
| 0x2601      | 0x1     | Game Options                      |
| 0x2602      | 0x1     | Badges                            |
| 0x2603      | 0x1     | Padding                           |
| 0x2604      | 0x1     | Letter Delay                      |
| 0x2605      | 0x2     | Player ID                         |
| 0x2607      | 0x1     | Music ID                          |
| 0x2608      | 0x1     | Music Bank                        |
| 0x2609      | 0x1     | Contrast ID                       |
| 0x260A      | 0x1     | Current Map                       |
| 0x260B      | 0x2     | UL Corner Cur View Tile Block Map Ptr |
| 0x260D      | 0x1     | Y Coord                           |
| 0x260E      | 0x1     | X Coord                           |
| 0x260F      | 0x1     | Y Block Coord                     |
| 0x2610      | 0x1     | X Block Coord                     |
| 0x2611      | 0x1     | Last Map                          |
| 0x2612      | 0x1     | Unused                            |
| 0x2613      | 0x1     | Current Tileset                   |
| 0x2614      | 0x1     | Map Height Blocks                 |
| 0x2615      | 0x1     | Map Width Block                   |
| 0x2616      | 0x2     | Map Data Pointer                  |
| 0x2618      | 0x2     | Map Text Pointer                  |
| 0x261A      | 0x2     | Map Script Pointer                |
| 0x261C      | 0x1     | Map Connections                   |
| 0x261D      | 0xB     | Map Connections North             |
| 0x2628      | 0xB     | Map Connections South             |
| 0x2633      | 0xB     | Map Connections West              |
| 0x263E      | 0xB     | Map Connections East              |
| 0x2649      | 0xB     | Sprite Set IDs                    |
| 0x2654      | 0x1     | Sprite Set ID                     |
| 0x2655      | 0x4     | Object Data Pointers Tmp          |
| 0x2659      | 0x1     | Out of Bounds Tile                |
| 0x265A      | 0x1     | Warp Count                        |
| 0x265B      | 0x80    | Warp Entries                      |
| 0x26DB      | 0x1     | Warp Destination ID                |
| 0x271C      | 0x1     | Pikachu FriendshipY               |
| 0x275B      | 0x80    | Padding                           |
| 0x275C      | 0x1     | Sign Count                        |
| 0x275D      | 0x20    | Sign Coords                       |
| 0x277D      | 0x10    | Sign Text IDs                     |
| 0x278D      | 0x1     | Sprite Count                      |
| 0x278E      | 0x1     | Y Offset since last special warp  |
| 0x278F      | 0x1     | X Offset since last special warp  |
| 0x2790      | 0x20    | Sprite Data                       |
| 0x27B0      | 0x20    | Sprite Extra Data                 |
| 0x27D0      | 0x1     | Map 2×2 Meta Height               |
| 0x27D1      | 0x1     | Map 2×2 Meta Width                |
| 0x27D2      | 0x2     | Map View VRAM Pointer             |
| 0x27D4      | 0x1     | Player Movement Direction         |
| 0x27D5      | 0x1     | Player Last Stop Direction        |
| 0x27D6      | 0x1     | Player Direction                  |
| 0x27D7      | 0x1     | Tileset Bank                      |
| 0x27D8      | 0x2     | Tileset Block Pointer             |
| 0x27DA      | 0x2     | Tileset GFX Pointer               |
| 0x27DC      | 0x2     | Tileset Collision Pointer         |
| 0x27DE      | 0x3     | Tileset Talking over Tiles        |
| 0x27E1      | 0x5     | Tileset Grass Tiles               |
| 0x27E6      | 0x68    | Box Items                         |
| 0x284C      | 0x2     | Current Box Number                |
| 0x284E      | 0x1     | Hall of Fame Record Count         |
| 0x284F      | 0x1     | Unused                            |
| 0x2850      | 0x2     | Slot Coins                        |
| 0x2852      | 0x20    | Missable Objects                  |
| 0x2872      | 0x7     | Padding                           |
| 0x2879      | 0x1     | Scratch                           |
| 0x287A      | 0x22    | Missable List                     |
| 0x289C      | 0x100   | Completed Scripts                 |
| 0x299C      | 0xE     | Owned Hidden Items                |
| 0x29AA      | 0x2     | Owned Hidden Coins                |
| 0x29AC      | 0x1     | Walking, Biking, or Surfing       |
| 0x29AD      | 0x10    | Padding                           |
| 0x29B7      | 0x2     | Towns visited                     |
| 0x29B9      | 0x2     | Safari Steps                      |
| 0x29BB      | 0x1     | Fossil Item Given ID              |
| 0x29BC      | 0x3     | Fossil Pokémon Result ID          |
| 0x29BF      | 0x1     | Enemy Pokémon or Trainer Class    |
| 0x29C0      | 0x1     | Player Jumping Y Screen Coords    |
| 0x29C1      | 0x1     | Rival first partner Pokémon       |
| 0x29C2      | 0x1     | Padding                           |
| 0x29C3      | 0x1     | Player first partner Pokémon      |
| 0x29C4      | 0x1     | Boulder Sprite Index              |
| 0x29C5      | 0x1     | Last Blackout Map                 |
| 0x29C6      | 0x1     | Destination Map                   |
| 0x29C7      | 0x1     | Unused                            |
| 0x29C8      | 0x1     | Tile in front of Boulder or Collision |
| 0x29C9      | 0x1     | Dungeon Warp Destination          |
| 0x29CA      | 0x1     | Which Dungeon Warp Used           |
| 0x29CB      | 0x9     | Unused                            |
| 0x29D4      | 0x1     | Various Flags 1                   |
| 0x29D5      | 0x1     | Padding                           |
| 0x29D6      | 0x1     | Defeated Gyms                     |
| 0x29D7      | 0x1     | Padding                           |
| 0x29D8      | 0x1     | Various Flags 2                   |
| 0x29D9      | 0x1     | Various Flags 3                   |
| 0x29DA      | 0x1     | Various Flags 4                   |
| 0x29DB      | 0x1     | Padding                           |
| 0x29DC      | 0x1     | Various Flags 5                   |
| 0x29DD      | 0x1     | Padding                           |
| 0x29DE      | 0x1     | Various Flags 6                   |
| 0x29DF      | 0x1     | Various Flags 7                   |
| 0x29E0      | 0x2     | Defeated Lorelei                  |
| 0x29E2      | 0x1     | Various Flags 8                   |
| 0x29E3      | 0x2     | In-Game Trades                    |
| 0x29E5      | 0x1     | Padding                           |
| 0x29E7      | 0x1     | Warped from Warp                  |
| 0x29E8      | 0x1     | Warped from Map                   |
| 0x29E9      | 0x2     | Padding                           |
| 0x29EB      | 0x1     | Card key door Y                   |
| 0x29EC      | 0x1     | Card key door X                   |
| 0x29ED      | 0x2     | Padding                           |
| 0x29EF      | 0x1     | First Trash Can Lock              |
| 0x29F0      | 0x1     | Second Trash Can Lock             |
| 0x29F1      | 0x2     | Padding                           |
| 0x29F3      | 0x140   | Completed Game Events             |
| 0x2B33 (U)  | 0x1     | Grass Rate                        |
| 0x2B33 (U)  | 0x1     | Link Trainer                      |
| 0x2B34      | 0xB     | Grass Pokémon                     |
| 0x2B3F (U)  | 0x9     | Grass Pokémon                     |
| 0x293F (U)  | 0x9     | Link Data                         |
| 0x2B48      | 0x1     | Enemy Party Count                 |
| 0x2B49      | 0x7     | Enemy Party Pokémon               |
| 0x2B50 (U)  | 0x1     | Water Rate                        |
| 0x2B51 (U)  | 0x1     | Water Pokémon                     |
| 0x2B50 (U)  | 0x1     | Enemy Partial Party Data          |
| 0x2CDC      | 0x2     | Trainer Header Pointer            |
| 0x2CDE      | 0x6     | Padding                           |
| 0x2CE4      | 0x1     | Opponent ID after wrong answer    |
| 0x2CE5      | 0x1     | Current Map Script                |
| 0x2CE6      | 0x7     | Padding                           |
| 0x2CED      | 0x1     | Play Time Hours                   |
| 0x2CEE      | 0x1     | Play Time Maxed                   |
| 0x2CEF      | 0x1     | Play Time Minutes                 |
| 0x2CF0      | 0x1     | Play Time Seconds                 |
| 0x2CF1      | 0x1     | Play Time Frames                  |
| 0x2CF2      | 0x1     | Safari Game Over                  |
| 0x2CF3      | 0x1     | Safari Ball Count                 |
| 0x2CF4      | 0x1     | Daycare In-Use                    |
| 0x2CF5      | 0xB     | Daycare Pokémon Name              |
| 0x2D00      | 0xB     | Daycare Original Trainer          |
| 0x2D0B      | 0x1     | Daycare Pokémon                   |


## Padding

Padding is essentially extra space assigned to an area in memory. In other words, the space is larger than the variables makeup and it could be at the start, end, middle, or some combination. It's unknown truly if the padding is ever used, there are certainly many ways for it to be used such as in various game unions with shared space. Therefore it could be considered possibly unused.

Pokédex Seen/Owned

Represents the specific Pokédex entries that have been either seen or owned during gameplay.

Pokémon are indexed by their usual Pokédex order, meaning the order is the same as in the National Pokédex. However, indexes begin counting at 0, rather than 1.

1 bit is used to represent whether a given Pokémon has been seen/owned. Bits are ordered within bytes from lowest to highest, starting with the first byte. Therefore, the exact bit can be extracted from the list using the following formula:

Bit = ( Data[ RoundDown(PokéNum / 8) ] / 2 ^ (PokéNum Mod 8) ) AND 1

Or in C-style code (shift occurs before other bitwise operations):

Bit = Data[PokéNum >> 3] >> (PokéNum & 7) & 1;

Example:

Let us say that we want to know whether #120 Staryu has been seen/owned:

PokéNum becomes 119, since it is 0-based.
The byte of the list in which bit 119 is located is = 119 / 8 = 14
The bit within that byte is = 119 Mod 8 = 7
Dividing the byte value by 2 ^ Bit, or shifting right by Bit, moves the bit to the least-significant position
Performing a bitwise AND with 1 will remove all but the least-significant bit
Entry #152:

As the bit lists are packed into 19 bytes, there is actually space for 152 entries. The last entry, bit 7 of byte 18, does in fact represent an entry #152 in the Pokédex. However, it is simply a copy of Kangaskhan.