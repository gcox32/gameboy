'use client';

import React, { createContext, useContext, useState } from 'react';
import { defaultEmulatorSettings } from '@/utils/settings/emulatorSettings';

const SettingsContext = createContext();

export const SettingsProvider = ({ children }) => {
    // UI Settings
    const [uiSettings, setUiSettings] = useState({
        speed: 1,
        isSoundOn: true,
        mobileZoom: false
    });

    // Emulator Settings
    const [emulatorSettings, setEmulatorSettings] = useState(defaultEmulatorSettings);

    const updateUISettings = (newSettings) => {
        setUiSettings(prev => ({
            ...prev,
            ...newSettings
        }));
    };

    const updateEmulatorConfig = (newSettings) => {
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