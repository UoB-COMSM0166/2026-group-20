import { GameConfig } from '../config/GameConfig.js';
import { aabbIntersects } from '../systems/PhysicsSystem.js';

/**
 * A collectible coin placed in the world.
 *
 * Rules:
 *   - Touching a coin adds its value to the player's round coin tally.
 *   - Round coins are banked into the wallet only if the player finishes.
 *   - If the player fails, round coins are reset to zero (see ScoreManager).
 */
export class Coin {
    /**
     * @param {p5} p
     * @param {number} x - World x position (pixels, top-left of bounding box)
     * @param {number} y - World y position (pixels, top-left of bounding box)
     * @param {number} value - How many coins this pickup is worth (default 1)
     * @param {p5.Image|null} spriteImage - Optional animated coin spritesheet
     * @param visualOffsetX
     */
    constructor(
        p,
        x,
        y,
        value = GameConfig.COIN_VALUE,
        spriteImage = null,
        visualOffsetX = 0,
    ) {
        this.p = p;
        this.x = x;
        this.y = y;
        this.w = GameConfig.TILE * 0.5;
        this.h = GameConfig.TILE * 0.5;
        this.value = value;
        this.collected = false;
        this.spriteImage = spriteImage;
        this.visualOffsetX = visualOffsetX;

        // Randomised offset so coins don't all bob in sync
        this._baseY = y;
        this._age = Math.random() * Math.PI * 2;
    }

    /**
     * Check for player overlap each frame; collect on first hit.
     * @param {Player[]} players
     * @param {ScoreManager} scoreManager
     */
    update(players, scoreManager) {
        if (this.collected) return;

        this._age += 0.05;

        for (const player of players) {
            if (
                !aabbIntersects(
                    player.x,
                    player.y,
                    player.w,
                    player.h,
                    this.x,
                    this.y,
                    this.w,
                    this.h,
                )
            )
                continue;

            this.collected = true;
            scoreManager.collectCoin(player, this);
            break;
        }
    }

    static FRAME_SIZE = 16;
    static ANIM_SPEED = 8;

    /**
     * Draw a bobbing coin. Uses the spritesheet when available.
     */
    draw() {
        if (this.collected) return;

        const p = this.p;
        const bobY = this._baseY + Math.sin(this._age) * 3;
        const drawW = this.w * 2;
        const drawH = this.h * 2;
        const drawX = this.x + (this.w - drawW) / 2 + this.visualOffsetX;
        const liftY = this.h * 0.75;
        const drawY = bobY + (this.h - drawH) / 2 - liftY;

        if (this.spriteImage) {
            const frameSize = Coin.FRAME_SIZE;
            const totalFrames = Math.max(
                1,
                Math.floor(this.spriteImage.width / frameSize),
            );
            const frameIndex =
                Math.floor(p.frameCount / Coin.ANIM_SPEED) % totalFrames;
            const sx = frameIndex * frameSize;
            p.image(
                this.spriteImage,
                drawX,
                drawY,
                drawW,
                drawH,
                sx,
                0,
                frameSize,
                frameSize,
            );
            return;
        }

        const cx = drawX + drawW / 2;
        const cy = drawY + drawH / 2;
        p.noStroke();
        p.fill(255, 200, 0);
        p.circle(cx, cy, drawW);
        p.fill(255, 240, 120, 200);
        p.circle(cx - drawW * 0.12, cy - drawH * 0.12, drawW * 0.4);
    }

    /**
     * Reset so this coin can be collected again (called at round start).
     */
    reset() {
        this.collected = false;
        this._age = Math.random() * Math.PI * 2;
    }
}
