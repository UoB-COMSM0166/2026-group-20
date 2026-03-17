import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * IcePlatform — a solid platform that removes horizontal friction.
 *
 * When a player is standing on top, their slideMode flag is set each frame,
 * which causes Player.horizontalMovement() to preserve momentum instead of
 * zeroing velocity. The result: players slide when they stop pressing input.
 *
 * @extends Obstacle
 */
export class IcePlatform extends Obstacle {

    get isSolid()  { return true; }
    get isHazard() { return false; }

    applyEffect(player) {
        // Set slideMode if player is standing on the top surface
        const onTop = player.onGround &&
                      Math.abs((player.y + player.h) - this.y) <= 4 &&
                      aabbIntersects(player.x, player.y, player.w, player.h,
                                     this.x, this.y, this.w, this.h);
        if (onTop) player.slideMode = true;
    }

    draw() {
        const p = this.p;
        p.noStroke();

        // Icy body
        p.fill(160, 220, 245);
        p.rect(this.x, this.y, this.w, this.h, 3);

        // Sheen highlight
        p.fill(220, 245, 255, 200);
        p.rect(this.x + 3, this.y + 3, this.w - 6, this.h * 0.25, 2);

        // Glint dots
        p.fill(255, 255, 255, 160);
        p.circle(this.x + this.w * 0.25, this.y + this.h * 0.55, 4);
        p.circle(this.x + this.w * 0.65, this.y + this.h * 0.7, 3);

        p.stroke(100, 180, 220);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
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
