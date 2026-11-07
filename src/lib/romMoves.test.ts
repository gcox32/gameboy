import { describe, it, mock, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { IGame } from '@/models/Game';
import { loadRom, movesFromRom } from './romMoves';

// A vanilla Gen 1 ROM from the local reference set. These tests skip where it isn't.
const ROM_PATH = join(homedir(), 'Documents/Play/Projects/pokemon/green-en.gbc');
const rom = existsSync(ROM_PATH) ? new Uint8Array(readFileSync(ROM_PATH)) : null;

/** Box data holding just these move IDs */
function withMoves(...ids: number[]): number[] {
    const bytes = new Array(33).fill(0);
    ids.forEach((id, i) => { bytes[0x08 + i] = id; });
    return bytes;
}

afterEach(() => mock.restoreAll());

describe('movesFromRom', () => {
    it('gives nothing without a ROM, so the record leaves them out', () => {
        assert.equal(movesFromRom(null, withMoves(33)), undefined);
    });

    it('reads each move\'s details from the game, skipping empty slots', { skip: !rom && 'no reference ROM' }, () => {
        assert.deepEqual(movesFromRom(rom, withMoves(33, 45)), [
            { id: 33, name: 'TACKLE', type: 'NORMAL', PP: 35, basepower: 35, accuracy: 95 },
            { id: 45, name: 'GROWL', type: 'NORMAL', PP: 40, basepower: 0, accuracy: 100 },
        ]);
    });
});

describe('loadRom', () => {
    const game = { filePath: 'https://blob.test/rom.gb', updatedAt: new Date('2026-11-01T00:00:00Z') } as IGame;

    it('fetches the current version of the ROM', async () => {
        const fetched = mock.method(globalThis, 'fetch', async () => new Response(new Uint8Array([1, 2, 3])));
        assert.deepEqual(await loadRom(game), new Uint8Array([1, 2, 3]));
        assert.equal(String(fetched.mock.calls[0].arguments[0]), 'https://blob.test/rom.gb?v=2026-11-01T00%3A00%3A00.000Z');
    });

    it('gives null, not an error, when the ROM can\'t be had', async () => {
        mock.method(globalThis, 'fetch', async () => new Response('', { status: 404 }));
        assert.equal(await loadRom(game), null);
        mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
        mock.method(console, 'error', () => {});
        assert.equal(await loadRom(game), null);
        assert.equal(await loadRom({ filePath: '' } as IGame), null);
    });
});
