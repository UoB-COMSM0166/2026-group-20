import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * IceBlock — a special-effect obstacle that is neither solid nor hazardous.
 *
 * Players pass through it freely, but any player within the block's tile
 * bounding box has their slideMode flag set, causing them to slide as if
 * on ice. Visually rendered as a translucent blue block.
 *
 * @extends Obstacle
 */
export class IceBlock extends Obstacle {

    get isSolid()  { return false; }
    get isHazard() { return false; }

    /**
     * preEffect runs BEFORE player.update(), so speedMultiplier and slideMode
     * are available when horizontalMovement() reads them.
     *
     * Effect: player moves 60% faster inside the block, and slides (preserves
     * momentum) when they release input while overlapping it.
     */
    preEffect(player) {
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;
        player.speedMultiplier = 1.6;
        player.slideMode       = true;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        p.noStroke();

        // Translucent icy body
        p.fill(120, 190, 230, 160);
        p.rect(this.x, this.y, this.w, this.h, 4);

        // Inner bright face
        p.fill(200, 235, 255, 100);
        p.rect(this.x + 4, this.y + 4, this.w - 8, this.h - 8, 3);

        // Snowflake / cross detail
        p.stroke(200, 240, 255, 180);
        p.strokeWeight(1.5);
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const r  = T * 0.26;
        p.line(cx - r, cy, cx + r, cy);
        p.line(cx, cy - r, cx, cy + r);
        p.line(cx - r * 0.7, cy - r * 0.7, cx + r * 0.7, cy + r * 0.7);
        p.line(cx + r * 0.7, cy - r * 0.7, cx - r * 0.7, cy + r * 0.7);

        p.stroke(100, 170, 220, 120);
        p.strokeWeight(1);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 4);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(120, 190, 230, 90);
        p.rect(x, y, T, T, 4);
        p.stroke(100, 170, 220, 100);
        p.strokeWeight(1);
        p.noFill();
        p.rect(x, y, T, T, 4);
        p.noStroke();
    }
}
