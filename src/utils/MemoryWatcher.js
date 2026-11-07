import { useEffect } from 'react';

export const useMBCRamWatcher = (mbcRamRef, offsetHex, sizeHex, onChange, interval = 1000) => {
    useEffect(() => {
        if (!mbcRamRef.current) {
            console.warn('mbcRamRef.current is not initialized.');
            return;
        }

        const offset = parseInt(offsetHex, 16);
        const size = parseInt(sizeHex, 16);
        let previousSlice = null;
        const checkForChanges = () => {
            const currentSlice = mbcRamRef.current.slice(offset, offset + size);
            if (JSON.stringify(previousSlice) !== JSON.stringify(currentSlice)) {
                previousSlice = currentSlice;
                onChange(currentSlice);
            }
        };

        const intervalId = setInterval(checkForChanges, interval); // check every second

        return () => clearInterval(intervalId); // cleanup interval on unmount
    }, [mbcRamRef, offsetHex, sizeHex, onChange, interval]);
};
// Pure, so it lives apart from the hooks here and server code can use it
export { translateInteger, translateIntegerArray } from './pokemon/text';
/**
 * Slice memory with GBC memory overlay support
 * For GBC games, addresses 0xD000-0xDFFF are stored in gbcMemory, not main memory
 */
export const sliceMemoryWithGBC = (memory, gbcMemory, startAddr, endAddr) => {
    // If no GBC memory or reading entirely below 0xD000, use regular memory
    if (!gbcMemory || gbcMemory.length === 0 || endAddr <= 0xD000) {
        return memory.slice(startAddr, endAddr);
    }

    // If reading entirely from GBC range (0xD000-0xDFFF)
    if (startAddr >= 0xD000 && endAddr <= 0xE000) {
        // GBC memory is offset by 0xD000, so address 0xD000 = gbcMemory[0]
        return gbcMemory.slice(startAddr - 0xD000, endAddr - 0xD000);
    }

    // If reading spans both ranges, need to merge
    const result = [];
    for (let addr = startAddr; addr < endAddr; addr++) {
        if (addr >= 0xD000 && addr < 0xE000) {
            result.push(gbcMemory[addr - 0xD000]);
        } else {
            result.push(memory[addr]);
        }
    }
    return result;
};

export const useInGameMemoryWatcher = (gameMemoryRef, baseAddressHex, offsetHex, sizeHex, onChange, interval = 1000, gbcMemoryRef = null) => {
    useEffect(() => {
        if (!gameMemoryRef) {
            console.warn('gameMemoryRef.current is not initialized.');
            return;
        }
        if (!baseAddressHex || !offsetHex || !sizeHex) return;

        const baseAddress = parseInt(baseAddressHex, 16);
        const offset = parseInt(offsetHex, 16);
        const size = parseInt(sizeHex, 16);
        const inGameMemoryAddress = baseAddress + offset;

        let previousSlice = null;
        const checkForChanges = () => {
            // Use GBC-aware slicing if GBC memory is available
            const gbcMemory = gbcMemoryRef?.current || gbcMemoryRef;
            const currentSlice = sliceMemoryWithGBC(
                gameMemoryRef,
                gbcMemory,
                inGameMemoryAddress,
                inGameMemoryAddress + size
            );
            if (JSON.stringify(previousSlice) !== JSON.stringify(currentSlice)) {
                previousSlice = currentSlice;
                onChange(currentSlice);
            }
        };

        const intervalId = setInterval(checkForChanges, interval);

        return () => clearInterval(intervalId);
    }, [gameMemoryRef, gbcMemoryRef, baseAddressHex, offsetHex, sizeHex, onChange, interval]);
};
export const parseMetadata = (activeROM, key, defaultConfig = {}) => {
    const raw = activeROM?.metadata;
    const metadata = typeof raw === 'string' ? JSON.parse(raw) : raw;
    try {
        const config = metadata?.memoryWatchers?.[key];
        return config ?? defaultConfig;
    } catch (error) {
        console.error('Error parsing metadata:', error);
        return defaultConfig;
    }
};