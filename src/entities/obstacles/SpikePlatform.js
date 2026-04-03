import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { DeathReason } from '../../config/DeathReason.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * SpikePlatform — solid on top, deadly on sides/bottom.
 * Sprite: 160×40, 4 frames of 40×40 — animated.
 */
export class SpikePlatform extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this.frameIndex = 0;
        if (this.obstacleSheet) {
            this.splitAnimation(40, 40);
        }
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    update(deltaTime) {
        if (this.framesArr.length > 1 && this.p.frameCount % 6 === 0) {
            this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;
        }
    }

    applyEffect(player, _allPlayers, respawnManager) {
        const expand = 2;
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                this.x - expand, this.y - expand,
                this.w + expand * 2, this.h + expand * 2)) return;

        const feetY = player.y + player.h;
        const landedFromAbove = feetY >= this.y - 2 && feetY <= this.y + 6;
        if (!landedFromAbove) {
            respawnManager.triggerDeath(player, DeathReason.TRAP);
        }
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.framesArr.length > 0) {
            const frame = this.framesArr[this.frameIndex];
            if (frame) { p.image(frame, this.x, this.y, T, T); return; }
        }

        // Fallback
        p.noStroke();
        p.fill(100, 75, 50);
        p.rect(this.x, this.y, this.w, this.h, 2);
        p.fill(140, 110, 75);
        p.rect(this.x, this.y, this.w, T * 0.18, 2);
        const spikeH = T * 0.28, spikeW = T * 0.22, count = 3;
        p.fill(220, 60, 60);
        for (let i = 0; i < count; i++) {
            const sy = this.y + T * 0.2 + i * (T * 0.8 / count) + (T * 0.8 / count / 2);
            p.triangle(this.x, sy, this.x + spikeH, sy - spikeW / 2, this.x + spikeH, sy + spikeW / 2);
            p.triangle(this.x + this.w, sy, this.x + this.w - spikeH, sy - spikeW / 2, this.x + this.w - spikeH, sy + spikeW / 2);
        }
        for (let i = 0; i < count; i++) {
            const sx = this.x + T * 0.15 + i * (T * 0.7 / count) + (T * 0.7 / count / 2);
            p.triangle(sx, this.y + this.h, sx - spikeW / 2, this.y + this.h - spikeH, sx + spikeW / 2, this.y + this.h - spikeH);
        }
        p.stroke(70, 45, 25);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 2);
        p.noStroke();
    }

    static drawGhost(p, x, y, sheet) {
        const T = GameConfig.TILE;
        if (sheet) {
            p.push();
            p.tint(255, 150);
            p.image(sheet, x, y, T, T, 0, 0, 40, 40);
            p.noTint();
            p.pop();
            return;
        }
        p.noStroke();
        p.fill(100, 75, 50, 120);
        p.rect(x, y, T, T, 2);
        p.fill(220, 60, 60, 120);
        p.triangle(x + T / 2, y + T, x + T * 0.3, y + T * 0.75, x + T * 0.7, y + T * 0.75);
    }
}
