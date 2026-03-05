import { GameConfig } from '../config/GameConfig.js';

/**
 * Represents a collectible coin in the world.
 * Coins are placed on the map and collected by players on contact.
 *
 * TODO: implement from feature/coinEntity
 */
export class Coin {
    /**
     * @param {p5} p
     * @param {number} x - World x position (pixels)
     * @param {number} y - World y position (pixels)
     * @param {number} value - Score value awarded on collection
     */
    constructor(p, x, y, value = 1) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.w = GameConfig.TILE * 0.5;
        this.h = GameConfig.TILE * 0.5;
        this.value = value;
        this.collected = false;
    }

    /**
     * Checks if this coin overlaps a player and collects it if so.
     * @param {Player[]} players
     * @param {ScoreManager} scoreManager
     */
    update(players, scoreManager) {
        // TODO
    }

    draw() {
        if (this.collected) return;
        // TODO
    }
}
