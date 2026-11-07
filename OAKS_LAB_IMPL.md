# Oak's Lab — Implementation Reference

> Known issues and open follow-ups: see [OAKS_LAB_REVIEW.md](OAKS_LAB_REVIEW.md).

How the cross-game Pokémon transfer system actually works, end to end.

---

## Concept

A Pokémon is extracted from one save file, held in a server-side **Ranch**, and injected into another save file. The intent is that a moved Pokémon exists exactly once (see review #4 for the cases where that can still fail). The one deliberate exception is **Clone**, where the player chooses to stash a copy and keep the original in the game. The source save has the Pokémon removed; the destination save has it added. The Ranch is the transit state between games.

Two UI surfaces:
- **Oak's Lab** (`/lab`) — extract tab (Leave) and port-in tab (Take)
- **Oak's Lab, Edit tab** — changes a Pokémon where it sits in its save, without going through the Ranch
- **Oak's Ranch** (`/ranch`) — gallery of all currently stashed Pokémon, where they can also be released

---

## Prerequisites: Connect

Before any transfer can happen, a save state must be **connected** to Oak's Lab. The file must first pass `validateGen1Save()`, or Connect returns a 422 and changes nothing. Connection then does two things:

1. **Generates an `appTrainerId`** (16-bit, `0–65535`) on the user's `User` record if they don't already have one. This ID is permanent and unique across all users — it is the user's identity inside every game they connect.

2. **Stamps the save file.** `stampTrainerId()` in `sramWriter.ts` does three things atomically:
   - Writes `appTrainerId` to `0x2605–0x2606` (big-endian, high byte first) — the Player ID field, so all future catches get the app Trainer ID as their OT ID. The game compares Player ID and OT ID byte-for-byte, so both must use the same byte order. Saves stamped before this was fixed are re-stamped automatically by the extract and port routes (`hasTrainerId()` check).
   - Iterates every occupied party slot (44-byte form) and overwrites the OT ID bytes at data+`0x0C–0x0D` (big-endian).
   - Overwrites the same bytes on the Day Care Pokémon, if there is one.
   - Iterates every occupied slot in the PC boxes the game has set up (33-byte form) and overwrites the same bytes. The current box mirror is synced to its banked slot afterward.

   This ensures existing Pokémon already in the save are owned by the same trainer identity as newly caught ones, making them fully native rather than appearing as trades.

The Bank 1 checksum (`0x3523`) is recalculated after the write. The patched save is uploaded to a new blob, `filePath` and `connected: true` are set in one conditional `updateOne` (see Transfers below), and the old blob is deleted. If anything fails first, the save stays unconnected and can be retried.

Connect is **idempotent** — calling it on an already-connected save returns immediately with no changes.

**Route:** `POST /api/save-states/[id]/connect`

---

## Flow 1: Extract (Leave a Pokémon)

### UI (`ExtractTab.tsx`)

1. User selects a game, then a save state. Save states are filtered to connected-only for the actual operation (non-connected saves show a Connect prompt instead).
2. The `.sav` blob is fetched (`cache: 'no-store'`) and parsed client-side by `parseSaveFile()`. This reads all party slots and all 12 PC boxes directly from the raw SRAM bytes — no emulator involvement.
3. The user selects one or more Pokémon on the monitor, across any combination of party/boxes. The deck then offers two keys: **Clone** (copy to the Ranch, keep in the save) and **Send** (move). Send always asks first on the deck's screen, offering Clone again, before it removes anything. Clone is allowed even when it would select the whole party, since nothing leaves.
4. The request includes `expectedFilePath`, the file its slots were read from. Afterwards `fetchSaveStates` runs, and the tab reloads whenever `currentSave.filePath` changes, so the extracted slots disappear and a conflict shows what's there now.

### API (`POST /api/pokemon/stored`)

1. Returns a 409 if the save's file isn't `expectedFilePath`, then loads and validates the file.
2. `takeFromSave()` checks every slot is occupied, then works on a copy, high-to-low so that clearing one slot doesn't shift later ones. For each slot:
   - `extractFromSRAM()` — reads the 33-byte box-form data plus the raw OT name and nickname bytes, OT ID, species, and level.
   - `clearSlot()` — removes the Pokémon: zeroes its data block, shifts remaining entries in the species list and data arrays left, decrements the count byte, zeroes the OT/nick entries. Recalculates the Bank 1 checksum.
3. `sendToRanch()` uploads the new file, inserts the records as `transferring`, commits the file, marks the records `stashed`, then deletes the old blob.
4. Returns `{ created, updatedSaveStateId, updatedFilePath }`.
5. With `mode: 'clone'` it skips the party minimum and calls `cloneToRanch()` after the checks in step 1, which inserts `stashed` records and writes nothing to the save, so `updatedFilePath` is the unchanged file. Only the database changes, so there's no `transferring` marker to recover.

### Party vs box extraction

- **Party (44-byte form):** Only the first 33 bytes (the permanent/box form) are stored. Byte `0x03` (box level) is overwritten with byte `0x21` (party level) before storing, because `0x03` may be stale for Pokémon that levelled up without being deposited.
- **Box (33-byte form):** Read directly.

---

## Flow 2: Port-In (Take a Pokémon)

### UI (`PortInTab.tsx`)

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
   - Appends to the target slot (party or box), increments the count byte, inserts the species ID into the species list, writes the stored OT name and nickname bytes unchanged.
   - Recalculates the Bank 1 checksum.
5. `portToSave()` uploads the new file, atomically claims the record (`stashed` → `transferring`), commits the file, deletes the record, then deletes the old blob.
6. Returns `{ updatedSaveStateId, updatedFilePath }`.

---

## Flow 3: Edit IVs

### UI (`EditTab` and `IvEditor`)

The user picks a save and a Pokémon. The card has one 15-segment gauge per IV. Attack, Defense, Speed and Special each have a `+` button that raises them by 1, up to 15. Presses are a draft until Save changes, and Reset discards them.

**HP has no button** because the game doesn't store it. It's built from the lowest bit of the other four (`hpIVFrom()`), so it moves as they change, and can fall: Attack 13 → 14 lowers HP by 8. Falling segments are shown in red until saved.

### API (`POST /api/save-states/[id]/pokemon/ivs`)

Takes `{ slot, ivs, expectedFilePath }`. Returns a 409 if the save's file isn't `expectedFilePath`, then loads and validates the file, applies `setPokemonIVs()`, and uploads and commits as usual.

`setPokemonIVs()` writes the IVs to `0x1B–0x1C` and moves the other stored values by how much the IVs changed them, rather than recalculating outright:

- **Party stats** (`0x22–0x2B`). `BASE_STATS` is vanilla, so a full recalculation would be wrong for modded species. It would also overwrite values the game hasn't recalculated yet, such as a newly caught Pokémon's stats and stat exp not yet applied.
- **Current HP** (`0x01–0x02`). A fainted Pokémon stays fainted, and a healthy one stays above 0.

The game recalculates all of this itself on level up or withdrawal.

---

## Transfers

A move changes both the save file and the database, which can't be updated atomically (`src/lib/pokemonTransfer.ts`).

- **Version check.** Every write, from the Lab or the emulator, gets a unique URL, so `filePath` is the version. `commitSave()` only applies if the save still has the file it was read from. Otherwise the caller backs out and returns a 409.
- **Marker.** Records hold `status: 'transferring'` across the gap, with `transfer` recording the direction, the save, and its URL before and after.
- **Recovery.** `recoverStaleTransfers()` runs whenever the Ranch is listed and settles markers older than 5 minutes by comparing the save's current URL to those two:

| Direction | Save has the new file | Save has the old file | Save has moved on, or is gone |
|---|---|---|---|
| To Ranch | keep at Ranch | delete record | keep at Ranch |
| To save | delete record | keep at Ranch | keep at Ranch |

The last column can't be determined, so it keeps the Pokémon: a possible duplicate is better than a lost Pokémon.

---

## Gen 1 SRAM: Current Box Mirror

The most important implementation detail for box operations.

Gen 1 keeps two copies of the "current" PC box in SRAM:

| Location | Offset | Description |
|---|---|---|
| Mirror buffer | `0x30C0` | Live working copy used while the game is running |
| Banked slot | Bank 2–3 (`0x4000` / `0x6000` + box index × `0x462`) | Persistent copy written on save or box switch |

`wCurrentBoxNum` at `0x284C` (low nibble) tells which box is active.

The game loads the mirror when a save loads and writes it back on save. It only touches a box's banked slot when the player changes boxes: the old box is written out, then the new one read in. So the banked slot of the current box is stale, and nothing reads it while that box is current.

**Reading and writing** always use the mirror for the current box and the banked slot for the others (`boxBase()` in `gen1Save.ts`). After a write to the current box, `syncCurrentBoxToBanked()` also copies the mirror to its banked slot so the file doesn't hold two versions of that box. The game doesn't need this.

### Boxes the game hasn't set up

Bit 7 of `wCurrentBoxNum` records that the player has changed boxes at least once. Until then banks 2 and 3 are unused, and the first change wipes them. `isBoxAvailable()` limits the Lab to the current box until then.

---

## Emulator Saves

`useSaveState` uploads with `{ unique: true }`, then sends `PUT /api/save-states/[id]` with the new `filePath` and `expectedFilePath`, the file this session loaded. If the save has changed, the route returns a 409 with `currentFilePath` and the upload is deleted. The game pauses and `SaveConflictModal` offers:

- **Save as new** — opens the Save State dialog, leaving the changed save alone. The new save starts unconnected.
- **Save over it** — saves again with `expectedFilePath` set to `currentFilePath`. This undoes the other changes, so Pokémon moved in the meantime could be duplicated or lost.
- **Cancel** — nothing is written. Load State's list is refreshed so the current version can be loaded.

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
- **`save-{random}.sav`** — Vercel Blob's `addRandomSuffix: true` ensures every write produces a unique URL (no CDN staleness). Saves last written before emulator uploads got unique URLs may still be at a plain `save.sav` until their next write.

Every write: upload new blob → conditional `SaveState.updateOne` (`commitSave`) → delete old blob. The `del()` failing is non-fatal: at most one orphaned blob, and data is never lost because the DB was updated first.

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
| `nickname` / `otName` | Decoded Gen 1 charset strings, for display. Can be empty. |
| `nicknameBytes` / `otNameBytes` | The game's 11 bytes each, written back unchanged on port. Absent on older records. |
| `otId` | 2-byte original trainer ID |
| `level` | Extracted for display/filtering |
| `rawBoxData` | **33 bytes** — canonical permanent form. Extended stats are recalculated on port-in. |
| `status` | `'stashed'` = at Ranch; `'transferring'` = mid-move, hidden from the Ranch. The record is deleted once the Pokémon is in a save. |
| `transfer` | Only while transferring: direction, save, its URL before and after, start time |

### `User` (addition)
| Field | Notes |
|---|---|
| `appTrainerId` | 16-bit, generated on first Connect, permanent. Written to every connected save's Player ID field. |

---

## File Map

| Layer | File | Responsibility |
|---|---|---|
| UI | `src/components/oaks-lab/OaksLab.tsx` | Page shell and bottom console: game and save slots, mode keys, status readout. Owns the one `useLabSave()` every mode shares, which reads the current game and save from `CurrentGameContext` (shared with Play and the Ranch). |
| UI | `src/components/oaks-lab/LabStage.tsx` | Layout: the mode's deck (slides in on the left), central platform, monitor with Pokémon and page controls. Also `SlideSwitch`, `DeckKey`, `DeckPill`. |
| UI | `src/components/oaks-lab/ExtractTab.tsx`, `PortInTab.tsx` | Leave and Take modes |
| UI | `src/components/oaks-lab/EditTab.tsx`, `IvEditor.tsx` | Edit tab and IV gauges |
| UI | `src/components/oaks-lab/useLabSave.ts`, `LabSave.tsx` | Choosing a save, paging its party and boxes, and the `SaveMonitor` used by Leave and Enhance |
| UI | `src/components/ranch/OaksRanch.tsx` | Read-only Ranch gallery |
| API | `src/app/api/save-states/[id]/connect/route.ts` | Connect flow |
| API | `src/app/api/pokemon/stored/route.ts` | GET (list Ranch), POST (extract) |
| API | `src/app/api/pokemon/stored/[id]/route.ts` | DELETE (release) |
| API | `src/app/api/pokemon/stored/[id]/port/route.ts` | POST (port-in) |
| API | `src/app/api/save-states/[id]/pokemon/ivs/route.ts` | POST (edit IVs in place) |
| Save layout | `src/utils/pokemon/gen1Save.ts` | Offsets, `locateSlot()`, `validateGen1Save()`, `isBoxAvailable()`, `readSaveContents()`, checksum. Server and client. |
| Save file | `src/lib/saveFile.ts` | `loadGen1Save()`, `uploadSave()`, `commitSave()`, `updateSaveRecord()`, `removeBlob()`. Server only. |
| Emulator save | `src/hooks/useSaveState.ts`, `src/hooks/useSystemActions.ts`, `SaveConflictModal` | Upload, conditional `PUT`, and the player's choice on a conflict |
| Transfers | `src/lib/pokemonTransfer.ts` | `sendToRanch()`, `portToSave()`, `recoverStaleTransfers()`. Server only. |
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
stat  = floor(((base + IV) * 2 + floor(min(255, ceil(sqrt(EV))) / 4)) * level / 100) + 5
maxHP = floor(((base_HP + IV) * 2 + floor(min(255, ceil(sqrt(HP_EV))) / 4)) * level / 100) + level + 10
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
