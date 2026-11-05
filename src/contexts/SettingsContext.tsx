'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { defaultEmulatorSettings } from '@/utils/settings/emulatorSettings';

export interface KeyMapping {
  button: string;
  keyCode: number;
  key: string;
}

interface UISettings {
  speed: number;
  isSoundOn: boolean;
  background: string;
  isDynamicBackground: boolean;
  keyMappings: KeyMapping[];
  /** Skips the prompt before turning off, resetting or loading over a running game */
  skipConfirmations: boolean;
}

export const defaultKeyMappings: KeyMapping[] = [
  { button: "right",  keyCode: 39, key: "ArrowRight"},
  { button: "left",   keyCode: 37, key: "ArrowLeft" },
  { button: "up",     keyCode: 38, key: "ArrowUp"   },
  { button: "down",   keyCode: 40, key: "ArrowDown" },
  { button: "a",      keyCode: 88, key: "x"         },
  { button: "b",      keyCode: 90, key: "z"         },
  { button: "select", keyCode: 16, key: "Shift"     },
  { button: "start",  keyCode: 13, key: "Enter"     } 
];

export const defaultUISettings: UISettings = {
    speed: 1,
    isSoundOn: true,
    background: 'https://assets.letmedemo.com/public/gameboy/images/fullscreen/default.jpeg',
    isDynamicBackground: false,
    keyMappings: defaultKeyMappings,
    skipConfirmations: false
};

const SPEED_STEPS = [0.5, 1, 1.5, 2, 4];

// A speed between the steps moves on to the next one up
export const getNextSpeed = (speed: number) => SPEED_STEPS.find(step => step > speed) ?? SPEED_STEPS[0];

const SettingsContext = createContext<{
    uiSettings: UISettings;
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
    updateUISettings: (newSettings: Partial<UISettings>) => void;
    updateEmulatorConfig: (newSettings: {
        romPath?: string;
        savePath?: string;
        statePath?: string;
        stateIndex?: number;
    }) => void;
} | null>(null);

export const SettingsProvider = ({ children }: { children: ReactNode }) => {
    // Load initial UI settings from localStorage or use defaults
    const [uiSettings, setUiSettings] = useState<UISettings>(() => {
        if (typeof window === 'undefined') return defaultUISettings;
        
        try {
            const savedSettings = localStorage.getItem('gameSettings');
            if (savedSettings) {
                // Fills in anything added since these settings were saved
                return { ...defaultUISettings, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Error loading settings from localStorage:', error);
        }
        return defaultUISettings;
    });

    // Emulator Settings
    const [emulatorSettings, setEmulatorSettings] = useState(defaultEmulatorSettings);

    const updateUISettings = (newSettings: Partial<UISettings>) => {
        setUiSettings(prev => {
            const updatedSettings = {
                ...prev,
                ...newSettings
            };
            // Save to localStorage whenever settings are updated
            if (typeof window !== 'undefined') {
                localStorage.setItem('gameSettings', JSON.stringify(updatedSettings));
            }
            return updatedSettings;
        });
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