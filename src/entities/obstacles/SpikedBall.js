import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';

/**
 * SpikedBall — a placeable hazard spike tile.
 * Kills any player who touches it, same as map 'S' spikes.
 * Rendered as an upward-pointing red triangle.
 */

//build state //shop state
export class SpikedBall extends Obstacle {
    constructor(p, x, y, obstacleSheet) {
        super(p, x, y);
        this.obstacleSheet = obstacleSheet;
        this.spikeW = 40;
        this.spikeH = 40;
    }

    get isHazard() {
        return true;
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        //const frame = this.framesArr[this.frameIndex];

        p.push();
        p.translate(cx, cy);
        p.imageMode(p.CENTER);
        //if (frame) {
        //p.image(this.obstacleSheet, -this.spikeW/2, (-this.spikeH/2), this.spikeW, this.spikeH);
        p.image(this.obstacleSheet, 0, 0, this.spikeW, this.spikeH);
        // }
        //this.frameIndex = (this.frameIndex + 1) % this.framesArr.length;
        p.pop();
        // p.noStroke();
        // p.fill(220, 60, 60);
        // p.triangle(
        //     this.x,           this.y + T,
        //     this.x + T / 2,   this.y + 4,
        //     this.x + T,       this.y + T,
        // );
        // Inner highlight
        //   p.fill(255, 120, 120, 160);
        //   p.triangle(
        //       this.x + T * 0.2,  this.y + T,
        //       this.x + T / 2,    this.y + T * 0.3,
        //       this.x + T * 0.5,  this.y + T,
        //   );
    }

    /**
     * Draw a semi-transparent ghost for placement preview.
     * @param {p5}    p
     * @param {number} x
     * @param {number} y
     */
    static drawGhost(p, x, y, sheet) {
        //spritesheet
        const T = GameConfig.TILE;
        // p.noStroke();
        // p.fill(220, 60, 60, 130);
        // p.triangle(
        //     x,        y + T,
        //     x + T/2,  y + 4,
        //     x + T,    y + T,
        // );
        const frameW = 40;
        const frameH = 40;
        const cx = x + T / 2;
        const cy = y + T / 2;

        p.push();
        p.translate(cx, cy);
        p.tint(255, 150);
        p.imageMode(p.CENTER);
        //p.image(sheet, -frameW/2, -frameH/2, frameW, frameH);
        p.image(sheet, 0, 0, frameW, frameH);
        p.pop();
    }
}
