/**
 * A painted field the Ranch's Pokémon live in. Everything is in percent of the image, so it
 * holds at any size. More fields are just more of these, once there's art with open grass.
 */
export interface RanchField {
    src: string;
    /** Image width over height */
    aspect: number;
    /** Open grass a Pokémon can stand on, as rectangles. y is where its feet are. */
    ground: { x0: number; x1: number; y0: number; y1: number }[];
    /** The far and near edges of the ground, for scaling with depth */
    horizon: number;
    front: number;
    /** How much smaller a Pokémon is at the horizon than at the front */
    farScale: number;
    /** Where on the field to centre a narrow screen, in percent of its width */
    focusX: number;
}

/*
 * Oak's corral: river on the left, a big tree in front of it, the barn and windmill on the
 * right with a fence below. The open grass runs between the tree and the barn, deepest in
 * the middle where the meadow goes back to the treeline. Two people stand in the meadow
 * (x 53–61, y 68–76), so nobody settles on top of them; they can still be walked past.
 */
export const CORRAL: RanchField = {
    src: '/images/background/ranch/oak-corral.png',
    aspect: 1000 / 353,
    ground: [
        { x0: 42, x1: 52, y0: 67, y1: 77 },
        { x0: 62, x1: 67, y0: 67, y1: 77 },
        { x0: 41, x1: 74, y0: 77, y1: 93 },
    ],
    horizon: 67,
    // Short of the bottom, which the board below overlaps
    front: 93,
    farScale: 0.6,
    focusX: 56,
};

export interface Spot { x: number; y: number }

/** How big a Pokémon is drawn at this depth, from farScale at the horizon to 1 at the front */
export function depthScale(field: RanchField, y: number): number {
    const t = Math.min(1, Math.max(0, (y - field.horizon) / (field.front - field.horizon)));
    return field.farScale + (1 - field.farScale) * t;
}

/** A random point on the field's ground, every bit of it equally likely */
export function randomSpot(field: RanchField, rand: () => number): Spot {
    const areas = field.ground.map(g => (g.x1 - g.x0) * (g.y1 - g.y0));
    let pick = rand() * areas.reduce((a, b) => a + b, 0);
    let g = field.ground[0];
    for (let i = 0; i < areas.length; i++) {
        g = field.ground[i];
        if ((pick -= areas[i]) <= 0) break;
    }
    return { x: g.x0 + rand() * (g.x1 - g.x0), y: g.y0 + rand() * (g.y1 - g.y0) };
}

export function onGround(field: RanchField, { x, y }: Spot): boolean {
    return field.ground.some(g => x >= g.x0 && x <= g.x1 && y >= g.y0 && y <= g.y1);
}

/**
 * Distance on the field, with depth counting extra. The field is about three times wider
 * than it's tall, and a step back into the meadow covers more ground than one sideways.
 */
export function fieldDistance(a: Spot, b: Spot): number {
    return Math.hypot(a.x - b.x, (a.y - b.y) * 2.5);
}

/**
 * Spots spread out over the ground, one per Pokémon: each is the best of several random
 * candidates, the one furthest from those already placed. The same seed gives the same layout.
 */
export function spreadSpots(field: RanchField, count: number, rand: () => number): Spot[] {
    const spots: Spot[] = [];
    for (let i = 0; i < count; i++) {
        let best = randomSpot(field, rand);
        let bestGap = -1;
        for (let c = 0; c < 12; c++) {
            const cand = randomSpot(field, rand);
            const gap = Math.min(Infinity, ...spots.map(s => fieldDistance(s, cand)));
            if (gap > bestGap) { best = cand; bestGap = gap; }
        }
        spots.push(best);
    }
    return spots;
}

/** A small seeded random number generator (mulberry32) */
export function seededRandom(seed: string): () => number {
    let h = 1779033703;
    for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    let a = h >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
