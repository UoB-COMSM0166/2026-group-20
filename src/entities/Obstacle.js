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
     * @param {p5}       p
     * @param {number}   x - World x position in pixels (top-left, snapped to tile grid)
     * @param {number}   y - World y position in pixels (top-left, snapped to tile grid)
     * @param {p5.Image} [obstacleSheet] - optional sprite sheet for animated subclasses
     */
    constructor(p, x, y, obstacleSheet) {
        this.p      = p;
        this.x      = x;
        this.y      = y;
        this.w      = GameConfig.TILE;
        this.h      = GameConfig.TILE;
        this.active = true;

        this.obstacleSheet = obstacleSheet ?? null;
        this.framesArr     = [];
    }

    /** @returns {boolean} true if this obstacle should block player movement */
    get isSolid()  { return false; }

    /** @returns {boolean} true if touching this obstacle kills the player */
    get isHazard() { return false; }

    /**
     * Slice a horizontal sprite sheet into individual frames.
     * @param {number} frameWidth
     * @param {number} frameHeight
     */
    splitAnimation(frameWidth, frameHeight) {
        this.framesArr = [];
        for (let j = 0; j < this.obstacleSheet.width; j += frameWidth) {
            this.framesArr.push(this.obstacleSheet.get(j, 0, frameWidth, frameHeight));
        }
    }

    /** @returns {boolean} true if this obstacle should block player movement */
    get isSolid()  { return false; }

    /** @returns {boolean} true if touching this obstacle kills the player */
    get isHazard() { return false; }

    /**
     * Per-frame logic. Override for moving/animated obstacles.
     * @param {number} _deltaTime - ms since last frame
     * @param {number} _gameWidth
     * @param {number} _gameHeight
     */
    update(_deltaTime, _gameWidth, _gameHeight) {}

    /**
     * Pre-physics effect — called BEFORE player.update() each frame.
     * Override for effects that must influence the velocity that player.update()
     * acts on this frame (e.g. wind push, ice slide mode).
     * @param {object} _player
     */
    preEffect(_player) {}

    /**
     * Apply special physics/effects to a player each frame.
     * Called after all player movement is resolved.
     * Override in: IcePlatform, BouncePad, SpikePlatform, Teleporter, Flame.
     *
     * @param {object}     _player
     * @param {object[]}   _allPlayers
     * @param {object}     _respawnManager
     * @param {object[]}   _obstacles
     */
    applyEffect(_player, _allPlayers, _respawnManager, _obstacles) {}

    /**
     * Move players that are riding this obstacle before player physics resolves.
     * Override in MovingPlatform.
     * @param {object[]} _players
     */
    carryPlayers(_players) {}

    /** Render the obstacle. Must be overridden. */
    draw() {}
}
