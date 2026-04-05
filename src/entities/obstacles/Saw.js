import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * Saw — a spinning circular blade placeable during the Build phase.
 *
 * The blade rotates continuously and kills any player who touches it.
 * Unlike SpikeObstacle it is not solid — players pass through and die.
 *
 * The hazard hitbox is the full tile AABB (same as all other obstacles),
 * so PhysicsSystem.checkSpikeCollision() picks it up via isHazard with
 * no extra code needed in RunState or PhysicsSystem.
 *
 * @extends Obstacle
 *
 * @example
 *   const saw = new Saw(p, 6 * TILE, 3 * TILE);
 *   // in update loop:
 *   saw.update(deltaTime);
 *   saw.draw();
 */
export class Saw extends Obstacle {

    /**
     * @param {p5}    p
     * @param {number} x - World x (top-left, tile-snapped)
     * @param {number} y - World y (top-left, tile-snapped)
     */
    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this._angle = 0;
        this.obstacleSheet = obstacleSheet;
        this.frameIndex=0;
        this.sawWidth=38;
        this.sawHeight=38;
        this.splitAnimation(this.sawWidth, this.sawHeight); 
    }

    // ── Obstacle interface ────────────────────────────────────────────────

    /** The blade does not block movement — you pass through and die. */
    get isSolid()  { return false; }

    /** Any contact with the spinning blade kills the player. */
    get isHazard() { return true; }

    // ── Per-frame ─────────────────────────────────────────────────────────

    /**
     * Advance the blade rotation.
     * @param {number} deltaTime - ms since last frame
     */
    update(deltaTime) {
        this._angle += GameConfig.SAW_ROTATION_SPEED * deltaTime;
    }

    // ── Rendering ─────────────────────────────────────────────────────────

    /**
     * Draw the spinning saw blade centred on the tile.
     */
    draw() {
        const p  = this.p;
        const T  = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const frame = this.framesArr[this.frameIndex];

        p.push();
        p.translate(cx, cy);
         if (frame) {
            p.image(frame, -frame.width / 2, -frame.height / 2);  // centred at origin
         }
         this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;

        p.pop();
    }

    // ── Build-phase ghost 

    /**
     * Draw a semi-transparent placement preview (no rotation).
     * @param {p5}    p
     * @param {number} x
     * @param {number} y
     */
    static drawGhost(p, x, y, sheet) {
        const T  = GameConfig.TILE;
        const frameW = 38;
        const frameH = 38;
        p.push();
        p.tint(255, 150);
        p.image(sheet, x, y, T, T, 0, 0, frameW, frameH);
        p.pop();
    }

    // ── Private ───────────────────────────────────────────────────────────

    /**
     * Draw the blade body — disc, teeth, and hub — centred at origin.
     * Called inside a push/translate/rotate block.
     * @param {p5}    p
     * @param {number} T - tile size
     * @private
     */
    _drawBlade(p, T) {
        const outerR     = T * 0.42;
        const innerR     = T * 0.28;
        const toothR     = T * 0.16;
        const hubR       = T * 0.12;
        const toothCount = GameConfig.SAW_TOOTH_COUNT;

        // Base disc
        p.fill(200, 200, 210);
        p.circle(0, 0, outerR * 2);

        // Teeth — small circles evenly spaced around the outer edge
        p.fill(220, 60, 60);
        const step = (Math.PI * 2) / toothCount;
        for (let i = 0; i < toothCount; i++) {
            const a  = i * step;
            const tx = Math.cos(a) * outerR;
            const ty = Math.sin(a) * outerR;
            p.circle(tx, ty, toothR * 2);
        }

        // Inner disc — covers the base of the teeth to give a clean blade look
        p.fill(180, 180, 190);
        p.circle(0, 0, innerR * 2);

        // Radial lines on the disc face
        p.stroke(150, 150, 160);
        p.strokeWeight(1);
        const lineCount = toothCount / 2;
        const lineStep  = (Math.PI * 2) / lineCount;
        for (let i = 0; i < lineCount; i++) {
            const a = i * lineStep;
            p.line(
                Math.cos(a) * hubR,
                Math.sin(a) * hubR,
                Math.cos(a) * innerR,
                Math.sin(a) * innerR,
            );
        }
        p.noStroke();

        // Hub
        p.fill(100, 100, 110);
        p.circle(0, 0, hubR * 2);

        // Hub glint
        p.fill(200, 200, 210, 180);
        p.circle(-hubR * 0.3, -hubR * 0.3, hubR * 0.7);
    }
}
