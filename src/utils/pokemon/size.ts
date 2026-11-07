/*
 * Real heights in Gen 1 run from 0.2 m (Diglett) to 8.8 m (Onix): true to scale would make Onix
 * 44 Diglett tall. So display heights are exactly proportional up to GIANT_FROM_M, which covers
 * nearly everyone, and only the giants above it are compressed.
 */
const GIANT_FROM_M = 1.5;
/** How hard the giants are compressed: 1 would be true to scale, 0 would make them all equal */
const GIANT_CURVE = 0.35;
/** Height for a Pokémon whose real height isn't known */
const UNKNOWN_M = 1;

/**
 * The height in metres to draw a Pokémon at, from its real height in decimetres as PokéAPI
 * gives it. Each scene multiplies this by its own scale.
 */
export function displayHeightM(heightDm: number | null | undefined): number {
    if (!heightDm) return UNKNOWN_M;
    const m = heightDm / 10;
    return m <= GIANT_FROM_M ? m : GIANT_FROM_M * (m / GIANT_FROM_M) ** GIANT_CURVE;
}
