import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

// Wind directions and their velocity vectors
export const WindDir = Object.freeze({
    LEFT: 'LEFT',
    RIGHT: 'RIGHT',
    UP: 'UP',
    DOWN: 'DOWN',
});

const DIR_VECTORS = {
    LEFT: { vx: -1, vy: 0 },
    RIGHT: { vx: 1, vy: 0 },
    UP: { vx: 0, vy: -1 },
    DOWN: { vx: 0, vy: 1 },
};

const FRAME_SIZE = 32;
const ICON_FRAME = 2;
const ICON_SOURCE_X = ICON_FRAME * FRAME_SIZE + 6;
const ICON_SOURCE_Y = 9;
const ICON_SOURCE_W = 22;
const ICON_SOURCE_H = 14;

/**
 * WindZone — an invisible (but visualised) force field that pushes players.
 *
 * Neither solid nor hazard. Any player overlapping the tile is pushed in
 * the configured direction by WIND_FORCE px per frame, applied in applyEffect.
 * The direction can be rotated in the build phase (R key, same as Cannon).
 *
 * @extends Obstacle
 */
export class WindZone extends Obstacle {
    /**
     * @param {p5}     p
     * @param {number} x
     * @param {number} y
     * @param {WindDir} direction
     */
    constructor(p, x, y, direction = WindDir.RIGHT, sprite = null) {
        super(p, x, y, sprite);
        this.direction = direction;
        this._age = 0;
    }

    get isSolid() {
        return false;
    }
    get isHazard() {
        return false;
    }

    update(deltaTime) {
        this._age += deltaTime;
    }

    /**
     * preEffect runs BEFORE player.update() so wind velocity is included in
     * the moveAndCollide call. We also set slideMode so horizontalMovement()
     * does not zero vx before wind can take effect.
     */
    preEffect(player) {
        if (
            !aabbIntersects(
                player.x,
                player.y,
                player.w,
                player.h,
                this.x,
                this.y,
                this.w,
                this.h,
            )
        )
            return;

        // Prevent horizontalMovement from zeroing vx this frame
        player.slideMode = true;

        const vec = DIR_VECTORS[this.direction];
        const force = GameConfig.WIND_FORCE;
        player.vx += vec.vx * force;
        player.vy += vec.vy * force;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const vec = DIR_VECTORS[this.direction];
        const angle =
            vec.vx !== 0
                ? vec.vx > 0
                    ? 0
                    : Math.PI
                : vec.vy > 0
                  ? Math.PI / 2
                  : -Math.PI / 2;

        if (this.obstacleSheet) {
            p.push();
            p.translate(cx, cy);
            p.rotate(angle);
            p.noSmooth();
            p.tint(255, 215);
            p.image(
                this.obstacleSheet,
                -this.w / 2,
                -this.h / 2,
                this.w,
                this.h,
                ICON_SOURCE_X,
                ICON_SOURCE_Y,
                ICON_SOURCE_W,
                ICON_SOURCE_H,
            );
            p.pop();
        } else {
            p.noStroke();
            p.fill(60, 185, 185, 70);
            p.rect(this.x, this.y, this.w, this.h, 4);
        }
    }

    static drawGhost(p, x, y, direction = WindDir.RIGHT, sprite = null) {
        const T = GameConfig.TILE;
        if (sprite) {
            const vec = DIR_VECTORS[direction];
            const angle =
                vec.vx !== 0
                    ? vec.vx > 0
                        ? 0
                        : Math.PI
                    : vec.vy > 0
                      ? Math.PI / 2
                      : -Math.PI / 2;
            p.push();
            p.translate(x + T / 2, y + T / 2);
            p.rotate(angle);
            p.noSmooth();
            p.tint(255, 170);
            p.image(
                sprite,
                -T / 2,
                -T / 2,
                T,
                T,
                ICON_SOURCE_X,
                ICON_SOURCE_Y,
                ICON_SOURCE_W,
                ICON_SOURCE_H,
            );
            p.pop();
        } else {
            p.noStroke();
            p.fill(60, 185, 185, 80);
            p.rect(x, y, T, T, 4);
            p.stroke(120, 230, 230, 120);
            p.strokeWeight(1);
            p.noFill();
            p.rect(x, y, T, T, 4);
            p.noStroke();
        }
    }
}
