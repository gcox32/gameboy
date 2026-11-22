import { ROM_HEADER } from '@/utils/romDetection';

/**
 * Turns a stored save (a JSON blob holding the cartridge's battery-backed RAM as
 * `{ MBCRam: number[] }`) into a raw `.sav`, the same bytes a physical cartridge's
 * SRAM chip holds, so it loads in other emulators or writes back with a flasher
 * like FlashGBX.
 */
export async function fetchSavBytes(filePath: string): Promise<Uint8Array<ArrayBuffer>> {
    const res = await fetch(filePath, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Could not load save file (${res.status})`);
    const json = (await res.json()) as { MBCRam?: unknown };
    if (!Array.isArray(json.MBCRam) || json.MBCRam.length === 0) {
        throw new Error('Save file has no cartridge RAM');
    }
    return Uint8Array.from(json.MBCRam as number[]);
}

/** Cartridge types (header 0x147) using MBC2, whose RAM is built into the chip */
const MBC2_TYPES = new Set([0x05, 0x06]);

/** Header 0x149 codes to RAM bytes */
const RAM_SIZE_BY_CODE: Record<number, number> = {
    0x01: 0x800,
    0x02: 0x2000,
    0x03: 0x8000,
    0x04: 0x20000,
    0x05: 0x10000,
};

/**
 * How much RAM the cartridge really has, from its ROM header. The emulator sizes
 * RAM by mapper instead (every MBC5 gets 128 KB), so its buffer can be bigger
 * than the cartridge and tools expecting the real size reject it.
 */
export function cartridgeRamSize(header: Uint8Array): number | null {
    if (header.length <= ROM_HEADER.RAM_SIZE) return null;
    if (MBC2_TYPES.has(header[ROM_HEADER.CARTRIDGE_TYPE])) return 0x200;
    return RAM_SIZE_BY_CODE[header[ROM_HEADER.RAM_SIZE]] ?? null;
}

/** Reads the start of the game's ROM, just far enough to cover the header */
export async function fetchRomHeader(gameId: string): Promise<Uint8Array> {
    const gameRes = await fetch(`/api/games/${encodeURIComponent(gameId)}`);
    if (!gameRes.ok) throw new Error(`Could not load game (${gameRes.status})`);
    const game = (await gameRes.json()) as { filePath?: string; updatedAt?: string };
    if (!game.filePath) throw new Error('Game has no ROM file');

    // Same versioned URL the emulator loads, since ROMs are overwritten in place
    const url = new URL(game.filePath, window.location.href);
    if (game.updatedAt) url.searchParams.set('v', game.updatedAt);

    // A server ignoring the range sends the whole ROM, which still has the header
    const romRes = await fetch(url, { headers: { Range: `bytes=0-${ROM_HEADER.GLOBAL_CHECKSUM + 1}` } });
    if (!romRes.ok) throw new Error(`Could not load ROM (${romRes.status})`);
    return new Uint8Array(await romRes.arrayBuffer());
}

export function savFileName(title?: string): string {
    const base = (title ?? '')
        .trim()
        .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '')
        .replace(/\s+/g, ' ')
        .slice(0, 80)
        .trim();
    return `${base || 'save'}.sav`;
}

export async function downloadSav(save: { filePath: string; gameId?: string; title?: string }): Promise<void> {
    let bytes = await fetchSavBytes(save.filePath);

    if (save.gameId) {
        try {
            const size = cartridgeRamSize(await fetchRomHeader(save.gameId));
            if (size && size < bytes.length) bytes = bytes.slice(0, size);
        } catch (err) {
            // Still worth handing over the full RAM rather than nothing
            console.warn('Could not read the cartridge RAM size, so the .sav is untrimmed:', err);
        }
    }

    const url = URL.createObjectURL(new Blob([bytes], { type: 'application/octet-stream' }));
    try {
        const link = document.createElement('a');
        link.href = url;
        link.download = savFileName(save.title);
        document.body.appendChild(link);
        link.click();
        link.remove();
    } finally {
        // Give the browser a moment to start the download before the URL goes away
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
}
