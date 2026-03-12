import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { Platform } from '../entities/obstacles/Platform.js';
import { SpikeObstacle } from '../entities/obstacles/SpikeObstacle.js';
import { Cannon, CannonDir } from '../entities/obstacles/Cannon.js';
import { Saw } from '../entities/obstacles/Saw.js';
import { drawMap, MAP } from '../maps/MapLoader.js';

// Map tile characters that cannot be overwritten when placing obstacles
const BLOCKED_TILES = new Set(['#', 'S', 'F', 'C']);

/**
 * BuildState — the obstacle placement phase.
 *
 * Players select an obstacle type from the bottom palette and click
 * anywhere on the open map to place it, snapped to the tile grid.
 * Right-click removes a placed obstacle.
 *
 * The placed obstacles are stored in ctx.placedObstacles, which RunState
 * reads directly — so they persist into (and only into) the next run.
 *
 * Controls:
 *   Left click on palette  — select obstacle type
 *   Left click on map      — place selected obstacle
 *   Right click on map     — remove obstacle at that tile
 *   ENTER                  — start run (→ RunState)
 *   ESC                    — return to map menu
 *
 * Transitions:
 *   ENTER → RunState
 *   ESC   → MapMenuState
 */
export class BuildState extends State {

    // ── Palette definition ────────────────────────────────────────────────
    static PALETTE = [
        {
            type:  ObstacleType.PLATFORM,
            label: 'Platform',
            hint:  'Solid block',
            color: [120, 90, 60],
        },
        {
            type:  ObstacleType.SPIKE,
            label: 'Spike',
            hint:  'Kills on touch',
            color: [220, 60, 60],
        },
        {
            type:  ObstacleType.CANNON,
            label: 'Cannon',
            hint:  'Fires projectiles',
            color: [70, 70, 80],
        },
        {
            type:  ObstacleType.SAW,
            label: 'Saw',
            hint:  'Spinning blade',
            color: [200, 60, 60],
        },
    ];

    enter() {
        this.ctx.placedObstacles.length = 0;
        this._selectedType = null;
        this._cannonDir    = CannonDir.RIGHT; // default direction for cannon placement
    }

    update(_dt) {}

    // ── Token helpers ─────────────────────────────────────────────────────

    /**
     * Returns true when the shop has run at least once.
     * Round 1 (shopPurchases === null) uses free placement.
     * @private
     */
    _isShopMode() {
        return this.ctx.shopPurchases !== null;
    }

    /**
     * Number of remaining tokens for a given type in the purchase pool.
     * In free mode always returns Infinity.
     * @param {string} type - ObstacleType
     * @returns {number}
     * @private
     */
    _tokenCount(type) {
        if (!this._isShopMode()) return Infinity;
        return this.ctx.shopPurchases.filter(t => t === type).length;
    }

    /**
     * Consume one token of the given type from the pool.
     * No-op in free mode.
     * @param {string} type
     * @private
     */
    _consumeToken(type) {
        if (!this._isShopMode()) return;
        const idx = this.ctx.shopPurchases.indexOf(type);
        if (idx !== -1) this.ctx.shopPurchases.splice(idx, 1);
    }

    /**
     * Refund one token of the given type back to the pool.
     * No-op in free mode.
     * @param {string} type
     * @private
     */
    _refundToken(type) {
        if (!this._isShopMode()) return;
        this.ctx.shopPurchases.push(type);
    }

    /**
     * Returns only palette items that have at least one token (or all in free mode).
     * @returns {Array}
     * @private
     */
    _availablePalette() {
        if (!this._isShopMode()) return BuildState.PALETTE;
        return BuildState.PALETTE.filter(item => this._tokenCount(item.type) > 0);
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;

        // ── Background + map ─────────────────────────────────────────────
        p.background(20);
        drawMap(p);

        // ── Already-placed obstacles ─────────────────────────────────────
        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

        // ── Ghost preview (snapped to grid, only over map area) ──────────
        const T       = GameConfig.TILE;
        const snapX   = Math.floor(mx / T) * T;
        const snapY   = Math.floor(my / T) * T;
        const onMap   = snapX >= 0 && snapX < gameWidth && snapY >= 0 && snapY < gameHeight - this._paletteH();

        if (this._selectedType && onMap && !this._isTileBlocked(snapX, snapY)) {
            if (this._selectedType === ObstacleType.PLATFORM) {
                Platform.drawGhost(p, snapX, snapY);
            } else if (this._selectedType === ObstacleType.SPIKE) {
                SpikeObstacle.drawGhost(p, snapX, snapY);
            } else if (this._selectedType === ObstacleType.CANNON) {
                Cannon.drawGhost(p, snapX, snapY, this._cannonDir);
            } else if (this._selectedType === ObstacleType.SAW) {
                Saw.drawGhost(p, snapX, snapY);
            }
        }

        // ── Palette panel ────────────────────────────────────────────────
        this._drawPalette(mx, my);

        // ── Header hint ──────────────────────────────────────────────────
        p.noStroke();
        p.fill(255, 220, 80);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(15);
        p.text('BUILD PHASE', gameWidth / 2, 10);

        p.fill(180, 180, 200);
        p.textSize(12);
        const modeHint = this._isShopMode()
            ? 'Place your purchased obstacles — Press ENTER to start | ESC to exit'
            : 'Place obstacles on the map — Press ENTER to start | ESC to exit';
        p.text(modeHint, gameWidth / 2, 30);

        // Show cannon direction hint when cannon is selected
        if (this._selectedType === ObstacleType.CANNON) {
            p.fill(255, 180, 80);
            p.text(`Cannon direction: ${this._cannonDir}  (press R to rotate)`, gameWidth / 2, 48);
        }
    }

    mousePressed(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const T        = GameConfig.TILE;
        const paletteY = gameHeight - this._paletteH();

        if (my >= paletteY) {
            // Click is inside the palette panel
            this._handlePaletteClick(mx, my);
            return;
        }

        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;

        if (p.mouseButton === p.RIGHT) {
            // Right click — remove obstacle at this tile and refund its token
            const removed = this._removeAt(snapX, snapY);
            if (removed) this._refundToken(removed.type);
            return;
        }

        // Left click — place selected obstacle (must have a token in shop mode)
        if (!this._selectedType) return;
        if (this._tokenCount(this._selectedType) <= 0) return; // no token
        if (this._isTileBlocked(snapX, snapY)) return;
        if (this._obstacleAt(snapX, snapY)) return; // already occupied

        const obs = this._createObstacle(this._selectedType, snapX, snapY);
        if (obs) {
            this.ctx.placedObstacles.push(obs);
            this._consumeToken(this._selectedType);
            // Deselect if no tokens remain for this type
            if (this._tokenCount(this._selectedType) <= 0) {
                this._selectedType = null;
            }
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this.goTo(GameStage.RUN);
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        } else if (p.key === 'r' || p.key === 'R') {
            // Rotate cannon direction clockwise
            const dirs   = [CannonDir.RIGHT, CannonDir.DOWN, CannonDir.LEFT, CannonDir.UP];
            const idx    = dirs.indexOf(this._cannonDir);
            this._cannonDir = dirs[(idx + 1) % dirs.length];
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _paletteH() { return 70; }

    _drawPalette(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const pH = this._paletteH();
        const pY = gameHeight - pH;

        // Panel background
        p.noStroke();
        p.fill(25, 25, 40, 230);
        p.rect(0, pY, gameWidth, pH);

        p.stroke(60, 60, 90);
        p.strokeWeight(1);
        p.line(0, pY, gameWidth, pY);
        p.noStroke();

        // Label
        p.fill(140, 140, 180);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.text('Obstacles:', 12, pY + pH / 2);

        // Obstacle buttons
        const btnW   = 90;
        const btnH   = 44;
        const startX = 100;
        const btnY   = pY + (pH - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx       = startX + i * (btnW + 10);
            const hovered  = mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH;
            const selected = this._selectedType === item.type;
            const tokens   = this._tokenCount(item.type);
            const available = tokens > 0;

            // Button background
            if (!available) {
                p.fill(20, 20, 30);
            } else if (selected) {
                p.fill(60, 60, 100);
            } else if (hovered) {
                p.fill(40, 40, 65);
            } else {
                p.fill(30, 30, 50);
            }
            p.rect(bx, btnY, btnW, btnH, 6);

            // Selection highlight border
            if (selected) {
                p.stroke(180, 180, 255);
                p.strokeWeight(2);
                p.noFill();
                p.rect(bx, btnY, btnW, btnH, 6);
                p.noStroke();
            }

            // Colour swatch (dimmed if unavailable)
            p.fill(...item.color.map(c => available ? c : Math.floor(c * 0.35)));
            p.rect(bx + 8, btnY + 12, 14, 14, 2);

            // Labels
            p.fill(available ? [220, 220, 240] : [80, 80, 90]);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(12);
            p.text(item.label, bx + 28, btnY + 8);

            p.fill(available ? [120, 120, 150] : [60, 60, 70]);
            p.textSize(10);
            p.text(item.hint, bx + 28, btnY + 26);

            // Token count badge (shop mode only)
            if (this._isShopMode()) {
                const badge = tokens === Infinity ? '' : `×${tokens}`;
                p.fill(tokens > 0 ? [100, 200, 120] : [120, 60, 60]);
                p.textAlign(p.RIGHT, p.TOP);
                p.textSize(10);
                p.text(badge, bx + btnW - 4, btnY + 4);
            }
        });

        // Right side: ENTER to start hint
        p.fill(100, 200, 120);
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(13);
        p.text('ENTER → Start Run', gameWidth - 14, pY + pH / 2);
    }

    _handlePaletteClick(mx, my) {
        const { gameHeight } = this.ctx;
        const btnW   = 90;
        const btnH   = 44;
        const startX = 100;
        const btnY   = gameHeight - this._paletteH() + (this._paletteH() - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx = startX + i * (btnW + 10);
            if (mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH) {
                // Only selectable if tokens are available
                if (this._tokenCount(item.type) <= 0) return;
                this._selectedType = this._selectedType === item.type ? null : item.type;
            }
        });
    }

    _isTileBlocked(px, py) {
        const T  = GameConfig.TILE;
        const tx = Math.floor(px / T);
        const ty = Math.floor(py / T);
        if (ty < 0 || ty >= MAP.length || tx < 0 || tx >= MAP[0].length) return true;
        return BLOCKED_TILES.has(MAP[ty][tx]);
    }

    _obstacleAt(px, py) {
        return this.ctx.placedObstacles.some(o => o.x === px && o.y === py);
    }

    _removeAt(px, py) {
        const arr = this.ctx.placedObstacles;
        const idx = arr.findIndex(o => o.x === px && o.y === py);
        if (idx !== -1) return arr.splice(idx, 1)[0];
        return null;
    }

    _createObstacle(type, x, y) {
        const { p } = this.ctx;
        if (type === ObstacleType.PLATFORM) return new Platform(p, x, y);
        if (type === ObstacleType.SPIKE)    return new SpikeObstacle(p, x, y);
        if (type === ObstacleType.CANNON)   return new Cannon(p, x, y, this._cannonDir);
        if (type === ObstacleType.SAW)      return new Saw(p, x, y);
        return null;
    }
}
