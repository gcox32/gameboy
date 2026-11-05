'use client';

import { createContext, ReactNode, useContext } from 'react';
import { useEmulatorController } from '@/hooks/useEmulatorController';

type EmulatorContextValue = ReturnType<typeof useEmulatorController>;

const EmulatorContext = createContext<EmulatorContextValue | null>(null);

export function EmulatorProvider({ children }: { children: ReactNode }) {
    const emulator = useEmulatorController();
    return <EmulatorContext.Provider value={emulator}>{children}</EmulatorContext.Provider>;
}

export const useEmulator = () => {
    const context = useContext(EmulatorContext);
    if (!context) throw new Error('useEmulator must be used within an EmulatorProvider');
    return context;
};
