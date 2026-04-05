import { GameConfig } from '../config/GameConfig.js';
import { aabbIntersects } from '../systems/PhysicsSystem.js';

/**
 * A collectible coin placed in the world.
 *
 * Rules:
 *   - Touching a coin adds its value to the player's round coin tally.
 *   - Round coins are banked into the wallet only if the player finishes.
 *   - If the player fails, round coins are reset to zero (see ScoreManager).
 */
export class Coin {
    /**
     * @param {p5} p
     * @param {number} x - World x position (pixels, top-left of bounding box)
     * @param {number} y - World y position (pixels, top-left of bounding box)
     * @param {number} value - How many coins this pickup is worth (default 1)
     */
    constructor(p, x, y, value = GameConfig.COIN_VALUE) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.w = GameConfig.TILE * 0.5;
        this.h = GameConfig.TILE * 0.5;
        this.value = value;
        this.collected = false;

        // Randomised offset so coins don't all bob in sync
        this._baseY = y;
        this._age = Math.random() * Math.PI * 2;
    }

    /**
     * Check for player overlap each frame; collect on first hit.
<<<<<<< HEAD
=======
     *
>>>>>>> feature/charSelect
     * @param {Player[]} players
     * @param {ScoreManager} scoreManager
     */
    update(players, scoreManager) {
        if (this.collected) return;

        this._age += 0.05;

        for (const player of players) {
            if (!aabbIntersects(
                player.x, player.y, player.w, player.h,
                this.x, this.y, this.w, this.h,
            )) continue;

            this.collected = true;
            scoreManager.collectCoin(player, this);
            break;
        }
    }

    /**
     * Draw a bobbing gold coin. Does nothing once collected.
     */
    draw() {
        if (this.collected) return;

        const p = this.p;
        const bobY = this._baseY + Math.sin(this._age) * 3;
        const cx = this.x + this.w / 2;
        const cy = bobY + this.h / 2;

        p.noStroke();

        // Outer gold disc
        p.fill(255, 200, 0);
        p.circle(cx, cy, this.w);

        // Inner highlight
        p.fill(255, 240, 120, 200);
        p.circle(cx - this.w * 0.12, cy - this.h * 0.12, this.w * 0.4);
    }

    /**
     * Reset so this coin can be collected again (called at round start).
     */
    reset() {
        this.collected = false;
        this._age = Math.random() * Math.PI * 2;
    }
}
