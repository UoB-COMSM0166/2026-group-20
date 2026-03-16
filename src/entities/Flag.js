import { GameConfig } from '../config/GameConfig.js';

/**
 * The finish/goal entity. Currently the finish is detected via a raw tile check
 * in sketch.js — this class is the future home for that logic.
 *
 * TODO: replace the 'F' tile check in sketch.js with Flag.checkReached(player)
 */
export class Flag {
    /**
     * @param {p5} p
     * @param {number} tx - Tile column
     * @param {number} ty - Tile row
     */
    constructor(p, tx, ty) {
        this.p = p;
        this.x = tx * GameConfig.TILE;
        this.y = ty * GameConfig.TILE;
        this.w = GameConfig.TILE;
        this.h = GameConfig.TILE;
    }

    /**
     * Returns true if the given player is overlapping the flag.
     * @param {Player} player
     * @returns {boolean}
     */
    checkReached(player) {
        // TODO
        return false;
    }

    draw() {
        // TODO: replace the inline drawMap 'F' tile rendering
    }
}
