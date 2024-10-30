// utils/settings/emulatorSettings.js
export const defaultEmulatorSettings = {
    sound: true,                         // Turn on sound
    bootWithROM: true,                   // Boot with boot ROM first?
    prioritizeGB: false,                 // Give priority to GameBoy mode
    volumeLevel: 1,                      // Volume level set
    colorizeGB: true,                    // Colorize GB mode?
    disallowTypedArrays: false,          // Disallow typed arrays?
    emulatorInterval: 8,                 // Interval for the emulator loop
    audioBufferMinSpan: 10,              // Audio buffer minimum span
    audioBufferMaxSpan: 20,              // Audio buffer maximum span
    forceMBC1: false,                    // Override for MBC1
    overrideMBCRAM: false,              // Override MBC RAM disabling
    useGBBootROM: false,                 // Use GB boot ROM instead of GBC
    browserScaleCanvas: false,           // Let browser scale canvas?
    useImageSmoothing: true,             // Use image smoothing based scaling
    channelEnables: [true, true, true, true] // User controlled channel enables
};

// Convert the new settings format to the array format expected by the emulator
export const convertSettingsToArray = (settings) => [
    settings.sound,
    settings.bootWithROM,
    settings.prioritizeGB,
    settings.volumeLevel,
    settings.colorizeGB,
    settings.disallowTypedArrays,
    settings.emulatorInterval,
    settings.audioBufferMinSpan,
    settings.audioBufferMaxSpan,
    settings.forceMBC1,
    settings.overrideMBCRAM,
    settings.useGBBootROM,
    settings.browserScaleCanvas,
    settings.useImageSmoothing,
    settings.channelEnables
];

// Create a bridge between UI settings and emulator settings
export const updateEmulatorSettings = (emulatorInstance, uiSettings) => {
    if (!emulatorInstance) return;

    // Update sound
    emulatorInstance.settings[0] = uiSettings.isSoundOn;
    
    // Update speed (this affects the emulator interval)
    const baseInterval = 8; // Default interval
    emulatorInstance.settings[6] = Math.floor(baseInterval / uiSettings.speed);
};