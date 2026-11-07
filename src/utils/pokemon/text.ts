import { charMap } from './dicts';

/*
 * Gen 1's text encoding, decoded. Kept apart from MemoryWatcher, which uses React hooks, so
 * server code (route handlers reading a ROM or save) can decode text too.
 */

export function translateInteger(integerValue: number): string {
    return charMap[integerValue] || '?';
}

/** Decodes up to the terminator, 0x50 by default */
export function translateIntegerArray(integerArray: ArrayLike<number>, breakInt = 0x50): string {
    let text = '';
    for (let i = 0; i < integerArray.length; i++) {
        if (integerArray[i] === breakInt) break;
        text += translateInteger(integerArray[i]);
    }
    return text;
}
