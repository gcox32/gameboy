export interface Game {
    id: string;
    title: string;
    img?: string;
    filePath: string;
    metadata?: {
        description?: string;
        series?: string;
        generation?: string;
        releaseDate?: string;
        memoryWatchers?: {
            activeParty?: MemoryWatcherConfig;
            gymBadges?: MemoryWatcherConfig;
            location?: MemoryWatcherConfig;
        };
    };
}

export interface MemoryWatcherConfig {
    baseAddress?: string;
    offset?: string;
    size?: string;
}