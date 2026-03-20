import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { DeathReason } from '../../config/DeathReason.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * Flame — a hazard that pulses active and inactive on a fixed timer.
 *
 * When active (isHazard = true) it kills on contact.
 * When inactive it is harmless and visually shrinks to an ember.
 * The flame is never solid — players pass through it.
 *
 * PhysicsSystem.checkSpikeCollision() already reads isHazard, so this
 * obstacle integrates with the existing kill path with no RunState changes
 * beyond the normal applyEffect loop.
 *
 * @extends Obstacle
 */
export class Flame extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y);
        this._timer    = 0;
        this._active   = true; // starts active
        this._age      = 0;    // used for flicker animation
        this.obstacleSheet = obstacleSheet;
        this.frameIndex=0;
        this.sawWidth=16;
        this.sawHeight=32;
        this.splitAnimation(this.sawWidth, this.sawHeight); 
    }

    get isSolid()  { return false; }
    get isHazard() { return this._active; }

    update(deltaTime) {
        this._timer += deltaTime;
        this._age   += deltaTime;

        const limit = this._active ? GameConfig.FLAME_ON_MS : GameConfig.FLAME_OFF_MS;
        if (this._timer >= limit) {
            this._active = !this._active;
            this._timer  = 0;
        }
    }

    // isHazard already handles the kill via checkSpikeCollision in PhysicsSystem.
    // applyEffect is unused for Flame but defined for completeness.
    applyEffect(_player, _allPlayers, _respawnManager, _obstacles) {}

    draw() {
        const p   = this.p;
        const T   = GameConfig.TILE;
        const cx  = this.x + T / 2;
        const cy  = this.y + T;
        const frame = this.framesArr[this.frameIndex];
      
        p.push();
        p.translate(cx, cy);
        if (frame) {
            p.image(frame, -frame.width/2, -frame.height);  
         }
         this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;


        // Base embers (always visible)
      //   p.noStroke();
      //   p.fill(180, 80, 20, 200);
      //   p.circle(cx, cy - 4, 10);
      //   p.fill(220, 120, 30, 180);
      //   p.circle(cx - 5, cy - 2, 7);
      //   p.circle(cx + 4, cy - 3, 6);

      //   if (!this._active) return; // inactive — only embers shown

      //   // Flicker offset
      //   const flicker = Math.sin(this._age * 0.018) * 3;
      //   const phase   = this._timer / GameConfig.FLAME_ON_MS;

      //   // Outer flame (large, orange)
      //   p.fill(240, 100, 20, 200);
      //   p.ellipse(cx + flicker * 0.5, cy - T * 0.45, T * 0.65, T * 0.9);

      //   // Mid flame (yellow-orange)
      //   p.fill(255, 180, 40, 220);
      //   p.ellipse(cx - flicker * 0.3, cy - T * 0.52, T * 0.42, T * 0.72);

      //   // Inner core (bright yellow-white)
      //   p.fill(255, 240, 120, 240);
      //   p.ellipse(cx + flicker * 0.1, cy - T * 0.55, T * 0.22, T * 0.42);

      //   // Fade-out near end of active period
      //   if (phase > 0.75) {
      //       const fadeAlpha = (1 - phase) / 0.25 * 160;
      //       p.fill(20, 20, 20, fadeAlpha);
      //       p.ellipse(cx, cy - T * 0.45, T * 0.65, T * 0.9);
      //   }

       p.pop();
    }

    static drawGhost(p, x, y) {
        const T  = GameConfig.TILE;
        const cx = x + T / 2;
        const cy = y + T;
        p.noStroke();
        p.fill(240, 100, 20, 100);
        p.ellipse(cx, cy - T * 0.45, T * 0.65, T * 0.9);
        p.fill(255, 180, 40, 120);
        p.ellipse(cx, cy - T * 0.52, T * 0.42, T * 0.72);
    }
}
