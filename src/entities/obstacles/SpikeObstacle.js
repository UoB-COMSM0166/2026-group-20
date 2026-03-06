import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * SpikeObstacle — a placeable hazard spike tile.
 * Kills any player who touches it, same as map 'S' spikes.
 * Rendered as an upward-pointing red triangle.
 */
export class SpikeObstacle extends Obstacle {
    get isHazard() {
        return true;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;
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
        // Inner highlight
        p.fill(255, 120, 120, 160);
        p.triangle(
            this.x + T * 0.2,
            this.y + T,
            this.x + T / 2,
            this.y + T * 0.3,
            this.x + T * 0.5,
            this.y + T,
        );
    }

    /**
     * Draw a semi-transparent ghost for placement preview.
     * @param {p5}    p
     * @param {number} x
     * @param {number} y
     */
    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        p.noStroke();
        p.fill(220, 60, 60, 130);
        p.triangle(x, y + T, x + T / 2, y + 4, x + T, y + T);
    }
}
