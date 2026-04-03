import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * Platform — a solid 1-tile block.
 * Uses sprite when sheet provided, falls back to programmatic draw.
 */
export class Platform extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
    }

    get isSolid() { return true; }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.obstacleSheet) {
            p.image(this.obstacleSheet, this.x, this.y, T, T);
            return;
        }

        p.noStroke();
        p.fill(120, 90, 60);
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.fill(160, 125, 85);
        p.rect(this.x, this.y, this.w, this.h * 0.2, 3);
        p.stroke(80, 55, 30);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    static drawGhost(p, x, y, sheet) {
        const T = GameConfig.TILE;
        if (sheet) {
            p.push();
            p.tint(255, 150);
            p.image(sheet, x, y, T, T);
            p.noTint();
            p.pop();
            return;
        }
        p.noStroke();
        p.fill(120, 90, 60, 130);
        p.rect(x, y, T, T, 3);
        p.stroke(160, 125, 85, 180);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, T, T, 3);
        p.noStroke();
    }
}
