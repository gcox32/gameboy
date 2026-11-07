import type { IGame } from '@/models/Game';
import type { MoveDetails } from '@/types/pokemon';
import { getMoveDetails } from '@/utils/pokemon/moves';

/** A move as the source game describes it, kept with a Pokémon that leaves that game */
export interface StoredMove extends MoveDetails {
    id: number;
}

/**
 * The game's ROM, for reading its move table. Null if it can't be had: a Pokémon still
 * moves without its move details, so this never fails a transfer.
 */
export async function loadRom(game: IGame | null): Promise<Uint8Array | null> {
    if (!game?.filePath) return null;
    try {
        // ROMs are replaced in place, so the version keeps a cached old one from answering
        const url = new URL(game.filePath);
        if (game.updatedAt) url.searchParams.set('v', game.updatedAt.toISOString());
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) return null;
        return new Uint8Array(await res.arrayBuffer());
    } catch (err) {
        console.error('[romMoves] Couldn\'t load the ROM:', err);
        return null;
    }
}

/**
 * Names, types, power, accuracy and base PP of a Pokémon's moves, from the game it came from.
 * Hacks change these, so they come from that game's ROM and not a fixed table.
 */
export function movesFromRom(rom: Uint8Array | null, rawBoxData: ArrayLike<number>): StoredMove[] | undefined {
    if (!rom) return undefined;
    const moves: StoredMove[] = [];
    for (const id of [rawBoxData[0x08], rawBoxData[0x09], rawBoxData[0x0A], rawBoxData[0x0B]]) {
        const details = getMoveDetails(rom, id);
        if (details) moves.push({ id, ...details });
    }
    return moves;
}
