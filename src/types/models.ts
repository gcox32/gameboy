import { MemoryWatcherConfig } from "./states";

export interface NotificationModel {
    id: string;
    userId: string;
    sender?: string;
    type: string;
    title?: string;
    body: string;
    readAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface SaveStateModel {
    id?: string;
    userId: string;
    gameId: string;
    game: GameModel;
    filePath: string;
    title?: string;
    description?: string;
    img?: string;
    imgFile?: File;
    createdAt?: string;
    updatedAt?: string;
}

export interface ProfileModel {
    id?: string;
    userId?: string;
    username: string;
    email: string;
    bio: string;
    avatar: string;
    admin?: boolean;
    createdAt?: string;
    updatedAt?: string;
}

export interface GameModel {
    id: string;
    userId: string;
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
