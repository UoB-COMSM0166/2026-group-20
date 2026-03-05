import { GameConfig } from '../config/GameConfig.js';

// Active map — swap this import to change which map is loaded.
export { MAP1 as MAP } from './Map1.js';
import { MAP1 as MAP } from './Map1.js';

/**
 * Returns the tile character at grid position (tx, ty).
 * Treats out-of-bounds positions as solid '#' walls.
 *
 * @param {number} tx - Tile column index
 * @param {number} ty - Tile row index
 * @returns {string} Single tile character
 */
export function getTile(tx, ty) {
    if (ty < 0 || ty >= MAP.length || tx < 0 || tx >= MAP[0].length) return '#';
    return MAP[ty][tx];
}

/**
 * @param {number} tx
 * @param {number} ty
 * @returns {boolean}
 */
export function isSolid(tx, ty) {
    return getTile(tx, ty) === '#';
}

/**
 * @param {number} tx
 * @param {number} ty
 * @returns {boolean}
 */
export function isSpike(tx, ty) {
    return getTile(tx, ty) === 'S';
}

/**
 * Draws the full tile map using the active p5 instance.
 *
 * @param {p5} p - The p5 instance
 */
export function drawMap(p) {
    p.noStroke();
    for (let y = 0; y < MAP.length; y++) {
        for (let x = 0; x < MAP[0].length; x++) {
            const c = MAP[y][x];
            if (c === '#') {
                p.fill(80);
                p.rect(
                    x * GameConfig.TILE,
                    y * GameConfig.TILE,
                    GameConfig.TILE,
                    GameConfig.TILE,
                );
            } else if (c === 'S') {
                p.fill(220, 80, 80);
                const px = x * GameConfig.TILE,
                    py = y * GameConfig.TILE;
                p.triangle(
                    px,
                    py + GameConfig.TILE,
                    px + GameConfig.TILE / 2,
                    py + 6,
                    px + GameConfig.TILE,
                    py + GameConfig.TILE,
                );
            } else if (c === 'F') {
                p.fill(100, 220, 100);
                p.rect(
                    x * GameConfig.TILE,
                    y * GameConfig.TILE,
                    GameConfig.TILE,
                    GameConfig.TILE,
                );
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(12);
                p.text(
                    'GOAL',
                    x * GameConfig.TILE + GameConfig.TILE / 2,
                    y * GameConfig.TILE + GameConfig.TILE / 2,
                );
            }
        }
    }
}
