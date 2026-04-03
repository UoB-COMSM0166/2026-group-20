import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

export const WindDir = Object.freeze({
    LEFT: 'LEFT', RIGHT: 'RIGHT', UP: 'UP', DOWN: 'DOWN',
});

const DIR_VECTORS = {
    LEFT:  { vx: -1, vy:  0 },
    RIGHT: { vx:  1, vy:  0 },
    UP:    { vx:  0, vy: -1 },
    DOWN:  { vx:  0, vy:  1 },
};

/**
 * WindZone — pushes players in a direction.
 * Sprite: 288×32, 9 frames of 32×32 — animated arrows.
 */
export class WindZone extends Obstacle {

    constructor(p, x, y, direction = WindDir.RIGHT, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this.direction  = direction;
        this._age       = 0;
        this.frameIndex = 0;

        if (this.obstacleSheet) {
            this.splitAnimation(32, 32);
        }
    }

    get isSolid()  { return false; }
    get isHazard() { return false; }

    update(deltaTime) {
        this._age += deltaTime;
        if (this.framesArr.length > 0 && this.p.frameCount % 4 === 0) {
            this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;
        }
    }

    preEffect(player) {
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;
        player.slideMode = true;
        const vec = DIR_VECTORS[this.direction];
        player.vx += vec.vx * GameConfig.WIND_FORCE;
        player.vy += vec.vy * GameConfig.WIND_FORCE;
    }

    draw() {
        const p   = this.p;
        const T   = GameConfig.TILE;
        const cx  = this.x + T / 2;
        const cy  = this.y + T / 2;
        const vec = DIR_VECTORS[this.direction];

        if (this.framesArr.length > 0) {
            const frame = this.framesArr[this.frameIndex];
            if (frame) {
                p.push();
                p.translate(cx, cy);
                // Rotate sprite to match wind direction (sprite points right by default)
                const angle = vec.vx !== 0
                    ? (vec.vx > 0 ? 0 : Math.PI)
                    : (vec.vy > 0 ? Math.PI / 2 : -Math.PI / 2);
                p.rotate(angle);
                p.image(frame, -T / 2, -T / 2, T, T);
                p.pop();
                return;
            }
        }

        // Fallback
        p.noStroke();
        p.fill(60, 185, 185, 70);
        p.rect(this.x, this.y, this.w, this.h, 4);
        const period = 800;
        const phase  = (this._age % period) / period;
        p.stroke(120, 230, 230, 180);
        p.strokeWeight(1.5);
        for (let i = 0; i < 4; i++) {
            const t = (phase + i / 4) % 1;
            const len = T * 0.35;
            if (vec.vx !== 0) {
                const lx = this.x + (vec.vx > 0 ? t * T : (1 - t) * T);
                const ly = this.y + T * (0.2 + i * 0.2);
                p.line(lx - vec.vx * len / 2, ly, lx + vec.vx * len / 2, ly);
            } else {
                const lx2 = this.x + T * (0.2 + i * 0.2);
                const ly2 = this.y + (vec.vy > 0 ? t * T : (1 - t) * T);
                p.line(lx2, ly2 - vec.vy * len / 2, lx2, ly2 + vec.vy * len / 2);
            }
        }
        p.noStroke();
        p.fill(120, 230, 230, 200);
        p.push();
        p.translate(cx, cy);
        const a2 = vec.vx !== 0 ? (vec.vx > 0 ? 0 : Math.PI) : (vec.vy > 0 ? Math.PI / 2 : -Math.PI / 2);
        p.rotate(a2);
        p.triangle(8, 0, -5, -5, -5, 5);
        p.pop();
        p.stroke(60, 185, 185, 100);
        p.strokeWeight(1);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 4);
        p.noStroke();
    }

    static drawGhost(p, x, y, direction = WindDir.RIGHT, sheet) {
        const T = GameConfig.TILE;
        if (sheet) {
            p.push();
            p.tint(255, 150);
            const cx = x + T / 2, cy = y + T / 2;
            p.translate(cx, cy);
            const vec = DIR_VECTORS[direction];
            const angle = vec.vx !== 0
                ? (vec.vx > 0 ? 0 : Math.PI)
                : (vec.vy > 0 ? Math.PI / 2 : -Math.PI / 2);
            p.rotate(angle);
            p.image(sheet, -T / 2, -T / 2, T, T, 0, 0, 32, 32);
            p.noTint();
            p.pop();
            return;
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
