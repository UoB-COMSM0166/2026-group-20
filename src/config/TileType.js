export const TileType = Object.freeze({
    EMPTY: 'empty',
    SOLID: 'solid',
    HALF: 'half',
    SLOPE_UP: 'slopeUp',
    SLOPE_DOWN: 'slopeDown',
    SPIKE: 'spike',
    COIN: 'coin',
    STARTPOINT: 'startPoint',
    ENDPOINT: 'endPoint',
});

/**
 * Chunk edge connectivity bitmask (which edges have passages).
 * Used by ChunkMapGenerator to ensure adjacent chunks connect correctly.
 *
 *   1 = top    2 = right    4 = bottom    8 = left
 * e.g. 5 (0101₂) = top + bottom = vertical passage
 *      10 (1010₂) = right + left = horizontal passage
 *      15 (1111₂) = all sides open
 */
export const ChunkEdge = Object.freeze({
    NONE: 0, // 0000
    TOP: 1, // 0001
    RIGHT: 2, // 0010
    BOTTOM: 4, // 0100
    LEFT: 8, // 1000
    TOP_RIGHT: 1 | 2, // 0011
    TOP_BOTTOM: 1 | 4, // 0101
    TOP_LEFT: 1 | 8, // 1001
    RIGHT_BOTTOM: 2 | 4, // 0110
    RIGHT_LEFT: 2 | 8, // 1010
    BOTTOM_LEFT: 4 | 8, // 1100
    ALL: 1 | 2 | 4 | 8, // 1111
});
