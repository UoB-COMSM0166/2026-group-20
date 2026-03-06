import { GameConfig } from '../config/GameConfig.js';

/**
 * Base class for all placeable obstacles.
 *
 * Subclasses must override:
 *   get isSolid()  — true if the obstacle blocks player movement
 *   get isHazard() — true if the obstacle kills on contact
 *   draw()         — how to render the obstacle
 *
 * PhysicsSystem reads isSolid and isHazard each frame.
 */
export class Obstacle {
    /**
     * @param {p5}    p
     * @param {number} x - World x position in pixels (top-left, snapped to tile grid)
     * @param {number} y - World y position in pixels (top-left, snapped to tile grid)
     */
    constructor(p, x, y) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.w = GameConfig.TILE;
        this.h = GameConfig.TILE;
        this.active = true;
    }

    /** @returns {boolean} true if this obstacle should block player movement */
    get isSolid() {
        return false;
    }

    /** @returns {boolean} true if touching this obstacle kills the player */
    get isHazard() {
        return false;
    }

    /**
     * Per-frame logic. Override for moving/animated obstacles.
     * @param {number} _deltaTime - ms since last frame
     */
    update(_deltaTime) {}

    /** Render the obstacle. Must be overridden. */
    draw() {}
}
