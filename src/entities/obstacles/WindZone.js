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

        if (this.obstacleSheet) {
            p.push();
            p.tint(255, 185);
            p.image(this.obstacleSheet, this.x, this.y, this.w, this.h, 0, 0, 32, 32);
            p.pop();
        } else {
            p.noStroke();
            p.fill(60, 185, 185, 70);
            p.rect(this.x, this.y, this.w, this.h, 4);
        }

        // Animated wind lines — offset by time and direction
        const vec = DIR_VECTORS[this.direction];
        const period = 800; // ms per full travel
        const phase = (this._age % period) / period; // 0..1

        p.stroke(120, 230, 230, 180);
        p.strokeWeight(1.5);

        const lineCount = 4;
        for (let i = 0; i < lineCount; i++) {
            const t = (phase + i / lineCount) % 1;
            const len = T * 0.35;
            let lx, ly;

            if (vec.vx !== 0) {
                lx = this.x + (vec.vx > 0 ? t * T : (1 - t) * T);
                ly = this.y + T * (0.2 + i * 0.2);
                p.line(
                    lx - (vec.vx * len) / 2,
                    ly,
                    lx + (vec.vx * len) / 2,
                    ly,
                );
            } else {
                lx = this.x + T * (0.2 + i * 0.2);
                ly = this.y + (vec.vy > 0 ? t * T : (1 - t) * T);
                p.line(
                    lx,
                    ly - (vec.vy * len) / 2,
                    lx,
                    ly + (vec.vy * len) / 2,
                );
            }
        }
        p.noStroke();

        // Direction arrow in centre
        p.fill(120, 230, 230, 200);
        p.push();
        p.translate(cx, cy);
        const angle =
            vec.vx !== 0
                ? vec.vx > 0
                    ? 0
                    : Math.PI
                : vec.vy > 0
                  ? Math.PI / 2
                  : -Math.PI / 2;
        p.rotate(angle);
        p.triangle(8, 0, -5, -5, -5, 5);
        p.pop();

        p.stroke(60, 185, 185, 100);
        p.strokeWeight(1);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 4);
        p.noStroke();
    }

    static drawGhost(p, x, y, direction = WindDir.RIGHT, sprite = null) {
        const T = GameConfig.TILE;
        if (sprite) {
            p.push();
            p.tint(255, 140);
            p.image(sprite, x, y, T, T, 0, 0, 32, 32);
            p.pop();
        }
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
