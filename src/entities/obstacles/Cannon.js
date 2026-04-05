import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * Direction constants for Cannon orientation.
 * Determines which way the barrel faces and which way projectiles travel.
 */
export const CannonDir = Object.freeze({
    LEFT:  'LEFT',
    RIGHT: 'RIGHT',
    UP:    'UP',
    DOWN:  'DOWN',
});


/**
 * Projectile — a single cannonball fired by a Cannon.
 *
 * Not a standalone Obstacle subclass — projectiles are owned and managed
 * entirely by their parent Cannon. RunState checks them via
 * cannon.checkProjectileHit(player).
 *
 * @private
 */
class Projectile {
    /**
     * @param {p5}    p
     * @param {number} x  - Centre x at spawn
     * @param {number} y  - Centre y at spawn
     * @param {number} vx - Horizontal velocity (px/frame)
     * @param {number} vy - Vertical velocity (px/frame)
     */
    constructor(p, x, y, vx, vy) {
        this.p       = p;
        this.x       = x;
        this.y       = y;
        this.vx      = vx;
        this.vy      = vy;
        this.r       = GameConfig.CANNON_PROJECTILE_RADIUS;
        this.expired = false; // set true when it leaves the map or hits a player
    }

    /**
     * Move the projectile and mark it expired if it leaves the world bounds.
     * @param {number} gameWidth
     * @param {number} gameHeight
     */
    update(gameWidth, gameHeight) {
        this.x += this.vx;
        this.y += this.vy;

        if (
            this.x < -this.r  || this.x > gameWidth  + this.r ||
            this.y < -this.r  || this.y > gameHeight + this.r
        ) {
            this.expired = true;
        }
    }

    /**
     * Returns true if this projectile overlaps the given player rectangle.
     * Uses a simple rect-vs-circle approximation (AABB of the circle).
     * @param {Player} player
     * @returns {boolean}
     */
    hits(player) {
        return aabbIntersects(
            player.x, player.y, player.w, player.h,
            this.x - this.r, this.y - this.r, this.r * 2, this.r * 2,
        );
    }

    draw() {
        const p = this.p;
        p.noStroke();

        // Outer ball — bright orange-red so it's clearly visible in play
        p.fill(255, 90, 30);
        p.circle(this.x, this.y, this.r * 2);

        // White glint highlight
        p.fill(255, 255, 255, 200);
        p.circle(this.x - this.r * 0.25, this.y - this.r * 0.25, this.r * 0.6);
    }
}


/**
 * Cannon — a placeable obstacle that fires projectiles in one direction.
 *
 * The cannon body is solid (players can stand on it).
 * Projectiles are hazards — touching one kills the player.
 *
 * Projectile collisions are NOT handled by PhysicsSystem (they are
 * sub-objects, not entries in placedObstacles). RunState calls
 * cannon.checkProjectileHit(player) each frame for each player.
 *
 * @extends Obstacle
 *
 * @example
 *   const cannon = new Cannon(p, 5 * TILE, 3 * TILE, CannonDir.RIGHT);
 *   // in update loop:
 *   cannon.update(deltaTime, gameWidth, gameHeight);
 *   cannon.draw();
 *   // in collision loop:
 *   if (cannon.checkProjectileHit(player)) respawnManager.triggerDeath(player, DeathReason.TRAP);
 */
export class Cannon extends Obstacle {

    /**
     * @param {p5}       p
     * @param {number}   x         - World x (top-left, tile-snapped)
     * @param {number}   y         - World y (top-left, tile-snapped)
     * @param {CannonDir} direction - Which way the barrel faces
     */
    constructor(p, x, y, direction = CannonDir.RIGHT, obstacleSheet) {
        super(p, x, y);
        this.direction    = direction;
        this.projectiles  = [];
        this._fireTimer   = GameConfig.CANNON_FIRE_INTERVAL; // start ready to fire immediately
        this._angle       = this._directionAngle(direction);
        this.obstacleSheet=obstacleSheet;
        this.cannonW= 30;
        this.cannonH= 18;
    }

    // ── Obstacle interface --

    /** The cannon body blocks movement — players can stand on top. */
    get isSolid() { return true; }

    /** The body itself is not a hazard — only projectiles kill. */
    get isHazard() { return false; }

    // ── Per-frame ───

    /**
     * Advance the fire timer, spawn projectiles, and update all active ones.
     *
     * @param {number} deltaTime  - ms since last frame
     * @param {number} gameWidth  - used for out-of-bounds culling
     * @param {number} gameHeight - used for out-of-bounds culling
     */
    update(deltaTime, gameWidth, gameHeight) {
        // Tick the fire timer
        this._fireTimer += deltaTime;
        if (this._fireTimer >= GameConfig.CANNON_FIRE_INTERVAL) {
            this._fireTimer = 0;
            this._spawnProjectile();
        }

        // Update and cull expired projectiles
        for (const proj of this.projectiles) {
            proj.update(gameWidth, gameHeight);
        }
        this.projectiles = this.projectiles.filter(proj => !proj.expired);
    }

    /**
     * Draw the cannon body (barrel + base) and all active projectiles.
     */
    draw() {
        this._drawBody();
        for (const proj of this.projectiles) {
            proj.draw();
        }
    }

    // ── Collision ──

    /**
     * Check whether any active projectile has hit the given player.
     * Removes the projectile on hit (it "explodes").
     * Call this each frame from RunState for every player.
     *
     * @param {Player} player
     * @returns {boolean} true if a projectile hit the player this frame
     */
    checkProjectileHit(player) {
        for (const proj of this.projectiles) {
            if (proj.hits(player)) {
                proj.expired = true; // consume the projectile
                return true;
            }
        }
        return false;
    }

    // ── Build-phase ghost ──

    /**
     * Draw a semi-transparent placement preview.
     * @param {p5}         p
     * @param {number}     x
     * @param {number}     y
     * @param {CannonDir}  direction
     */
    static drawGhost(p, x, y, direction = CannonDir.RIGHT, sheet) {
        const T = GameConfig.TILE;
        const frameW = 30;
        const frameH = 18;
        const dw=frameW*1.6;
        const dh=frameH*1.6;
        
        p.push();
        p.translate(x+T/2, y+T/2);
        p.rotate(Cannon._staticAngle(direction));
        p.tint(255, 150);
        p.scale(-1, 1);
        p.image(sheet, -dw/2, -dh/2, dw, dh);
        p.pop();
    }

    // ── Private ───
    /**
     * Spawn one projectile from the cannon mouth, travelling in this.direction.
     * @private
     */
    _spawnProjectile() {
        const T     = GameConfig.TILE;
        const speed = GameConfig.CANNON_PROJECTILE_SPEED;
        const cx    = this.x + T / 2;
        const cy    = this.y + T / 2;

        // Velocity vector based on direction
        const vx = this.direction === CannonDir.RIGHT ?  speed
                 : this.direction === CannonDir.LEFT  ? -speed
                 : 0;
        const vy = this.direction === CannonDir.DOWN  ?  speed
                 : this.direction === CannonDir.UP    ? -speed
                 : 0;

        // Offset spawn point to the tip of the barrel
        const barrelLen = T * 0.55;
        const spawnX    = cx + vx / speed * barrelLen;
        const spawnY    = cy + vy / speed * barrelLen;

        this.projectiles.push(new Projectile(this.p, spawnX, spawnY, vx, vy));
    }

    /**
     * Draw the cannon body: a square base + a directional barrel.
     * @private
     */
    _drawBody() {
        const p  = this.p;
        const T  = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const dw= this.cannonW*1.6;
        const dh= this.cannonH*1.6;

        p.push();
        p.translate(cx, cy);
        p.rotate(this._angle);
        p.scale(-1, 1);
        p.image(this.obstacleSheet, -dw/2, -dh/2, dw, dh);
        p.noSmooth();
        
        p.pop();
    }

    /**
     * Convert a CannonDir to a p5 rotation angle (radians, 0 = right).
     * @private
     */
    _directionAngle(dir) {
        return Cannon._staticAngle(dir);
    }

    static _staticAngle(dir) {
        switch (dir) {
            case CannonDir.RIGHT: return 0;
            case CannonDir.DOWN:  return Math.PI / 2;
            case CannonDir.LEFT:  return Math.PI;
            case CannonDir.UP:    return -Math.PI / 2;
            default:              return 0;
        }
    }
}
