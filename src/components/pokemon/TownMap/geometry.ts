import { Location } from '@/types/pokemon';
import { townMapUrl } from '@/lib/assets';

export const townMapSrc = townMapUrl(1);

const ART_WIDTH = 160;
const ART_HEIGHT = 136;
const TILE_SIZE = 8;

/** A location's box on the map, as percentages of the art. */
export function getLocationBox({ x, y, width, height }: Location) {
    return {
        left: ((x * TILE_SIZE) / ART_WIDTH) * 100,
        top: ((y * TILE_SIZE) / ART_HEIGHT) * 100,
        width: ((width * TILE_SIZE) / ART_WIDTH) * 100,
        height: ((height * TILE_SIZE) / ART_HEIGHT) * 100,
    };
}

/** The centre of a town map tile position, as percentages of the art. Matches the squares drawn on it. */
export function getTilePosition(tileX: number, tileY: number) {
    return {
        left: ((tileX * 8 + 20) / ART_WIDTH) * 100,
        top: ((tileY * 8 + 4) / ART_HEIGHT) * 100,
    };
}

/** A background-position that centres a location in a zoomed crop of the art, as near as the edges allow. */
export function getCropPosition(location: Location, zoom: number, cropAspectRatio: number) {
    const box = getLocationBox(location);
    const centerX = (box.left + box.width / 2) / 100;
    const centerY = (box.top + box.height / 2) / 100;
    const artHeightInWidths = zoom * (ART_HEIGHT / ART_WIDTH);
    const cropHeightInWidths = 1 / cropAspectRatio;
    const clamp = (value: number) => Math.min(100, Math.max(0, value * 100));
    return {
        x: clamp((centerX * zoom - 0.5) / (zoom - 1)),
        y: clamp((centerY * artHeightInWidths - cropHeightInWidths / 2) / (artHeightInWidths - cropHeightInWidths)),
    };
}
