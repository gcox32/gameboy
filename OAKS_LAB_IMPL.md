# Oak's Lab — Implementation Reference

How the cross-game Pokémon transfer system actually works, end to end.

---

## Concept

A Pokémon is extracted from one save file, held in a server-side **Ranch**, and injected into another save file. It exists exactly once — it is never copied. The source save has the Pokémon removed; the destination save has it added. The Ranch is the transit state between games.

Two UI surfaces:
- **Oak's Lab** (`/lab`) — extract tab (Leave) and port-in tab (Take)
- **Oak's Ranch** (`/ranch`) — read-only gallery of all currently stashed Pokémon

---

## Prerequisites: Connect

Before any transfer can happen, a save state must be **connected** to Oak's Lab. Connection does two things:

1. **Generates an `appTrainerId`** (16-bit, `0–65535`) on the user's `User` record if they don't already have one. This ID is permanent and unique across all users — it is the user's identity inside every game they connect.

2. **Stamps the save file.** `stampTrainerId()` in `sramWriter.ts` does three things atomically:
   - Writes `appTrainerId` to `0x2605–0x2606` (little-endian) — the Player ID field, so all future catches get the app Trainer ID as their OT ID.
   - Iterates every occupied party slot (44-byte form) and overwrites the OT ID bytes at data+`0x0C–0x0D` (big-endian).
   - Iterates every occupied slot in all 12 PC boxes (33-byte form) and overwrites the same bytes. The current box mirror is synced to its banked slot afterward.

   This ensures existing Pokémon already in the save are owned by the same trainer identity as newly caught ones, making them fully native rather than appearing as trades.

The Bank 1 checksum (`0x3523`) is recalculated after the write. The patched save is uploaded to a new blob; the old blob is deleted. `SaveState.connected` is set to `true` via `updateOne/$set` *before* the blob operation so the record survives a mid-flight failure.

Connect is **idempotent** — calling it on an already-connected save returns immediately with no changes.

**Route:** `POST /api/save-states/[id]/connect`

---

## Flow 1: Extract (Leave a Pokémon)

### UI (`ExtractTab` in `OaksLab.tsx`)

1. User selects a game, then a save state. Save states are filtered to connected-only for the actual operation (non-connected saves show a Connect prompt instead).
2. The `.sav` blob is fetched (`cache: 'no-store'`) and parsed client-side by `parseSaveFile()`. This reads all party slots and all 12 PC boxes directly from the raw SRAM bytes — no emulator involvement.
3. Pokémon are displayed as a checkbox grid. The user selects one or more across any combination of party/boxes, then clicks "Send to Ranch".
4. On success the API returns `updatedFilePath` — the URL of the freshly-patched save. The tab immediately reloads its display from that URL (not from the stale `currentSave.filePath`) so the extracted slots disappear in real time. `fetchSaveStates` runs in parallel to sync the DB-backed URL into component state.

### API (`POST /api/pokemon/stored`)

1. Fetches the `.sav` blob for the save state.
2. Sorts the requested slots **high-to-low** (by slot index within each box, boxes high-to-low before party) so that clearing one slot doesn't shift the indices of later slots in the same pass.
3. For each slot:
   - `extractFromSRAM()` — reads the 33-byte box-form data plus OT name, nickname, OT ID, species, and level directly from SRAM offsets.
   - `clearSlot()` — removes the Pokémon: zeroes its data block, shifts remaining entries in the species list and data arrays left, decrements the count byte, zeroes the OT/nick entries. Recalculates the Bank 1 checksum.
   - Creates a `StoredPokemon` document (`status: 'stashed'`).
4. Uploads the fully-patched SRAM as a new blob (`addRandomSuffix: true`), updates `SaveState.filePath` via `updateOne/$set`, deletes the old blob.
5. Returns `{ created, updatedSaveStateId, updatedFilePath }`.

### Party vs box extraction

- **Party (44-byte form):** Only the first 33 bytes (the permanent/box form) are stored. Byte `0x03` (box level) is overwritten with byte `0x21` (party level) before storing, because `0x03` may be stale for Pokémon that levelled up without being deposited.
- **Box (33-byte form):** Read directly.

---

## Flow 2: Port-In (Take a Pokémon)

### UI (`PortInTab` in `OaksLab.tsx`)

1. User selects a target game and save state (must be connected).
2. When a connected save state is selected, the `.sav` blob is fetched and parsed to populate **occupancy** — the count of Pokémon already in party and each box. This is shown on the destination buttons (`Party (3/6)`, `Box 1 (2/20)`) and used to determine the next available slot.
3. User picks a Pokémon from their Ranch grid, then picks Party or a specific PC Box. Full boxes and a full party are disabled.
4. The send bar shows exactly where the Pokémon will land: *"Box 2 — slot 3 (next available)"*. The slot number is always `count + 1` — the server always appends rather than inserting at a specific index.
5. On success the API returns `updatedFilePath`. The tab re-fetches from that URL to refresh both the portedSave preview and occupancy counts. `fetchSaveStates` also runs to keep the stored URL in sync.

### API (`POST /api/pokemon/stored/[id]/port`)

1. Verifies the `StoredPokemon` belongs to the authenticated user and has `status: 'stashed'`.
2. Verifies the target `SaveState` is connected.
3. Fetches the target `.sav` blob.
4. Calls `injectPokemon()`:
   - Overwrites OT ID bytes (`0x0C–0x0D`) with `appTrainerId` — the Pokémon is now fully owned by the receiving game.
   - Clears status byte (`0x04`) to `0x00` and sets current HP (`0x01–0x02`) to the recalculated max HP — the Pokémon arrives healed.
   - Appends to the target slot (party or box), increments the count byte, inserts the species ID into the species list, writes OT name and nickname.
   - Recalculates the Bank 1 checksum.
5. Uploads patched blob (`addRandomSuffix: true`), updates `SaveState.filePath` via `updateOne/$set`, deletes old blob.
6. Sets `StoredPokemon.status = 'in_game'`, `currentGameId = targetGameId`.
7. Returns `{ pokemon, updatedSaveStateId, updatedFilePath }`.

---

## Gen 1 SRAM: Current Box Mirror

The most important implementation detail for box operations.

Gen 1 keeps two copies of the "current" PC box in SRAM:

| Location | Offset | Description |
|---|---|---|
| Mirror buffer | `0x30C0` | Live working copy used while the game is running |
| Banked slot | Bank 2–3 (`0x4000` / `0x6000` + box index × `0x462`) | Persistent copy written on save or box switch |

`wCurrentBoxNum` at `0x284C` (low nibble) tells which box is active.

**The trap:** Gen 1's `OpenBox` routine repopulates the mirror from the banked slot whenever the player enters the PC. If you write only to the mirror, the change survives until the player opens the PC — at which point the banked slot wins and the change is silently discarded.

**The fix (`sramWriter.ts`):** After any write to the current box (both `clearBoxSlot` and `injectBox`), `syncCurrentBoxToBanked()` copies the full mirror (`0x462` bytes) to the banked slot. Both locations are always kept in sync after every Oak's Lab write.

**Reading** uses the mirror for the current box (live data) and the banked slot for all other boxes — this is still correct for reads since the mirror is always fresher than the banked slot while the game is running.

---

## Blob Storage

All save-related blobs follow a human-readable path scheme defined in `src/utils/blobPaths.ts`:

```
saves/{email}/{game-slug}/{save-slug}-{saveId[0..8]}/save-{random}.sav
```

Example:
```
saves/gcoxexcel_at_gmail-com/pokemon-red/main-run-a3f8b21c/save-eWNkrcQi.sav
```

- **`{email}`** — `@` → `_at_`, `.` → `-`
- **`{game-slug}`** — lowercased, non-alphanumeric runs → `-`
- **`{save-slug}-{id[0..8]}`** — save title slug + first 8 chars of MongoDB ObjectId
- **`save-{random}.sav`** — Vercel Blob's `addRandomSuffix: true` ensures every write produces a unique URL (no CDN staleness)

Every write: upload new blob → `SaveState.updateOne($set, filePath)` → delete old blob. The `del()` is fire-and-forget (failure is non-fatal — at most one orphaned blob; data is never lost because the DB was updated first).

Security: both `/api/blob/upload` and `DELETE /api/blob` accept paths containing either `session.user.id` (legacy) or the sanitized email slug.

---

## Data Model

### `SaveState` (additions)
| Field | Type | Notes |
|---|---|---|
| `connected` | `boolean` | `false` until Connect is run. Gate for all extract/port operations. |
| `filePath` | `string` | URL of current blob. Updated on every Oak's Lab write. Default `''`. |

### `StoredPokemon`
| Field | Notes |
|---|---|
| `userId` | Owner |
| `sourceGameId` | Game it was extracted from |
| `generation` | Always `1` currently |
| `sourceSlot` | `{ location, boxNumber?, slotIndex }` — where it lived |
| `speciesIndex` | Raw game byte (not Pokédex number) |
| `speciesName` | Decoded at extract time |
| `nickname` / `otName` | Decoded Gen 1 charset strings |
| `otId` | 2-byte original trainer ID |
| `level` | Extracted for display/filtering |
| `rawBoxData` | **33 bytes** — canonical permanent form. Extended stats are recalculated on port-in. |
| `status` | `'stashed'` = at Ranch; `'in_game'` = lives in `currentGameId`'s save |
| `currentGameId` | Set on port-in, cleared conceptually on re-extraction |

### `User` (addition)
| Field | Notes |
|---|---|
| `appTrainerId` | 16-bit, generated on first Connect, permanent. Written to every connected save's Player ID field. |

---

## File Map

| Layer | File | Responsibility |
|---|---|---|
| UI | `src/components/oaks-lab/OaksLab.tsx` | Extract tab, port-in tab, SRAM parsing for display |
| UI | `src/components/ranch/OaksRanch.tsx` | Read-only Ranch gallery |
| API | `src/app/api/save-states/[id]/connect/route.ts` | Connect flow |
| API | `src/app/api/pokemon/stored/route.ts` | GET (list Ranch), POST (extract) |
| API | `src/app/api/pokemon/stored/[id]/route.ts` | DELETE (release) |
| API | `src/app/api/pokemon/stored/[id]/port/route.ts` | POST (port-in) |
| SRAM read | `src/utils/pokemon/extract.ts` | `extractFromSRAM()` — reads party/box slots into `RawExtractedPokemon` |
| SRAM write | `src/utils/sramWriter.ts` | `clearSlot()`, `injectPokemon()`, current-box mirror↔banked sync |
| SRAM parse | `src/utils/sramParser.ts` | `SRAMParser`, `TextEncoder` (Gen 1 charset), checksum |
| Stats | `src/utils/pokemon/stats.ts` | `calcGen1Stats()` — recalculates max HP and battle stats from 33-byte box data |
| Storage | `src/utils/blobPaths.ts` | `saveBlobPath()`, `gameBlobDir()`, `sanitizeEmail()`, `slugify()` |
| Models | `src/models/StoredPokemon.ts` | Mongoose schema |
| Models | `src/models/SaveState.ts` | `connected`, `filePath` (default `''`) |
| Models | `src/models/User.ts` | `appTrainerId` |

---

## Stat Recalculation (Gen 1 formulas)

Used both for display (Ranch stat block) and for expanding 33-byte box data into the 44-byte party form on port-in:

```
stat  = floor(((base + IV) * 2 + floor(sqrt(EV))) * level / 100) + 5
maxHP = floor(((base_HP + IV) * 2 + floor(sqrt(HP_EV))) * level / 100) + level + 10
```

IV packing (2 bytes at offset `0x1B`):
```
attackIV  = (iv >> 12) & 0xF
defenseIV = (iv >> 8)  & 0xF
speedIV   = (iv >> 4)  & 0xF
specialIV =  iv        & 0xF
hpIV      = (atk & 1) << 3 | (def & 1) << 2 | (spd & 1) << 1 | (spc & 1)
```

Base stats are bundled as a static table in `src/utils/pokemon/baseStats.ts` (all 151 Gen 1 Pokémon, keyed by species index).

---

## Healing on Port-In

Before writing the Pokémon data to the destination save:
- Status condition (`0x04`) → `0x00` (clears poison, sleep, paralysis, etc.)
- Current HP (`0x01–0x02`) → recalculated `maxHP`

The Pokémon always arrives at the destination at full health with no status conditions.
