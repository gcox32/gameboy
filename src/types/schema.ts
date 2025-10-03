import { AuthenticatedUser } from "./auth";

export interface MemoryWatcherConfig {
    baseAddress?: string;
    offset?: string;
    size?: string;
}

export interface CartridgesProps {
    onROMSelected: (rom: any) => void;
    isDisabled: boolean;
    activeSaveState: any;
    currentUser: AuthenticatedUser;
    onOpenGameManagement: () => void;
}

