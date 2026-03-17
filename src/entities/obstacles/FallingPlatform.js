import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * FallingPlatform — solid until a player stands on it.
 *
 * After FALLING_PLATFORM_TRIGGER_MS ms of contact, the platform drops with
 * gravity and becomes non-solid. It resets to its starting position once it
 * falls off-screen.
 *
 * @extends Obstacle
 */
export class FallingPlatform extends Obstacle {

    constructor(p, x, y) {
        super(p, x, y);
        this._startY       = y;
        this._falling      = false;
        this._vy           = 0;
        this._standTimer   = 0;
        this._playerOnTop  = false; // set each frame by applyEffect, read by update
        this._shakeOffset  = 0;     // visual shake while about to fall
    }

    get isSolid()  { return !this._falling; }
    get isHazard() { return false; }

    update(deltaTime, _gameWidth, gameHeight) {
        if (this._falling) {
            this._vy  += GameConfig.FALLING_PLATFORM_GRAVITY;
            this.y    += this._vy;
            this._shakeOffset = 0;

            // Reset once it drops off-screen
            if (this.y > (gameHeight ?? 800) + 60) {
                this.y           = this._startY;
                this._falling    = false;
                this._vy         = 0;
                this._standTimer = 0;
            }
            this._playerOnTop = false;
            return;
        }

        // Accumulate stand time while player is on top
        if (this._playerOnTop) {
            this._standTimer += deltaTime;
            // Visual shake in the last quarter of the trigger window
            const ratio = this._standTimer / GameConfig.FALLING_PLATFORM_TRIGGER_MS;
            if (ratio > 0.6) {
                this._shakeOffset = (Math.random() - 0.5) * 3 * ratio;
            }
            if (this._standTimer >= GameConfig.FALLING_PLATFORM_TRIGGER_MS) {
                this._falling = true;
            }
        } else {
            this._standTimer  = 0;
            this._shakeOffset = 0;
        }

        this._playerOnTop = false; // reset; applyEffect will re-set if player is on it
    }

    applyEffect(player) {
        if (this._falling) return;
        // Check player is standing on top surface
        const onTop = player.onGround &&
                      Math.abs((player.y + player.h) - this.y) <= 4 &&
                      aabbIntersects(player.x, player.y, player.w, player.h,
                                     this.x, this.y, this.w, this.h);
        if (onTop) this._playerOnTop = true;
    }

    draw() {
        const p  = this.p;
        const ox = this._shakeOffset;
        p.noStroke();

        // Crack lines (more visible as timer progresses)
        const crackAlpha = Math.min(255, (this._standTimer / GameConfig.FALLING_PLATFORM_TRIGGER_MS) * 300);

        // Body — dark brown
        p.fill(90, 65, 40);
        p.rect(this.x + ox, this.y, this.w, this.h, 3);

        // Top highlight
        p.fill(130, 95, 60);
        p.rect(this.x + ox, this.y, this.w, this.h * 0.18, 3);

        // Crack overlay
        if (crackAlpha > 0) {
            p.stroke(50, 30, 15, crackAlpha);
            p.strokeWeight(1);
            p.line(this.x + ox + this.w * 0.3, this.y + 4, this.x + ox + this.w * 0.4, this.y + this.h - 4);
            p.line(this.x + ox + this.w * 0.65, this.y + 4, this.x + ox + this.w * 0.55, this.y + this.h - 4);
            p.noStroke();
        }

        p.stroke(60, 40, 20);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x + ox, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(90, 65, 40, 130);
        p.rect(x, y, T, T, 3);
        p.stroke(130, 95, 60, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, T, T, 3);
        p.noStroke();
    }
}
