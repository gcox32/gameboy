import { AuthenticatedUser } from "./auth";
import { GameModel, SaveStateModel } from "./models";

export interface MemoryWatcherConfig {
    baseAddress?: string;
    offset?: string;
    size?: string;
}

export interface CartridgesProps {
    onROMSelected: (rom: GameModel) => void;
    isDisabled: boolean;
    activeSaveState: SaveStateModel;
    currentUser: AuthenticatedUser;
    onOpenGameManagement: () => void;
}

export interface GameState {
    activeGame: GameModel;
    lastSaved: number | null;
    isPlaying: boolean;
}

export const nullGameState: GameState = {
    activeGame: {
        id: '',
        owner: '',
        title: '',
        filePath: '',
        metadata: {}
    },
    lastSaved: null,
    isPlaying: false
}

