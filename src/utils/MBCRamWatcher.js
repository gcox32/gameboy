import { useEffect } from 'react';
import { charMap } from './pokemon/dicts';

export const useMBCRamWatcher = (mbcRamRef, offsetHex, sizeHex, onChange, interval=1000) => {
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