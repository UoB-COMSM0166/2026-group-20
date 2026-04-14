import { GameConfig } from '../config/GameConfig.js';
import { Coin } from '../entities/Coin.js';

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
                p.rect(x * GameConfig.TILE, y * GameConfig.TILE, GameConfig.TILE, GameConfig.TILE);
            } else if (c === 'S') {
                p.fill(220, 80, 80);
                const px = x * GameConfig.TILE, py = y * GameConfig.TILE;
                p.triangle(px, py + GameConfig.TILE, px + GameConfig.TILE / 2, py + 6, px + GameConfig.TILE, py + GameConfig.TILE);
            } else if (c === 'F') {
                p.fill(100, 220, 100);
                p.rect(x * GameConfig.TILE, y * GameConfig.TILE, GameConfig.TILE, GameConfig.TILE);
                p.fill(255);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(12);
                p.text('GOAL', x * GameConfig.TILE + GameConfig.TILE / 2, y * GameConfig.TILE + GameConfig.TILE / 2);
            }
            // 'C' tiles are handled as Coin entities — skip here
        }
    }
}

/**
 * Returns a Coin instance for every 'C' tile in the active map.
 *
 * If a placed obstacle occupies a coin's tile, that coin is relocated to a
 * randomly chosen *grounded* free tile (a '.' tile that has a solid '#' tile
 * directly below it) so the total coin count never changes and all coins
 * remain reachable by the player.
 *
 * If no grounded free tile is available, the coin stays at its original
 * position regardless — count is always preserved.
 *
 * @param {p5}       p
 * @param {object[]} [placedObstacles=[]]
 * @returns {Coin[]}
 */
export function getCoins(p, placedObstacles = []) {
    const T    = GameConfig.TILE;
    const cols = MAP[0].length; // canonical width — avoids off-screen tiles from longer rows

    // Build a set of tile positions occupied by placed obstacles
    const occupiedKeys = new Set(
        placedObstacles.map(obs => `${Math.round(obs.x / T)},${Math.round(obs.y / T)}`)
    );

    // Candidate relocation tiles: empty ('.') tiles with solid '#' directly
    // below them (i.e. grounded — the player can stand there and collect the coin).
    // Strictly bounded to [0, cols) so we never pick an off-screen tile.
    const candidates = [];
    for (let ty = 0; ty < MAP.length - 1; ty++) {
        for (let tx = 0; tx < cols; tx++) {
            const c     = MAP[ty][tx];
            const below = MAP[ty + 1]?.[tx];
            if (c === '.' && below === '#' && !occupiedKeys.has(`${tx},${ty}`)) {
                candidates.push({ tx, ty });
            }
        }
    }

    // Fisher-Yates shuffle so picks are random each round
    for (let i = candidates.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
    }

    let relocIdx = 0;
    const coins  = [];

    for (let ty = 0; ty < MAP.length; ty++) {
        for (let tx = 0; tx < cols; tx++) {
            if (MAP[ty]?.[tx] !== 'C') continue;

            let coinTx = tx, coinTy = ty;

            if (occupiedKeys.has(`${tx},${ty}`)) {
                if (relocIdx < candidates.length) {
                    // Move coin to a grounded free tile
                    ({ tx: coinTx, ty: coinTy } = candidates[relocIdx++]);
                }
                // else: no candidates left — coin stays at original position.
                // Count is always preserved; coin may be behind an obstacle
                // but it still exists and renders on top of it.
            }

            const px = coinTx * T + T * 0.25;
            const py = coinTy * T + T * 0.25;
            coins.push(new Coin(p, px, py, GameConfig.COIN_VALUE));
        }
    }

    return coins;
}
