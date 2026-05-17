export function slugify(text: string): string {
    return text.toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export function sanitizeEmail(email: string): string {
    return email.replace('@', '_at_').replace(/\./g, '-');
}

// saves/{email}/{game-slug}/{save-slug}-{saveId[0..8]}/save.sav
export function saveBlobPath(email: string, gameTitle: string, saveTitle: string, saveId: string): string {
    return `saves/${sanitizeEmail(email)}/${slugify(gameTitle) || 'game'}/${slugify(saveTitle) || 'save'}-${saveId.slice(0, 8)}/save.sav`;
}

// games/{email}/{game-slug}-{gameId[0..8]}
// Callers append /{filename.gb} or /cover.{ext}
export function gameBlobDir(email: string, gameTitle: string, gameId: string): string {
    return `games/${sanitizeEmail(email)}/${slugify(gameTitle) || 'game'}-${gameId.slice(0, 8)}`;
}
