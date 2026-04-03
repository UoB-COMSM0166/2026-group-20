import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * IcePlatform — solid, zero friction.
 * Sprite: single 40×40 image.
 */
export class IcePlatform extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    applyEffect(player) {
        const feetY = player.y + player.h;
        const onTop = player.onGround &&
                      feetY >= this.y - 2 && feetY <= this.y + 4 &&
                      player.x + player.w > this.x + 2 &&
                      player.x < this.x + this.w - 2;
        if (onTop) player.slideMode = true;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.obstacleSheet) {
            p.image(this.obstacleSheet, this.x, this.y, T, T);
            return;
        }

        p.noStroke();
        p.fill(160, 220, 245);
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.fill(220, 245, 255, 200);
        p.rect(this.x + 3, this.y + 3, this.w - 6, this.h * 0.25, 2);
        p.fill(255, 255, 255, 160);
        p.circle(this.x + this.w * 0.25, this.y + this.h * 0.55, 4);
        p.circle(this.x + this.w * 0.65, this.y + this.h * 0.7, 3);
        p.stroke(100, 180, 220);
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
        p.fill(160, 220, 245, 130);
        p.rect(x, y, T, T, 3);
        p.stroke(100, 180, 220, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, T, T, 3);
        p.noStroke();
    }
}
