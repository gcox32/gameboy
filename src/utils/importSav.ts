import { ROM_HEADER } from '@/utils/romDetection';
import { cartridgeRamSize } from '@/utils/downloadSav';

/** Real cartridges' RAM sizes: MBC2's built-in 512 bytes, then 2, 8, 32, 64 and 128 KB */
const KNOWN_RAM_SIZES = [0x200, 0x800, 0x2000, 0x8000, 0x10000, 0x20000];

/**
 * Emulators and flashers (BGB, VBA, FlashGBX) add the real-time clock's state after
 * the RAM on MBC3 clock cartridges like Gold, Silver and Crystal. It's 48 bytes, or
 * 44 in older files. The emulator keeps its clock elsewhere, so the footer is dropped.
 */
const RTC_FOOTER_SIZES = [48, 44];

const formatSize = (bytes: number) =>
    bytes >= 1024 ? `${bytes / 1024} KB` : `${bytes} bytes`;

/**
 * Checks a `.sav` (raw cartridge RAM, as a flasher dumps it) against the game it's
 * going into and returns just the RAM. Throws an Error whose message is fit to show.
 * Without the ROM header it can only check the file is a plausible cartridge size.
 */
export function normalizeSav(file: Uint8Array, header: Uint8Array | null): Uint8Array {
    if (file.length === 0) throw new Error('That file is empty.');

    const expected = header ? cartridgeRamSize(header) : null;
    if (header && expected === null && header[ROM_HEADER.RAM_SIZE] === 0x00) {
        throw new Error("This game doesn't save to its cartridge, so there's nowhere for a .sav to go.");
    }

    const sizes = expected ? [expected] : KNOWN_RAM_SIZES;
    for (const size of sizes) {
        if (file.length === size) return file;
        if (RTC_FOOTER_SIZES.some(footer => file.length === size + footer)) return file.slice(0, size);
    }

    if (expected) {
        throw new Error(
            `This cartridge has ${formatSize(expected)} of save memory, but the file is ${formatSize(file.length)}. ` +
            'Check it was dumped from this game.'
        );
    }
    throw new Error(`A ${formatSize(file.length)} file doesn't match any cartridge's save memory.`);
}

/** The file's name without its extension, for the new save's title */
export function savTitle(fileName: string): string {
    return fileName.replace(/\.[^.]*$/, '').trim() || 'Imported save';
}
