// Static assets the app ships with, served from the assets/ prefix of the Vercel Blob store
// (next to games/ and saves/, which hold what users upload). The gitignored assets/ folder at
// the repo root mirrors it file for file; scripts/upload-assets.mjs publishes it.
//
//   app/        backgrounds/, cover-art/, avatars/
//   pokemon/    sprites/<set>/[shiny/]NNN.gif, art/<set>/NNN.png, cries/NNN.wav (NNN = National Dex)
//   regions/    <region>/badges/, figures/, locations/[routes/]
//   maps/       town-map-gen<N>.png
//
// File names are lowercase, and Dex numbers are padded to three digits.

export const ASSETS_BASE_URL = 'https://9jns7teaeekjmmlp.public.blob.vercel-storage.com/assets/';

export const assetUrl = (path: string) => `${ASSETS_BASE_URL}${path}`;

/** 25, '25' or '025' -> '025' */
export const padDex = (dexNo: number | string) => String(parseInt(String(dexNo), 10)).padStart(3, '0');

// Pokémon

/** Animated sprite sets: Showdown's renders of the 3DS models, and Pokémon Stadium 2 */
export type SpriteSet = '3ds' | 'stadium';

export const spriteUrl = (dexNo: number | string, set: SpriteSet, { shiny = false } = {}) =>
    assetUrl(`pokemon/sprites/${set}/${shiny ? 'shiny/' : ''}${padDex(dexNo)}.gif`);

/** Eggs have no Dex number, so they sit beside the numbered sprites as egg.gif */
export const eggSpriteUrl = (set: SpriteSet) => assetUrl(`pokemon/sprites/${set}/egg.gif`);

/** Artwork sets. The Sugimori sets cover 1–151 (plus 232); official and home cover 1–251 */
export type ArtSet = 'sugimori-rb' | 'sugimori-rg' | 'sugimori-frlg' | 'official' | 'home';

export const artUrl = (dexNo: number | string, set: ArtSet) =>
    assetUrl(`pokemon/art/${set}/${padDex(dexNo)}.png`);

export const cryUrl = (dexNo: number | string) => assetUrl(`pokemon/cries/${padDex(dexNo)}.wav`);

// Regions

export type Region = 'kanto' | 'johto';

/** file: e.g. 'boulder.png' */
export const badgeUrl = (region: Region, file: string) => assetUrl(`regions/${region}/badges/${file}`);

/** Portraits of people (gym leaders so far), by lowercase name: figureUrl('kanto', 'brock') */
export const figureUrl = (region: Region, name: string) => assetUrl(`regions/${region}/figures/${name}.png`);

/** file: e.g. 'pewter-city.png' or 'routes/1.png' */
export const locationUrl = (region: Region, file: string) => assetUrl(`regions/${region}/locations/${file}`);

export const townMapUrl = (generation: 1 | 2) => assetUrl(`maps/town-map-gen${generation}.png`);

// App

/** file: e.g. 'default.jpeg' or 'red.png' */
export const backgroundUrl = (file: string) => assetUrl(`app/backgrounds/${file}`);

/** id: 'red', 'blue', 'green' or 'yellow' */
export const coverArtUrl = (id: string) => assetUrl(`app/cover-art/${id}.jpg`);

export const defaultAvatarUrl = assetUrl('app/avatars/default.png');

// Before Blob, assets were served from S3. URLs from then can still be stored: a chosen
// background in localStorage and a game's cover art in the database.
const LEGACY_PREFIX = 'https://assets.letmedemo.com/public/gameboy/images/';

/** The Blob URL for an asset URL from the old S3 host; anything else comes back unchanged. */
export function migrateLegacyAssetUrl(url: string): string {
    if (!url.startsWith(LEGACY_PREFIX)) return url;
    const path = url.slice(LEGACY_PREFIX.length);
    const background = path.match(/^fullscreen\/([^/]+)$/);
    if (background) return backgroundUrl(background[1]);
    const cover = path.match(/^cover-art\/cover-art-([a-z]+)\.jpg$/);
    if (cover) return coverArtUrl(cover[1]);
    if (path === 'users/default-avatar.png') return defaultAvatarUrl;
    return url;
}
