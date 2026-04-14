/**
 *
 * @param x1
 * @param y1
 * @param w1
 * @param h1
 * @param x2
 * @param y2
 * @param w2
 * @param h2
 */
export function rectsOverlap(x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
}

/**
 *
 * @param ax
 * @param ay
 * @param aw
 * @param ah
 * @param bx
 * @param by
 * @param bw
 * @param bh
 */
export function aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}
