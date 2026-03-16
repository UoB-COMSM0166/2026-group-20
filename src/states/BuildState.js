import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { TileType } from '../config/TileType.js';
import { Platform } from '../entities/obstacles/Platform.js';
import { SpikeObstacle } from '../entities/obstacles/SpikeObstacle.js';

// Map tile characters that cannot be overwritten when placing obstacles
const BLOCKED_TILES = new Set([
    TileType.SOLID,
    TileType.SPIKE,
    TileType.ENDPOINT,
    TileType.HALF,
    TileType.SLOPE_UP,
    TileType.SLOPE_DOWN,
]);

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
            type: ObstacleType.PLATFORM,
            label: 'Platform',
            hint: 'Solid block',
            color: [120, 90, 60],
        },
        {
            type: ObstacleType.SPIKE,
            label: 'Spike',
            hint: 'Kills on touch',
            color: [220, 60, 60],
        },
    ];

    enter() {
        // Clear placed obstacles from any previous round
        this.ctx.placedObstacles.length = 0;
        this._selectedType = null;
    }

    update(_dt) {}

    render(mx, my) {
        const { p, gameWidth, gameHeight, tiledMap } = this.ctx;

        // ── Background + map ─────────────────────────────────────────────
        p.background(20);
        tiledMap.render();

        // ── Already-placed obstacles ─────────────────────────────────────
        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

        // ── Ghost preview (snapped to grid, only over map area) ──────────
        const T = GameConfig.TILE;
        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;
        const onMap =
            snapX >= 0 &&
            snapX < gameWidth &&
            snapY >= 0 &&
            snapY < gameHeight - this._paletteH();

        if (this._selectedType && onMap && !this._isTileBlocked(snapX, snapY)) {
            if (this._selectedType === ObstacleType.PLATFORM) {
                Platform.drawGhost(p, snapX, snapY);
            } else if (this._selectedType === ObstacleType.SPIKE) {
                SpikeObstacle.drawGhost(p, snapX, snapY);
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
        p.text(
            'Place obstacles on the map — Press ENTER to start | ESC to exit',
            gameWidth / 2,
            30,
        );
    }

    mousePressed(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const T = GameConfig.TILE;
        const paletteY = gameHeight - this._paletteH();

        if (my >= paletteY) {
            // Click is inside the palette panel
            this._handlePaletteClick(mx, my);
            return;
        }

        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;

        if (p.mouseButton === p.RIGHT) {
            // Right click — remove obstacle at this tile
            this._removeAt(snapX, snapY);
            return;
        }

        // Left click — place selected obstacle
        if (!this._selectedType) return;
        if (this._isTileBlocked(snapX, snapY)) return;
        if (this._obstacleAt(snapX, snapY)) return; // already occupied

        const obs = this._createObstacle(this._selectedType, snapX, snapY);
        if (obs) this.ctx.placedObstacles.push(obs);
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this.goTo(GameStage.RUN);
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _paletteH() {
        return 70;
    }

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
        const btnW = 90;
        const btnH = 44;
        const startX = 100;
        const btnY = pY + (pH - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx = startX + i * (btnW + 10);
            const hovered =
                mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH;
            const selected = this._selectedType === item.type;

            // Button background
            if (selected) {
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

            // Colour swatch
            p.fill(...item.color);
            p.rect(bx + 8, btnY + 12, 14, 14, 2);

            // Labels
            p.fill(220, 220, 240);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(12);
            p.text(item.label, bx + 28, btnY + 8);

            p.fill(120, 120, 150);
            p.textSize(10);
            p.text(item.hint, bx + 28, btnY + 26);
        });

        // Right side: ENTER to start hint
        p.fill(100, 200, 120);
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(13);
        p.text('ENTER → Start Run', gameWidth - 14, pY + pH / 2);
    }

    _handlePaletteClick(mx, my) {
        const { gameHeight } = this.ctx;
        const btnW = 90;
        const btnH = 44;
        const startX = 100;
        const btnY =
            gameHeight - this._paletteH() + (this._paletteH() - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx = startX + i * (btnW + 10);
            if (
                mx >= bx &&
                mx <= bx + btnW &&
                my >= btnY &&
                my <= btnY + btnH
            ) {
                // Toggle off if already selected
                this._selectedType =
                    this._selectedType === item.type ? null : item.type;
            }
        });
    }

    _isTileBlocked(px, py) {
        const { tiledMap } = this.ctx;
        const T = GameConfig.TILE;
        const tx = Math.floor(px / T);
        const ty = Math.floor(py / T);
        if (ty < 0 || ty >= tiledMap.MAP.length || tx < 0 || tx >= tiledMap.MAP[0].length)
            return true;
        return BLOCKED_TILES.has(tiledMap.MAP[ty][tx]);
    }

    _obstacleAt(px, py) {
        return this.ctx.placedObstacles.some((o) => o.x === px && o.y === py);
    }

    _removeAt(px, py) {
        const arr = this.ctx.placedObstacles;
        const idx = arr.findIndex((o) => o.x === px && o.y === py);
        if (idx !== -1) arr.splice(idx, 1);
    }

    _createObstacle(type, x, y) {
        const { p } = this.ctx;
        if (type === ObstacleType.PLATFORM) return new Platform(p, x, y);
        if (type === ObstacleType.SPIKE) return new SpikeObstacle(p, x, y);
        return null;
    }
}
