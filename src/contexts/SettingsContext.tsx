'use client';

import React, { createContext, useContext, useState } from 'react';
import { defaultEmulatorSettings } from '@/utils/settings/emulatorSettings';

const SettingsContext = createContext<{
    uiSettings: {
        speed: number;
        isSoundOn: boolean;
        mobileZoom: boolean;
        background: string;
    };
    emulatorSettings: {
        sound: boolean,
        bootWithROM: boolean,
        prioritizeGB: boolean,
        volumeLevel: number,
        colorizeGB: boolean,
        disallowTypedArrays: boolean,
        emulatorInterval: number,
        audioBufferMinSpan: number,
        audioBufferMaxSpan: number,
        forceMBC1: boolean,
        overrideMBCRAM: boolean,
        useGBBootROM: boolean,
        browserScaleCanvas: boolean,
        useImageSmoothing: boolean,
        channelEnables: boolean[],
    };
    updateUISettings: (newSettings: {
        speed?: number;
        isSoundOn?: boolean;
        mobileZoom?: boolean;
        background?: string;
    }) => void;
    updateEmulatorConfig: (newSettings: {
        romPath?: string;
        savePath?: string;
        statePath?: string;
        stateIndex?: number;
    }) => void;
} | null>(null);

export const SettingsProvider = ({ children }: { children: React.ReactNode }) => {
    // UI Settings
    const [uiSettings, setUiSettings] = useState({
        speed: 1,
        isSoundOn: true,
        mobileZoom: false,
        background: 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.jpeg'
    });

    // Emulator Settings
    const [emulatorSettings, setEmulatorSettings] = useState(defaultEmulatorSettings);

    const updateUISettings = (newSettings: {
        speed?: number;
        isSoundOn?: boolean;
        mobileZoom?: boolean;
        background?: string;
    }) => {
        setUiSettings(prev => ({
            ...prev,
            ...newSettings
        }));
    };

    const updateEmulatorConfig = (newSettings: {
        romPath?: string;
        savePath?: string;
        statePath?: string;
        stateIndex?: number;
    }) => {
        setEmulatorSettings(prev => ({
            ...prev,
            ...newSettings
        }));
    };

    return (
        <SettingsContext.Provider 
            value={{ 
                uiSettings, 
                updateUISettings,
                emulatorSettings,
                updateEmulatorConfig
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettings = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettings must be used within a SettingsProvider');
    }
    return context;
};