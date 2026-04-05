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

       p.pop();
    }

    static drawGhost(p, x, y, sheet) {
        const T  = GameConfig.TILE;
        const cx = x + T / 2;
        const cy = y + T;
        const frameW = 16;
        const frameH = 32;
        p.push(); 
        p.translate(cx, cy);
        p.tint(255, 150);
        p.image(sheet, -frameW/2, -frameH, frameW, frameH, 0, 0, frameW, frameH);
        p.pop();

    }
}
