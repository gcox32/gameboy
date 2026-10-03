# Oak's Lab + Ranch — Correctness Review

Review of the extract / store / port pipeline (October 2026). Covers what was found, what has been fixed, and what is still open.

Related docs: [OAKS_LAB.md](OAKS_LAB.md) (original plan), [OAKS_LAB_IMPL.md](OAKS_LAB_IMPL.md) (how it works).

**Files in scope:** `src/utils/sramWriter.ts`, `src/utils/pokemon/extract.ts`, `src/utils/pokemon/stats.ts`, `src/app/api/save-states/[id]/connect/route.ts`, `src/app/api/pokemon/stored/route.ts`, `src/app/api/pokemon/stored/[id]/route.ts`, `src/app/api/pokemon/stored/[id]/port/route.ts`, `src/components/oaks-lab/OaksLab.tsx`, `src/components/ranch/OaksRanch.tsx`.

---

## Verified correct

- Party and box layouts and offsets: party at `0x2F2C` (8-byte header, 44-byte slots), current-box mirror at `0x30C0`, banked boxes at `0x4000` / `0x6000` with stride `0x462`, box header 22 bytes, 33-byte data, 11-byte OT and nickname arrays.
- The main checksum covers `0x2598–0x3522` and is written to `0x3523`.
- Extracting several slots removes them from the highest index down, so earlier removals don't shift later ones.
- Extracting from the party takes the level from party byte `0x21`, not the possibly stale box level at `0x03`.
- Every route checks that the save or Pokémon belongs to the logged-in user.

---

## Fixed

### 1. Player ID written in the wrong byte order (critical)

**Was:** `stampTrainerId` wrote the Player ID at `0x2605` low byte first, but wrote each Pokémon's OT ID at `+0x0C` high byte first.

**Why it mattered:** the game compares `wPlayerID` against a Pokémon's OT ID byte by byte, in order (see pokered `CheckForDisobedience` and the EXP code). Unless both bytes of the trainer ID were equal, every stamped or ported Pokémon counted as traded: boosted EXP, and disobedience at high levels without the badges. Pokémon caught after connecting got an OT ID byte-swapped compared with the ported ones. It went unnoticed because `SRAMParser` also reads `playerId` low byte first, so the UI showed the expected number.

**Fix:** the Player ID is now written high byte first. The new `hasTrainerId()` check runs in the extract and port routes: if a save's Player ID doesn't match the user's `appTrainerId`, the whole save is re-stamped before the operation.

**Caveat:** a connected save is only repaired the next time the Lab extracts from it or ports into it. A save that is only played in the emulator stays broken until then.

### 2. Gen 1 stat formula missing the `/4` (critical)

**Was:** `floor(sqrt(statExp))`, about 4× too large with maxed stat experience. A level 70 Mewtwo got about 358 Attack instead of 224.

**Why it mattered:** the result is written into the 44-byte party stats on port-in, and used to set current HP = max HP when healing. Pokémon ported into a box ended up with current HP above their real max. The Ranch also displayed wrong stats.

**Fix:** the bonus is now `floor(min(255, ceil(sqrt(statExp))) / 4)`, matching pokered's `CalcStat`, which caps the square root at 255, so the bonus is at most 63. Check: Mewtwo at level 100 with max DVs and max stat experience comes out at 415 / 318 / 278 / 358 / 406.

### 5. The party could be emptied (high)

**Was:** nothing stopped you sending all party Pokémon to the Ranch. A Gen 1 save with 0 party Pokémon is broken.

**Fix:** the server rejects such a request with a 422 (`stored/route.ts`). The Lab UI disables "Send to Ranch" and says why (`OaksLab.tsx`).

### 6. No validation on request slots (medium)

**Was:** slots from the request were used as-is. `boxNumber` 0 or 13 sent `boxBankedBase` outside the box area; box 13 overwrote bank 3's checksum area and beyond. Any `location` other than `'party'` was treated as a box. Duplicate slots in one request extracted the wrong Pokémon.

**Fix:** `isValidSlot()` in `sramWriter.ts` accepts only `party` with slot 0–5, or `box` with box 1–12 and slot 0–19. It's used by both the extract and port routes. Duplicate slots in an extract request are rejected with a 400.

---

## Still open

Ordered by recommended priority.

### 3. Boxes the game hasn't set up yet — **data loss**

Bit 7 of `wCurrentBoxNum` (`0x284C`) records whether the player has ever changed PC boxes. Until they have, banks 2 and 3 have never been set up, and the game wipes all of them (`EmptyAllSRAMBoxes`) the first time the player switches boxes.

Nothing in the code or UI checks this bit, so:
- Porting into any box other than the current one in such a save silently loses that Pokémon the first time the player switches boxes.
- The Lab reads leftover garbage from those boxes as if it were real data.
- `stampTrainerId` writes into those boxes, which is harmless because the game wipes them anyway.

**Options:**
- **(Recommended)** Block those boxes. When bit 7 is clear, show only the current box in the Lab, and reject other box numbers in the port route. Simple and safe.
- Set them up ourselves, the way the game does: empty all 12 banked boxes (count `0`, species list `0xFF`), set bit 7, and recalculate the bank checksums. More capable, but more to get wrong.

### 9. Bank 2/3 box checksums never recalculated

Each box bank has a checksum over all its boxes plus one per box: bank 2 at `0x5A4C` (whole bank) and `0x5A4D–0x5A52` (boxes 1–6), bank 3 the same at `0x7A4C+`. `clearSlot`, `injectPokemon`, `stampTrainerId` and `syncCurrentBoxToBanked` all write to banked boxes without updating them. The game probably doesn't check them on load, but tools like PKHeX will report the save as corrupt. Small and self-contained; worth doing alongside #3.

### 4. A failure halfway through, or two requests at once — duplication

- `POST /api/pokemon/stored` creates the Ranch records *before* uploading the updated save. If `put()` fails, the Pokémon exist in both the Ranch and the save.
- `POST /api/pokemon/stored/[id]/port` uploads the save *before* saving the record. If `pokemon.save()` fails, the Pokémon is in the save and still `stashed` in the Ranch, so it can be ported again.
- There's no locking. Two requests against the same save at once both read the same file, and the last upload wins. That can duplicate or lose Pokémon.

**Direction:** upload the save file first, then write the Ranch records, and on failure undo the file change (point `filePath` back at the old file). For requests running at once, add an optimistic version check (e.g. a `version` field on `SaveState`, updated with a conditional `updateOne`).

### 8. Ported Pokémon stay `in_game` forever

After a port the record is marked `in_game` with `currentGameId`. If the same Pokémon is later sent back to the Ranch, a *new* record is created and the old one stays `in_game` for good. `DELETE` refuses to release `in_game` records, so they pile up and can never be removed.

**Decide:** what does `in_game` mean? Options:
- Delete the record on port (the save file becomes the only copy, and the Ranch only shows what's stashed).
- When extracting, find a matching `in_game` record (same user, species, OT ID, DVs, experience) and reuse it instead of creating a new one.

### 7. Connect marks the save connected before patching the file

`connect/route.ts` sets `connected: true` before fetching and stamping the save. If stamping fails, the save stays connected but unstamped, and calling connect again does nothing.

The repair from #1 now covers this whenever the Lab extracts from or ports into the save. The cleaner fix is to only set `connected: true` after the upload succeeds, and/or let connect re-stamp an already-connected save whose Player ID doesn't match.

### Other notes

- **An open game session can overwrite the Lab's changes.** The emulator saves via `PUT /api/save-states/[id]` with a new `filePath`. If a game is open while the Lab changes the same save, the next in-game save overwrites the Lab's edits. Extracted Pokémon reappear (duplicates) or ported ones disappear. This needs a decision about how the emulator and the Lab share a save (lock the save while a game session has it open, or check versions on `PUT`).
- **Pokédex flags.** Porting in doesn't set the owned/seen bits (`0x25A3` owned, `0x25B6` seen) for the species. Trading in the real game sets them.
- **Modded games.** `BASE_STATS` comes from vanilla Gen 1. Modded games (e.g. true-yellow) may have different base stats, so party stats written on port-in won't match the game. The game recalculates them on level up or box withdrawal, so the effect is temporary.
- **`SRAMParser` byte order.** `readUint16` / `readUint24` read low byte first, but every multi-byte field inside a Pokémon (HP, OT ID, experience, stat experience, DVs, party stats) and the Player ID are stored high byte first. Nothing in the Lab or Ranch depends on these parsed values right now (they use their own byte reads), but anything that reads them later will get wrong numbers.
