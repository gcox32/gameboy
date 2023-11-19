import { useEffect, useState } from 'react';
import { charMap } from './pokemon/dicts';

export const useMBCRamWatcher = (mbcRamRef, offsetHex, sizeHex, onChange) => {
    const [watchedValue, setWatchedValue] = useState(null);

    useEffect(() => {
        // Check if mbcRamRef.current is initialized
        if (!mbcRamRef.current) {
            console.warn('mbcRamRef.current is not initialized.');
            return;
        }

        const offset = parseInt(offsetHex, 16);
        const size = parseInt(sizeHex, 16);

        const checkForChanges = () => {
            const currentSlice = mbcRamRef.current.slice(offset, offset + size);
            if (JSON.stringify(watchedValue) !== JSON.stringify(currentSlice)) {
                setWatchedValue(currentSlice);
                if (onChange) {
                    onChange(currentSlice);
                }
            }
        };

        const intervalId = setInterval(checkForChanges, 1000); // check every second

        return () => clearInterval(intervalId); // cleanup interval on unmount
    }, [mbcRamRef, offsetHex, sizeHex, watchedValue, onChange]);

    return watchedValue;
};

export function translateInteger(integerValue) {
    const hexValue = integerValue.toString(16).toUpperCase();
    const hexNumber = parseInt(hexValue, 16);
    const character = charMap[hexNumber];
    return character || "?";
}

export function translateIntegerArray(integerArray, breakInt=80) {
    let translatedArray = [];
    for (let i = 0; i < integerArray.length; i++) {
        if (integerArray[i] === breakInt) {
            break;
        }
        translatedArray.push(translateInteger(integerArray[i]));
    }
    return translatedArray.join('');
}