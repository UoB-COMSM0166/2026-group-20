import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { DeathReason } from '../../config/DeathReason.js';

/**
 * Bomb — proximity explosive that clears placed obstacles.
 *
 * When a player comes within BOMB_TRIGGER_RADIUS tiles, the fuse lights.
 * After BOMB_FUSE_MS ms, the bomb explodes:
 *   - Kills players within BOMB_RADIUS tiles.
 *   - Removes nearby placed obstacles from ctx.placedObstacles.
 *
 * The bomb itself is removed from placedObstacles by RunState after explosion
 * (it marks itself with this._exploded = true).
 */
export class Bomb extends Obstacle {

    constructor(p, x, y, ctx) {
        super(p, x, y);
        this._ctx           = ctx;
        this._fuse          = false;
        this._fuseTimer     = 0;
        this._exploded      = false;
        this._flashPhase    = 0;
        this._age           = 0;
        // Explosion flash effect
        this._blastTimer    = 0;   // counts up after explosion
        this._blastDuration = 400; // ms to show flash ring
    }

    get isSolid()  { return !this._exploded; }
    get isHazard() { return false; } // kill handled manually in applyEffect

    update(deltaTime) {
        if (this._exploded) {
            this._blastTimer += deltaTime;
            return;
        }

        this._age += deltaTime;

        if (this._fuse) {
            this._fuseTimer += deltaTime;
            this._flashPhase += deltaTime * 0.015;
            if (this._fuseTimer >= GameConfig.BOMB_FUSE_MS) {
                this._explode();
            }
        }
    }

    applyEffect(player, _allPlayers, respawnManager) {
        const T  = GameConfig.TILE;
        const bx = this.x + this.w / 2;
        const by = this.y + this.h / 2;
        const px = player.x + player.w / 2;
        const py = player.y + player.h / 2;
        const dist = Math.sqrt((px - bx) ** 2 + (py - by) ** 2) / T;

        if (!this._exploded) {
            // Light fuse when player is close enough
            if (!this._fuse && dist <= GameConfig.BOMB_TRIGGER_RADIUS) {
                this._fuse = true;
            }
        } else {
            // After explosion: kill players in blast radius
            if (dist <= GameConfig.BOMB_RADIUS) {
                respawnManager.triggerDeath(player, DeathReason.BOMB);
            }
        }
    }

    draw() {
        if (this._exploded) {
            // Show blast ring for blastDuration ms
            if (this._blastTimer < this._blastDuration) {
                const p = this.p;
                const T = GameConfig.TILE;
                const R = GameConfig.BOMB_RADIUS * T;
                const t = this._blastTimer / this._blastDuration; // 0 → 1
                const alpha = (1 - t) * 200;
                const ringR = R * t * 1.4;
                p.noFill();
                p.stroke(255, 160, 30, alpha);
                p.strokeWeight(6 * (1 - t) + 1);
                p.circle(this._explosionX, this._explosionY, ringR * 2);
                p.stroke(255, 220, 80, alpha * 0.5);
                p.strokeWeight(3);
                p.circle(this._explosionX, this._explosionY, ringR * 1.6);
                p.noStroke();
            }
            return;
        }

        const p  = this.p;
        const T  = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const r  = T * 0.38;

        // Flash red as fuse burns
        const flash = this._fuse
            ? (Math.sin(this._flashPhase * Math.PI) > 0 ? 1 : 0)
            : 0;
        const bodyR = flash ? 255 : 60;
        const bodyG = flash ? 60  : 60;
        const bodyB = flash ? 60  : 60;

        p.noStroke();

        // Shadow
        p.fill(0, 0, 0, 60);
        p.ellipse(cx + 3, cy + r + 4, T * 0.6, T * 0.18);

        // Body
        p.fill(bodyR, bodyG, bodyB);
        p.circle(cx, cy, r * 2);

        // Highlight
        p.fill(255, 255, 255, 60);
        p.circle(cx - r * 0.25, cy - r * 0.3, r * 0.6);

        // Fuse cord
        p.stroke(80, 60, 20);
        p.strokeWeight(2);
        p.noFill();
        p.bezier(cx, cy - r,
                 cx + 5, cy - r - 6,
                 cx + 10, cy - r - 4,
                 cx + 8, cy - r - 10);

        // Fuse spark when lit
        if (this._fuse) {
            const sparkR = 4 + Math.sin(this._age * 0.05) * 2;
            p.noStroke();
            p.fill(255, 200, 50);
            p.circle(cx + 8, cy - r - 10, sparkR);
            p.fill(255, 255, 150);
            p.circle(cx + 8, cy - r - 10, sparkR * 0.5);

            // Countdown text
            const remaining = Math.max(0, (GameConfig.BOMB_FUSE_MS - this._fuseTimer) / 1000);
            p.fill(255, 255, 255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(10);
            p.text(remaining.toFixed(1), cx, cy - T * 0.85);
        }

        p.noStroke();

        // Bomb label
        p.fill(200, 200, 200);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(11);
        p.text('💣', cx, cy + 1);
    }

    static drawGhost(p, x, y) {
        const T  = GameConfig.TILE;
        const cx = x + T / 2;
        const cy = y + T / 2;
        p.noStroke();
        p.fill(60, 60, 60, 130);
        p.circle(cx, cy, T * 0.76);
        p.fill(200, 200, 200, 160);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(20);
        p.text('💣', cx, cy + 1);
    }

    // ── Private ───────────────────────────────────────────────────────────

    _explode() {
        this._exploded   = true;
        this._blastTimer = 0;

        const T      = GameConfig.TILE;
        const R      = GameConfig.BOMB_RADIUS;
        const ctx    = this._ctx;
        // Store explosion centre first (used by blast ring + kill check)
        this._explosionX = this.x + T / 2;
        this._explosionY = this.y + T / 2;
        this._killRadius = R * T;

        // Remove nearby placed obstacles within blast radius (not self — RunState prunes self)
        if (ctx.placedObstacles) {
            const bx = this.x + T / 2;
            const by = this.y + T / 2;
            ctx.placedObstacles = ctx.placedObstacles.filter(obs => {
                if (obs === this) return true; // keep self alive for blast ring + cleanup in RunState
                const ox = obs.x + obs.w / 2;
                const oy = obs.y + obs.h / 2;
                const dist = Math.sqrt((ox - bx) ** 2 + (oy - by) ** 2) / T;
                return dist > R;
            });
        }

        // Fire explosion sound
        ctx.audioManager?.playSound('death');
    }
}
