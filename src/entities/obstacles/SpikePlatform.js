import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { DeathReason } from '../../config/DeathReason.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * SpikePlatform — solid on the top surface, hazard on sides and bottom.
 *
 * Players can land safely on top (physics resolves normally).
 * Touching the sides or bottom triggers death.
 *
 * isHazard is intentionally false here — PhysicsSystem.checkSpikeCollision()
 * would kill from all sides, so directional logic is implemented entirely in
 * applyEffect() which is called by RunState each frame.
 *
 * @extends Obstacle
 */
export class SpikePlatform extends Obstacle {

    get isSolid()  { return true; }
    get isHazard() { return false; } // directional — handled manually in applyEffect

    applyEffect(player, _allPlayers, respawnManager) {
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;

        // Safe zone: player's feet are within 5px of the platform's top edge.
        // Physics has already resolved the position so this is reliable.
        const landedFromAbove = (player.y + player.h) <= (this.y + 5);
        if (!landedFromAbove) {
            respawnManager.triggerDeath(player, DeathReason.TRAP);
        }
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        p.noStroke();

        // Platform body
        p.fill(100, 75, 50);
        p.rect(this.x, this.y, this.w, this.h, 2);

        // Top highlight (safe zone)
        p.fill(140, 110, 75);
        p.rect(this.x, this.y, this.w, T * 0.18, 2);

        // Side / bottom spikes
        const spikeH = T * 0.28;
        const spikeW = T * 0.22;
        const count  = 3;

        p.fill(220, 60, 60);

        // Left spikes (pointing left)
        for (let i = 0; i < count; i++) {
            const sy = this.y + T * 0.2 + i * (T * 0.8 / count) + (T * 0.8 / count / 2);
            p.triangle(
                this.x,          sy,
                this.x + spikeH, sy - spikeW / 2,
                this.x + spikeH, sy + spikeW / 2,
            );
        }

        // Right spikes (pointing right)
        for (let i = 0; i < count; i++) {
            const sy = this.y + T * 0.2 + i * (T * 0.8 / count) + (T * 0.8 / count / 2);
            p.triangle(
                this.x + this.w,          sy,
                this.x + this.w - spikeH, sy - spikeW / 2,
                this.x + this.w - spikeH, sy + spikeW / 2,
            );
        }

        // Bottom spikes (pointing down)
        const bCount = 3;
        const bSpikeW = T * 0.22;
        const bSpikeH = T * 0.26;
        for (let i = 0; i < bCount; i++) {
            const sx = this.x + T * 0.15 + i * (T * 0.7 / bCount) + (T * 0.7 / bCount / 2);
            p.triangle(
                sx,                    this.y + this.h,
                sx - bSpikeW / 2,      this.y + this.h - bSpikeH,
                sx + bSpikeW / 2,      this.y + this.h - bSpikeH,
            );
        }

        p.stroke(70, 45, 25);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 2);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(100, 75, 50, 120);
        p.rect(x, y, T, T, 2);
        p.fill(220, 60, 60, 120);
        p.triangle(x + T / 2, y + T, x + T * 0.3, y + T * 0.75, x + T * 0.7, y + T * 0.75);
    }
}
