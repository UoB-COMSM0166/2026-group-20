import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * Platform — a solid 1-tile block placeable during the Build phase.
 * Blocks player movement on all sides (treated like a '#' map tile).
 */
export class Platform extends Obstacle {
    get isSolid() { return true; }

    draw() {
        const p = this.p;
        p.noStroke();

        // Main face
        p.fill(120, 90, 60);
        p.rect(this.x, this.y, this.w, this.h, 3);

        // Top highlight (gives a slight 3D feel)
        p.fill(160, 125, 85);
        p.rect(this.x, this.y, this.w, this.h * 0.2, 3);

        // Outline to distinguish from map tiles
        p.stroke(80, 55, 30);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    /**
     * Draw a semi-transparent ghost for placement preview.
     * @param {p5}    p
     * @param {number} x
     * @param {number} y
     */
    static drawGhost(p, x, y) {
        p.noStroke();
        p.fill(120, 90, 60, 130);
        p.rect(x, y, GameConfig.TILE, GameConfig.TILE, 3);
        p.stroke(160, 125, 85, 180);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, GameConfig.TILE, GameConfig.TILE, 3);
        p.noStroke();
    }
}
