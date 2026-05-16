# Gen 1 PC Box Reading

Reference for reading Pokémon party and PC box data from a Gen 1 save file as loaded by
the emulator (`MBCRam` array in the save state JSON).

---

## SRAM layout

`MBCRam` is a flat 32 KB (`0x8000`) array of four 8 KB banks:

| Bank | Flat offset | Contents |
|------|-------------|----------|
| 0 | `0x0000` | Sprite buffers, Hall of Fame |
| 1 | `0x2000` | Main save data, party, current-box buffer |
| 2 | `0x4000` | PC boxes 1–6 |
| 3 | `0x6000` | PC boxes 7–12 |

All offsets below are into the flat `MBCRam` array.

---

## Party — `0x2F2C`

```
[0x00]          count (0–6)
[0x01–0x07]     species ID list (one byte per slot) + 0xFF terminator
[0x08 + i×44]   44-byte Pokémon data for slot i  (see Pokémon data formats below)
[0x08 + 6×44 + i×11]         OT name for slot i (11 bytes, Gen 1 charset, 0x50-terminated)
[0x08 + 6×44 + 6×11 + i×11]  nickname for slot i (11 bytes)
```

Level for a party Pokémon is at `data + 0x21` (byte 33 of the 44-byte block).

---

## PC box structure

Each box is `0x462` bytes. Boxes 1–6 live in bank 2 starting at `0x4000`; boxes 7–12
live in bank 3 starting at `0x6000`:

```
box 1  → 0x4000
box 2  → 0x4462
box 3  → 0x48C4
…
box 7  → 0x6000
box 8  → 0x6462
…
```

Layout of one box:

```
[0x000]             count (0–20)
[0x001–0x015]       species ID list (20 slots) + 0xFF terminator + 1 padding byte
[0x016]             (padding)
[0x017 + i×33]      33-byte box Pokémon data for slot i
[0x017 + 20×33 + i×11]         OT name for slot i (11 bytes)
[0x017 + 20×33 + 20×11 + i×11] nickname for slot i (11 bytes)
```

> **Note:** In code the data offset is written as `base + 22 + i×33` because
> `1 (count) + 20 (species list) + 1 (terminator) + 0 (padding counted separately) = 22`.
> The 0x017 form and the 22 form refer to the same position.

Level for a box Pokémon is at `data + 0x03`.

---

## Current-box double-buffer

Gen 1 only keeps **one box active in memory at a time**. When the player opens the PC
and selects a box, the game:

1. Writes the departing box's buffer back to its banked slot (bank 2 or 3).
2. Copies the new box's banked data into the dedicated buffer at `0x30C0`.
3. Updates `wCurrentBoxNum` at `0x284C`.

As a result, **the banked slot for the active box is always stale** — its live data is
in the buffer at `0x30C0`, not in the bank.

### `wCurrentBoxNum` — `0x284C` (2 bytes)

| Bits | Meaning |
|------|---------|
| 0–6 | Box number, **0-indexed** (0 = Box 1, 11 = Box 12) |
| 7 | Set once the player has ever changed boxes; 0 on a fresh save |

To extract the box index: `sram[0x284C] & 0x7F` (or `& 0x0F` — same result for 0–11).

**Example:** active box is Box 2 on a save where the player has previously switched
boxes → `sram[0x284C] = 0x81` (`0x80 | 0x01`).

### Reading all 12 boxes correctly

```typescript
const CURRENT_BOX_BASE = 0x30C0;       // active box lives here
const currentBoxIdx = sram[0x284C] & 0x7F;

const BOX_SIZE = 0x462;
for (let b = 0; b < 12; b++) {
    const bankBase = b < 6 ? 0x4000 : 0x6000;
    const boxIdx   = b < 6 ? b      : b - 6;
    const base = b === currentBoxIdx
        ? CURRENT_BOX_BASE               // live data
        : bankBase + boxIdx * BOX_SIZE;  // banked (non-active) data
    // … read count, species list, Pokémon data from `base`
}
```

### Current-box buffer layout — `0x30C0`

Identical to the per-box structure above; size is exactly `0x462` bytes (`0x30C0`–`0x3521`).

---

## Pokémon data formats

### Box form — 33 bytes (permanent data)

```
0x00  species index
0x01  current HP (2 bytes, big-endian)
0x03  level
0x04  status condition
0x05  type 1
0x06  type 2
0x07  catch rate / held item
0x08  move 1 index
0x09  move 2 index
0x0A  move 3 index
0x0B  move 4 index
0x0C  OT ID (2 bytes, big-endian)
0x0E  experience (3 bytes, big-endian)
0x11  HP EV (2 bytes)
0x13  Attack EV (2 bytes)
0x15  Defense EV (2 bytes)
0x17  Speed EV (2 bytes)
0x19  Special EV (2 bytes)
0x1B  IV data (2 bytes — 4 bits per stat, see below)
0x1D  move 1 PP  (bits 7–6: PP Ups applied; bits 5–0: current PP)
0x1E  move 2 PP
0x1F  move 3 PP
0x20  move 4 PP
```

### Party extension — 11 additional bytes (derived, bytes 33–43)

```
0x21  level (recalculated copy)
0x22  max HP (2 bytes)
0x24  attack (2 bytes)
0x26  defense (2 bytes)
0x28  speed (2 bytes)
0x2A  special (2 bytes)
```

These 11 bytes are **derived** from the 33 permanent bytes and recalculated by the game
every time a Pokémon moves from a box into the party. Only the 33-byte box form needs to
be stored; the rest is recalculated on port-in.

### IV extraction

IVs are packed into the 2-byte field at `0x1B`:

```
attackIV  = (iv >> 12) & 0xF
defenseIV = (iv >>  8) & 0xF
speedIV   = (iv >>  4) & 0xF
specialIV =  iv        & 0xF
hpIV      = (attackIV & 1) << 3 | (defenseIV & 1) << 2
           | (speedIV  & 1) << 1 | (specialIV & 1)
```

---

## Checksum

Covers bytes `0x2598`–`0x3522` inclusive. Algorithm:

```
checksum = (~sum(sram[0x2598..0x3522])) & 0xFF
```

Written to `0x3523`. Must be recalculated after any write to bank 1.
Implemented in `SRAMParser.calculateMainDataChecksum()`.

---

## Common pitfalls

| Pitfall | Detail |
|---------|--------|
| Active box missing | The banked slot for the active box is stale; always read it from `0x30C0` instead, selected via `sram[0x284C] & 0x7F`. |
| `wCurrentBoxNum` flag bit | Bit 7 of `0x284C` is a "has ever changed boxes" flag, not part of the box number. Mask it off before comparing. |
| Party level vs box level | Party Pokémon level is at `data + 0x21`; box Pokémon level is at `data + 0x03`. Different offsets, different structs. |
| OT ID endianness | OT ID at `0x0C` is big-endian in the Pokémon data, but the Player ID field at `0x2605` in bank 1 is written little-endian by the connect route. |
| `sramParser.ts` field offsets | The parser allocates 72 bytes for Box Items (`0x27E6`), but the actual field is 104 bytes (`0x68`). This shifts `currentBoxNumber` in the parser 32 bytes early (`0x285C` instead of `0x284C`). Don't use `parseMainData().currentBoxNumber`; read `sram[0x284C]` directly. |
