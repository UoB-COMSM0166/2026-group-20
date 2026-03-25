import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * MovingPlatform — a solid platform that slides horizontally on a fixed path.
 *
 * Travels from its spawn position to spawn + MOVING_PLATFORM_RANGE tiles, then
 * reverses. Players standing on top are carried along each frame (carryPlayers
 * is called by RunState before player.update() so physics resolves correctly).
 *
 * @extends Obstacle
 */
export class MovingPlatform extends Obstacle {

    constructor(p, x, y) {
        super(p, x, y);
        this._startX   = x;
        this._dir      = 1;   // 1 = right, -1 = left
        this._frameDX  = 0;   // displacement this frame, used by carryPlayers
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    update(deltaTime) {
        const dt   = deltaTime / 16.67; // normalise to 60 fps
        const prevX = this.x;

        this.x += this._dir * GameConfig.MOVING_PLATFORM_SPEED * dt;

        const rangeEnd = this._startX + GameConfig.MOVING_PLATFORM_RANGE * GameConfig.TILE;
        if (this.x >= rangeEnd) {
            this.x   = rangeEnd;
            this._dir = -1;
        } else if (this.x <= this._startX) {
            this.x   = this._startX;
            this._dir = 1;
        }

        this._frameDX = this.x - prevX;
    }

    /**
     * Push any player standing on top by the same amount the platform moved.
     * Must be called BEFORE player.update() each frame.
     * @param {object[]} players
     */
    carryPlayers(players) {
        if (this._frameDX === 0) return;
        for (const pl of players) {
            if (pl.lifeState !== 'ALIVE') continue;
            const onTop = Math.abs((pl.y + pl.h) - this.y) <= 3 &&
                          pl.x + pl.w > this.x &&
                          pl.x < this.x + this.w;
            if (onTop) pl.x += this._frameDX;
        }
    }

    draw() {
        const p = this.p;
        p.noStroke();

        // Body — blue-tinted plank
        p.fill(80, 110, 160);
        p.rect(this.x, this.y, this.w, this.h, 3);

        // Top highlight
        p.fill(120, 155, 210);
        p.rect(this.x, this.y, this.w, this.h * 0.2, 3);

        // Arrow indicator showing current direction
        p.fill(200, 230, 255, 180);
        const arrowX = this.x + this.w / 2 + (this._dir * this.w * 0.2);
        const arrowY = this.y + this.h / 2;
        const d = this._dir * 6;
        p.triangle(arrowX + d, arrowY, arrowX - d, arrowY - 5, arrowX - d, arrowY + 5);

        p.stroke(50, 80, 130);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(this.x, this.y, this.w, this.h, 3);
        p.noStroke();
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(80, 110, 160, 130);
        p.rect(x, y, T, T, 3);
        p.stroke(120, 155, 210, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(x, y, T, T, 3);
        p.noStroke();
    }
}
