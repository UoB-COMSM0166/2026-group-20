import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

const FRAME_W = 40;
const FRAME_H = 40;
const FRAME_COUNT = 5;
const FRAME_MS = 120;
const ICON_FRAME = 1;

/**
 * SpikeObstacle — a placeable hazard spike tile.
 * Kills any player who touches it, same as map 'S' spikes.
 */
export class SpikeObstacle extends Obstacle {
    constructor(p, x, y, sprite = null) {
        super(p, x, y, sprite);
        this._age = 0;
    }

    get isHazard() {
        return true;
    }

    update(deltaTime) {
        this._age += deltaTime;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;

        if (this.obstacleSheet) {
            const frame = Math.floor(this._age / FRAME_MS) % FRAME_COUNT;
            p.push();
            p.noSmooth();
            p.image(
                this.obstacleSheet,
                this.x,
                this.y,
                T,
                T,
                frame * FRAME_W,
                0,
                FRAME_W,
                FRAME_H,
            );
            p.pop();
            return;
        }

        p.noStroke();
        p.fill(220, 60, 60);
        p.triangle(
            this.x,
            this.y + T,
            this.x + T / 2,
            this.y + 4,
            this.x + T,
            this.y + T,
        );
    }

    /**
     * Draw a semi-transparent ghost for placement preview.
     * @param {p5}    p
     * @param {number} x
     * @param {number} y
     */
    static drawGhost(p, x, y, sprite = null) {
        const T = GameConfig.TILE;
        if (sprite) {
            p.push();
            p.noSmooth();
            p.tint(255, 170);
            p.image(
                sprite,
                x,
                y,
                T,
                T,
                ICON_FRAME * FRAME_W,
                0,
                FRAME_W,
                FRAME_H,
            );
            p.pop();
            return;
        }

        p.noStroke();
        p.fill(220, 60, 60, 130);
        p.triangle(x, y + T, x + T / 2, y + 4, x + T, y + T);
    }
}
