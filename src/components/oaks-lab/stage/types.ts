/** What the monitor and platform need to show a Pokémon, from a save slot or the Ranch */
export interface LabEntry {
    key: string;
    speciesIndex: number;
    nickname: string;
    level: number;
}

/** How the last action went, shown on the deck until it's acknowledged */
export interface LabResult {
    tone: 'success' | 'error';
    text: string;
}
