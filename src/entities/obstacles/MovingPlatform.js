import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * MovingPlatform — slides horizontally on a fixed path, carries standing players.
 * Sprite sheet: 256×8, 8 frames of 32×8 — animated walking platform.
 */
export class MovingPlatform extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this._startX  = x;
        this._dir     = 1;
        this._frameDX = 0;
        this.frameIndex = 0;

        if (this.obstacleSheet) {
            this.splitAnimation(32, 8);
        }
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    update(deltaTime) {
        const dt    = deltaTime / 16.67;
        const prevX = this.x;

        this.x += this._dir * GameConfig.MOVING_PLATFORM_SPEED * dt;

        const rangeEnd = this._startX + GameConfig.MOVING_PLATFORM_RANGE * GameConfig.TILE;
        if (this.x >= rangeEnd)        { this.x = rangeEnd;         this._dir = -1; }
        else if (this.x <= this._startX) { this.x = this._startX;   this._dir =  1; }

        this._frameDX = this.x - prevX;

        if (this.framesArr.length > 0 && this.p.frameCount % 4 === 0) {
            this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;
        }
    }

    carryPlayers(players) {
        if (this._frameDX === 0) return;
        for (const pl of players) {
            if (pl.lifeState !== 'ALIVE') continue;
            const onTop = Math.abs((pl.y + pl.h) - this.y) <= 3 &&
                          pl.x + pl.w > this.x && pl.x < this.x + this.w;
            if (onTop) pl.x += this._frameDX;
        }
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.framesArr.length > 0) {
            const frame = this.framesArr[this.frameIndex];
            if (frame) {
                // Platform sprite is thin (32×8) — scale to full tile width, draw at bottom of tile
                p.image(frame, this.x, this.y + T - 8, this.w, 8);
                return;
            }
        }

        // Fallback
        p.noStroke();
        p.fill(80, 110, 160);
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.fill(120, 155, 210);
        p.rect(this.x, this.y, this.w, this.h * 0.2, 3);
        p.fill(200, 230, 255, 180);
        const ax = this.x + this.w / 2 + this._dir * this.w * 0.2;
        const ay = this.y + this.h / 2;
        const d  = this._dir * 6;
        p.triangle(ax + d, ay, ax - d, ay - 5, ax - d, ay + 5);
        p.stroke(50, 80, 130);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    static drawGhost(p, x, y, sheet) {
        const T = GameConfig.TILE;
        if (sheet) {
            p.push();
            p.tint(255, 150);
            p.image(sheet, x, y + T - 8, T, 8, 0, 0, 32, 8);
            p.noTint();
            p.pop();
            return;
        }
        p.noStroke();
        p.fill(80, 110, 160, 130);
        p.rect(x, y, T, T, 3);
        p.stroke(120, 155, 210, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, T, T, 3);
        p.noStroke();
    }
}
