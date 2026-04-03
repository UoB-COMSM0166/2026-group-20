import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * IceBlock — neither solid nor hazard; gives speedMultiplier + slideMode.
 * Sprite: single 40×40 image drawn translucently.
 */
export class IceBlock extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
    }

    get isSolid()  { return false; }
    get isHazard() { return false; }

    preEffect(player) {
        if (!aabbIntersects(player.x, player.y, player.w, player.h,
                             this.x, this.y, this.w, this.h)) return;
        player.speedMultiplier = 1.6;
        player.slideMode       = true;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.obstacleSheet) {
            p.push();
            p.tint(255, 180); // slightly translucent so it looks passable
            p.image(this.obstacleSheet, this.x, this.y, T, T);
            p.noTint();
            p.pop();
            return;
        }

        p.noStroke();
        p.fill(120, 190, 230, 160);
        p.rect(this.x, this.y, this.w, this.h, 4);
        p.fill(200, 235, 255, 100);
        p.rect(this.x + 4, this.y + 4, this.w - 8, this.h - 8, 3);
        const cx = this.x + T / 2, cy = this.y + T / 2, r = T * 0.26;
        p.stroke(200, 240, 255, 180);
        p.strokeWeight(1.5);
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

    static drawGhost(p, x, y, sheet) {
        const T = GameConfig.TILE;
        if (sheet) {
            p.push();
            p.tint(255, 110);
            p.image(sheet, x, y, T, T);
            p.noTint();
            p.pop();
            return;
        }
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
