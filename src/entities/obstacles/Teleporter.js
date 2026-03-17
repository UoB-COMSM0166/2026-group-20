import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * Teleporter — warps a player to a paired partner Teleporter.
 *
 * Pairing: BuildState sets obs.partner on both portals when the second one is
 * placed. An unpaired Teleporter is displayed differently and does nothing.
 *
 * Cooldown: after teleporting, the player cannot be teleported again for
 * TELEPORTER_COOLDOWN_MS ms (stored per playerNo). Both portals share the
 * cooldown so the player does not immediately bounce back.
 *
 * @extends Obstacle
 */
export class Teleporter extends Obstacle {

    constructor(p, x, y) {
        super(p, x, y);
        /** @type {Teleporter|null} */
        this.partner   = null;
        // Map<playerNo, remaining cooldown ms>
        this._cooldowns = new Map();
        this._age       = 0;
    }

    get isSolid()    { return false; }
    get isHazard()   { return false; }
    get isTeleporter(){ return true; }

    update(deltaTime) {
        this._age += deltaTime;
        for (const [key, remaining] of this._cooldowns) {
            const next = remaining - deltaTime;
            if (next <= 0) this._cooldowns.delete(key);
            else           this._cooldowns.set(key, next);
        }
    }

    applyEffect(player) {
        if (!this.partner) return;
        if ((this._cooldowns.get(player.playerNo) ?? 0) > 0) return;
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;

        // Teleport player to partner position, centred, standing just above it
        const dest = this.partner;
        player.x   = dest.x + (dest.w - player.w) / 2;
        player.y   = dest.y - player.h;
        player.vx  = 0;
        player.vy  = 0;

        // Apply cooldown on BOTH portals so no immediate bounce-back
        const cd = GameConfig.TELEPORTER_COOLDOWN_MS;
        this._cooldowns.set(player.playerNo, cd);
        this.partner._cooldowns.set(player.playerNo, cd);
    }

    draw() {
        const p   = this.p;
        const T   = GameConfig.TILE;
        const cx  = this.x + T / 2;
        const cy  = this.y + T / 2;
        const paired = this.partner !== null;

        // Spinning ring
        p.push();
        p.translate(cx, cy);
        p.rotate(this._age * 0.002);

        p.noFill();
        p.stroke(paired ? 160 : 100, paired ? 80 : 80, paired ? 240 : 140, 200);
        p.strokeWeight(3);
        p.circle(0, 0, T * 0.78);

        // Inner dashes
        p.strokeWeight(2);
        for (let i = 0; i < 6; i++) {
            const a = (i / 6) * Math.PI * 2;
            const r1 = T * 0.26;
            const r2 = T * 0.34;
            p.line(Math.cos(a) * r1, Math.sin(a) * r1,
                   Math.cos(a) * r2, Math.sin(a) * r2);
        }
        p.pop();

        // Inner fill — pulsing
        const pulse  = 0.7 + 0.3 * Math.sin(this._age * 0.006);
        const alpha  = paired ? 160 * pulse : 80;
        p.noStroke();
        p.fill(paired ? 120 : 60, paired ? 40 : 40, paired ? 200 : 120, alpha);
        p.circle(cx, cy, T * 0.52);

        // Centre symbol
        p.fill(220, 200, 255, paired ? 230 : 120);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text(paired ? '⇌' : '?', cx, cy + 1);

        // Outer glow ring
        p.noFill();
        p.stroke(paired ? 160 : 100, paired ? 80 : 80, paired ? 240 : 140, 50);
        p.strokeWeight(6);
        p.circle(cx, cy, T * 0.9);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T  = GameConfig.TILE;
        const cx = x + T / 2;
        const cy = y + T / 2;
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
