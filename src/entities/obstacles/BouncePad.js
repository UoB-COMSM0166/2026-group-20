import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * BouncePad — a solid springboard that launches players upward.
 *
 * When a player's feet touch the top surface, applyEffect() overrides their
 * vy with BOUNCE_PAD_FORCE and clears onGround so the launch takes effect
 * next physics step. The pad animates a compression/extension cycle.
 *
 * @extends Obstacle
 */
export class BouncePad extends Obstacle {

    constructor(p, x, y) {
        super(p, x, y);
        this._compressTimer = 0; // ms of compression animation remaining
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    update(deltaTime) {
        if (this._compressTimer > 0) {
            this._compressTimer -= deltaTime;
        }
    }

    applyEffect(player) {
        // Same feet-based check as IcePlatform — aabbIntersects returns false
        // because physics resolves player feet to obs.y - skin (0.01px above top).
        const feetY = player.y + player.h;
        const onTop = player.onGround &&
                      feetY >= this.y - 2 && feetY <= this.y + 4 &&
                      player.x + player.w > this.x + 2 &&
                      player.x < this.x + this.w - 2;
        if (!onTop) return;

        player.vy       = GameConfig.BOUNCE_PAD_FORCE;
        player.onGround = false;
        player.jumpsLeft = player.maxJumps;
        this._compressTimer = 200;
    }

    draw() {
        const p    = this.p;
        const T    = GameConfig.TILE;
        // Compress animation: squish pad slightly
        const comp = this._compressTimer > 0
            ? Math.sin((this._compressTimer / 200) * Math.PI) * 0.35
            : 0;

        p.noStroke();

        // Base (dark)
        p.fill(40, 90, 50);
        p.rect(this.x, this.y + T * 0.55, this.w, T * 0.45, 2);

        // Spring coil lines
        p.stroke(60, 130, 70);
        p.strokeWeight(2);
        const coilY1 = this.y + T * 0.32 + comp * T * 0.1;
        const coilY2 = this.y + T * 0.48 + comp * T * 0.05;
        p.line(this.x + T * 0.2, coilY1, this.x + T * 0.8, coilY1);
        p.line(this.x + T * 0.2, coilY2, this.x + T * 0.8, coilY2);
        p.noStroke();

        // Top pad (bright green, squished when compressed)
        const padH = T * (0.28 - comp * 0.14);
        p.fill(80, 200, 100);
        p.rect(this.x + 2, this.y + T * 0.25 + comp * T * 0.15, this.w - 4, padH, 3);

        // Sheen
        p.fill(160, 255, 170, 120);
        p.rect(this.x + 4, this.y + T * 0.27 + comp * T * 0.15, this.w - 8, padH * 0.35, 2);
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(80, 200, 100, 120);
        p.rect(x + 2, y + T * 0.25, T - 4, T * 0.28, 3);
        p.fill(40, 90, 50, 120);
        p.rect(x, y + T * 0.55, T, T * 0.45, 2);
    }
}
