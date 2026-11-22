import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { cartridgeRamSize } from '@/utils/downloadSav';
import { normalizeSav, savTitle } from '@/utils/importSav';

/** Just enough of a ROM header: the cartridge type at 0x147 and RAM size at 0x149 */
const header = (cartridgeType: number, ramSize: number) => {
    const bytes = new Uint8Array(0x150);
    bytes[0x147] = cartridgeType;
    bytes[0x149] = ramSize;
    return bytes;
};

const MBC3_32KB = header(0x13, 0x03); // Red, Blue, Green
const MBC3_RTC_32KB = header(0x10, 0x03); // Gold, Silver, Crystal
const MBC5_8KB = header(0x1b, 0x02);
const MBC2 = header(0x06, 0x00);
const NO_RAM = header(0x01, 0x00);

const filled = (length: number) => Uint8Array.from({ length }, (_, i) => i & 0xff);

describe('cartridgeRamSize', () => {
    it('reads the header RAM size', () => {
        assert.equal(cartridgeRamSize(MBC3_32KB), 0x8000);
        assert.equal(cartridgeRamSize(MBC5_8KB), 0x2000);
        assert.equal(cartridgeRamSize(header(0x1b, 0x04)), 0x20000);
        assert.equal(cartridgeRamSize(header(0x1b, 0x05)), 0x10000);
    });

    it('gives MBC2 its built-in 512 bytes', () => {
        assert.equal(cartridgeRamSize(MBC2), 0x200);
    });

    it('has no size for a cartridge without RAM, or a short header', () => {
        assert.equal(cartridgeRamSize(NO_RAM), null);
        assert.equal(cartridgeRamSize(new Uint8Array(0x100)), null);
    });
});

describe('normalizeSav', () => {
    it('keeps a file that matches the cartridge', () => {
        const file = filled(0x8000);
        assert.deepEqual(normalizeSav(file, MBC3_32KB), file);
    });

    it('drops a 48 or 44 byte clock footer', () => {
        for (const footer of [48, 44]) {
            const ram = normalizeSav(filled(0x8000 + footer), MBC3_RTC_32KB);
            assert.equal(ram.length, 0x8000);
            assert.deepEqual(ram, filled(0x8000));
        }
    });

    it('rejects a file the wrong size for the cartridge', () => {
        assert.throws(() => normalizeSav(filled(0x2000), MBC3_32KB), /32 KB of save memory, but the file is 8 KB/);
        assert.throws(() => normalizeSav(filled(0x20000), MBC3_32KB), /but the file is 128 KB/);
    });

    it('rejects a game that has nowhere to save', () => {
        assert.throws(() => normalizeSav(filled(0x8000), NO_RAM), /doesn't save to its cartridge/);
    });

    it('rejects an empty file', () => {
        assert.throws(() => normalizeSav(new Uint8Array(0), MBC3_32KB), /empty/);
    });

    it('accepts any real cartridge size without a header', () => {
        for (const size of [0x200, 0x2000, 0x8000, 0x20000]) {
            assert.equal(normalizeSav(filled(size), null).length, size);
        }
        assert.equal(normalizeSav(filled(0x8000 + 48), null).length, 0x8000);
        assert.throws(() => normalizeSav(filled(1000), null), /doesn't match any cartridge/);
    });
});

describe('savTitle', () => {
    it("uses the file's name without its extension", () => {
        assert.equal(savTitle('POKEMON RED.sav'), 'POKEMON RED');
        assert.equal(savTitle('Crystal.backup.sav'), 'Crystal.backup');
        assert.equal(savTitle('.sav'), 'Imported save');
    });
});
