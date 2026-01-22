import { useMemo } from 'react';
import { MemoryWatcherConfig } from '@/types/states';
import { GameModel } from '@/types';
import { getPresetByRomTitle, getDefaultPreset, GameMemoryPreset } from '@/data/memoryPresets';

export type MemoryWatcherType = 'activeParty' | 'gymBadges' | 'location';

interface UseMemoryConfigOptions {
    game: GameModel | null;
    romTitle?: string;
    watcherType: MemoryWatcherType;
}

interface MemoryConfigResult {
    config: MemoryWatcherConfig;
    source: 'user' | 'preset' | 'default';
    preset: GameMemoryPreset | null;
    generation: 1 | 2;
}

/**
 * Hook to resolve memory watcher configuration with priority:
 * 1. User-configured overrides (in game metadata)
 * 2. ROM header match (preset)
 * 3. Default fallback
 */
export function useMemoryConfig({
    game,
    romTitle,
    watcherType,
}: UseMemoryConfigOptions): MemoryConfigResult {
    return useMemo(() => {
        const defaultPreset = getDefaultPreset();

        // Try to get preset from ROM title
        const preset = romTitle ? getPresetByRomTitle(romTitle) : null;
        const activePreset = preset || defaultPreset;

        // Parse game metadata for user overrides
        let userConfig: MemoryWatcherConfig | undefined;
        if (game?.metadata) {
            try {
                const metadata = typeof game.metadata === 'string'
                    ? JSON.parse(game.metadata)
                    : game.metadata;
                userConfig = metadata?.memoryWatchers?.[watcherType];
            } catch {
                // Invalid metadata, ignore
            }
        }

        // Determine which config to use
        if (userConfig?.baseAddress) {
            // User has configured this watcher
            return {
                config: userConfig,
                source: 'user' as const,
                preset: activePreset,
                generation: activePreset.generation,
            };
        }

        if (preset) {
            // Use preset config
            return {
                config: preset[watcherType],
                source: 'preset' as const,
                preset,
                generation: preset.generation,
            };
        }

        // Fall back to default
        return {
            config: defaultPreset[watcherType],
            source: 'default' as const,
            preset: null,
            generation: defaultPreset.generation,
        };
    }, [game, romTitle, watcherType]);
}

/**
 * Get all memory configs for a game at once
 */
export function getMemoryConfigs(
    game: GameModel | null,
    romTitle?: string
): {
    activeParty: MemoryConfigResult;
    gymBadges: MemoryConfigResult;
    location: MemoryConfigResult;
} {
    const defaultPreset = getDefaultPreset();
    const preset = romTitle ? getPresetByRomTitle(romTitle) : null;
    const activePreset = preset || defaultPreset;

    // Parse game metadata once
    let userConfigs: Record<string, MemoryWatcherConfig> = {};
    if (game?.metadata) {
        try {
            const metadata = typeof game.metadata === 'string'
                ? JSON.parse(game.metadata)
                : game.metadata;
            userConfigs = metadata?.memoryWatchers || {};
        } catch {
            // Invalid metadata
        }
    }

    const resolve = (type: MemoryWatcherType): MemoryConfigResult => {
        const userConfig = userConfigs[type];

        if (userConfig?.baseAddress) {
            return {
                config: userConfig,
                source: 'user',
                preset: activePreset,
                generation: activePreset.generation,
            };
        }

        if (preset) {
            return {
                config: preset[type],
                source: 'preset',
                preset,
                generation: preset.generation,
            };
        }

        return {
            config: defaultPreset[type],
            source: 'default',
            preset: null,
            generation: defaultPreset.generation,
        };
    };

    return {
        activeParty: resolve('activeParty'),
        gymBadges: resolve('gymBadges'),
        location: resolve('location'),
    };
}

/**
 * Check if a game has any user-configured memory watchers
 */
export function hasUserMemoryConfig(game: GameModel | null): boolean {
    if (!game?.metadata) return false;

    try {
        const metadata = typeof game.metadata === 'string'
            ? JSON.parse(game.metadata)
            : game.metadata;
        const watchers = metadata?.memoryWatchers;

        if (!watchers) return false;

        return Boolean(
            watchers.activeParty?.baseAddress ||
            watchers.gymBadges?.baseAddress ||
            watchers.location?.baseAddress
        );
    } catch {
        return false;
    }
}
