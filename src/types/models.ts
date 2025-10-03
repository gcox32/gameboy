import { MemoryWatcherConfig } from "./schema";

export interface NotificationModel {
    id: string;
    owner: string;
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
    owner: string;
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
    owner?: string;
    username: string;
    email: string;
    bio: string;
    avatar: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface GameModel {
    id: string;
    owner: string;
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