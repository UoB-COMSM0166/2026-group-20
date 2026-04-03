import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * Teleporter — warps player to linked partner.
 * Sprite: 400×40, 10 frames of 40×40 — animated portal.
 */
export class Teleporter extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this.partner    = null;
        this._cooldowns = new Map();
        this._age       = 0;
        this.frameIndex = 0;

        if (this.obstacleSheet) {
            this.splitAnimation(40, 40);
        }
    }

    get isSolid()     { return false; }
    get isHazard()    { return false; }
    get isTeleporter(){ return true;  }

    update(deltaTime) {
        this._age += deltaTime;
        for (const [key, remaining] of this._cooldowns) {
            const next = remaining - deltaTime;
            if (next <= 0) this._cooldowns.delete(key);
            else           this._cooldowns.set(key, next);
        }
        if (this.framesArr.length > 0 && this.p.frameCount % 4 === 0) {
            this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;
        }
    }

    applyEffect(player) {
        if (!this.partner) return;
        if ((this._cooldowns.get(player.playerNo) ?? 0) > 0) return;
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;

        const dest = this.partner;
        player.x   = dest.x + (dest.w - player.w) / 2;
        player.y   = dest.y - player.h;
        player.vx  = 0;
        player.vy  = 0;

        const cd = GameConfig.TELEPORTER_COOLDOWN_MS;
        this._cooldowns.set(player.playerNo, cd);
        this.partner._cooldowns.set(player.playerNo, cd);
    }

    draw() {
        const p      = this.p;
        const T      = GameConfig.TILE;
        const paired = this.partner !== null;

        if (this.framesArr.length > 0) {
            const frame = this.framesArr[this.frameIndex];
            if (frame) {
                p.push();
                if (!paired) p.tint(150, 150, 200, 200); // unpaired = dimmed blue
                p.image(frame, this.x, this.y, T, T);
                p.noTint();
                if (!paired) {
                    // "?" overlay for unpaired
                    p.fill(220, 200, 255, 180);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(14);
                    p.text('?', this.x + T / 2, this.y + T / 2);
                }
                p.pop();
                return;
            }
        }

        // Fallback — animated ring
        const cx = this.x + T / 2, cy = this.y + T / 2;
        p.push();
        p.translate(cx, cy);
        p.rotate(this._age * 0.002);
        p.noFill();
        p.stroke(paired ? 160 : 100, paired ? 80 : 80, paired ? 240 : 140, 200);
        p.strokeWeight(3);
        p.circle(0, 0, T * 0.78);
        p.pop();
        const pulse = 0.7 + 0.3 * Math.sin(this._age * 0.006);
        p.noStroke();
        p.fill(paired ? 120 : 60, paired ? 40 : 40, paired ? 200 : 120, paired ? 160 * pulse : 80);
        p.circle(cx, cy, T * 0.52);
        p.fill(220, 200, 255, paired ? 230 : 120);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(paired ? '⇌' : '?', cx, cy + 1);
        p.noFill();
        p.stroke(paired ? 160 : 100, paired ? 80 : 80, paired ? 240 : 140, 50);
        p.strokeWeight(6);
        p.circle(cx, cy, T * 0.9);
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
        const cx = x + T / 2, cy = y + T / 2;
        p.noStroke();
        p.fill(120, 40, 200, 90);
        p.circle(cx, cy, T * 0.52);
        p.stroke(160, 80, 240, 120);
        p.strokeWeight(3);
        p.noFill();
        p.circle(cx, cy, T * 0.78);
        p.noStroke();
    }
}
