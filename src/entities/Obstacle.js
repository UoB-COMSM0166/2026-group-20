/**
 * Base class for all placeable obstacles (e.g. moving platforms, cannons, traps).
 * Extend this class to implement specific obstacle types.
 *
 * TODO: flesh out as obstacle types are designed
 */
export class Obstacle {
    /**
     * @param {p5} p
     * @param {number} x
     * @param {number} y
     * @param {number} w
     * @param {number} h
     */
    constructor(p, x, y, w, h) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.active = true;
    }

    /**
     * Update obstacle logic each frame.
     * @param {number} deltaTime - ms since last frame
     */
    update(deltaTime) {
        // TODO: override in subclasses
    }

    /**
     * Draw the obstacle.
     */
    draw() {
        // TODO: override in subclasses
    }
}
