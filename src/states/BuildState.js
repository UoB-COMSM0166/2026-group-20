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

// Player colours — must match DrawPlayer / Scoreboard / ShopState
const PLAYER_COLOURS = [
    [90,  170, 255], // P1 blue
    [255, 200, 80],  // P2 orange
];

/**
 * BuildState — the turn-based obstacle placement phase.
 *
 * Each player takes a separate turn to place their obstacles.
 * Flow:
 *   P1 turn → (ENTER) → P2 turn → (ENTER) → RunState
 *
 * Token rules:
 *   - Round 1 (shopHasRun = false): unlimited free placement for both players.
 *   - Round 2+ (shopHasRun = true): each player can only place what is in their
 *     own inventory (player.inventory Map<ObstacleType, count>).
 *     Right-clicking removes an obstacle placed during this turn and refunds
 *     its token to the active player.
 *
 * Controls (active player only):
 *   Left click palette   — select / deselect obstacle type
 *   Left click map       — place selected obstacle
 *   Right click map      — undo a placement from this turn (refunds token)
 *   R                    — rotate cannon direction
 *   ENTER                — confirm turn → next player, or → RunState
 *   ESC                  — return to map menu
 *
 * Transitions:
 *   ENTER (after last player) → RunState
 *   ESC                       → MapMenuState
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
        // Round 1: no shop has run yet, so no obstacles to place — go straight to RUN.
        if (!this.ctx.shopHasRun) {
            this.goTo(GameStage.RUN);
            return;
        }

        this.ctx.placedObstacles.length = 0;
        this._currentTurn   = 0;
        this._selectedType  = null;
        this._cannonDir     = CannonDir.RIGHT;
        this._turnObstacles = [];
    }

    update(_dt) {}

    // ── Turn / token helpers ──────────────────────────────────────────────

    /** The player whose turn it currently is. @private */
    _activePlayer() {
        return this.ctx.players[this._currentTurn];
    }

    /**
     * True after the shop has run at least once (ctx.shopHasRun).
     * Round 1 is always free placement regardless of inventory contents.
     * @private
     */
    _isShopMode() {
        return this.ctx.shopHasRun;
    }

    /**
     * Tokens the active player has for a given type.
     * Returns Infinity in free mode.
     * @param {string} type
     * @returns {number}
     * @private
     */
    _tokenCount(type) {
        if (!this._isShopMode()) return Infinity;
        return this._activePlayer().inventory.get(type) ?? 0;
    }

    /**
     * Consume one token from the active player's inventory.
     * @param {string} type
     * @private
     */
    _consumeToken(type) {
        if (!this._isShopMode()) return;
        const pl    = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        if (count > 0) pl.inventory.set(type, count - 1);
    }

    /**
     * Refund one token to the active player's inventory.
     * @param {string} type
     * @private
     */
    _refundToken(type) {
        if (!this._isShopMode()) return;
        const pl    = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        pl.inventory.set(type, count + 1);
    }

    /**
     * Advance to the next player's turn, or go to RUN when all players are done.
     * @private
     */
    _advanceTurn() {
        this._selectedType  = null;
        this._cannonDir     = CannonDir.RIGHT;
        this._turnObstacles = [];
        this._currentTurn++;

        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.RUN);
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const col = PLAYER_COLOURS[this._currentTurn] ?? [200, 200, 200];

        // ── Background + map ─────────────────────────────────────────────
        p.background(20);
        drawMap(p);

        // ── Already-placed obstacles ─────────────────────────────────────
        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

        // ── Ghost preview ─────────────────────────────────────────────────
        const T       = GameConfig.TILE;
        const snapX   = Math.floor(mx / T) * T;
        const snapY   = Math.floor(my / T) * T;
        const onMap   = snapX >= 0 && snapX < gameWidth &&
                        snapY >= 0 && snapY < gameHeight - this._paletteH();

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
        this._drawPalette(mx, my, col);

        // ── Header ───────────────────────────────────────────────────────
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(15);
        p.text(`P${this._currentTurn + 1} — BUILD PHASE`, gameWidth / 2, 10);

        p.fill(180, 180, 200);
        p.textSize(12);
        const modeHint = this._isShopMode()
            ? 'Place your purchased obstacles — ENTER to confirm turn'
            : 'Place obstacles freely — ENTER to confirm turn';
        p.text(modeHint, gameWidth / 2, 30);

        // Inventory summary
        if (this._isShopMode()) {
            const inv     = this._activePlayer().inventory;
            const entries = [...inv.entries()].filter(([, c]) => c > 0);
            p.textSize(11);
            if (entries.length > 0) {
                p.fill(...col);
                const summary = entries
                    .map(([type, c]) => `${type.charAt(0) + type.slice(1).toLowerCase()} ×${c}`)
                    .join('  ');
                p.text(`Inventory: ${summary}`, gameWidth / 2, 46);
            } else {
                p.fill(150, 100, 100);
                p.text('No items — press ENTER to skip', gameWidth / 2, 46);
            }
        }

        // Cannon direction hint
        if (this._selectedType === ObstacleType.CANNON) {
            p.noStroke();
            p.fill(255, 180, 80);
            p.textSize(12);
            p.text(`Cannon direction: ${this._cannonDir}  (R to rotate)`, gameWidth / 2, 58);
        }
    }

    mousePressed(mx, my) {
        const { p, gameHeight } = this.ctx;
        const T        = GameConfig.TILE;
        const paletteY = gameHeight - this._paletteH();

        if (my >= paletteY) {
            this._handlePaletteClick(mx, my);
            return;
        }

        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;

        if (p.mouseButton === p.RIGHT) {
            // Only undo obstacles placed during this player's own turn
            const obs = this._turnObstacles.find(o => o.x === snapX && o.y === snapY);
            if (obs) {
                this._removeAt(snapX, snapY);
                this._turnObstacles = this._turnObstacles.filter(o => o !== obs);
                this._refundToken(obs.type);
            }
            return;
        }

        // Left click — place
        if (!this._selectedType) return;
        if (this._tokenCount(this._selectedType) <= 0) return;
        if (this._isTileBlocked(snapX, snapY)) return;
        if (this._obstacleAt(snapX, snapY)) return;

        const obs = this._createObstacle(this._selectedType, snapX, snapY);
        if (obs) {
            this.ctx.placedObstacles.push(obs);
            this._turnObstacles.push(obs);
            this._consumeToken(this._selectedType);
            // Deselect if no tokens remain
            if (this._tokenCount(this._selectedType) <= 0) {
                this._selectedType = null;
            }
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this._advanceTurn();
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        } else if (p.key === 'r' || p.key === 'R') {
            const dirs = [CannonDir.RIGHT, CannonDir.DOWN, CannonDir.LEFT, CannonDir.UP];
            const idx  = dirs.indexOf(this._cannonDir);
            this._cannonDir = dirs[(idx + 1) % dirs.length];
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _paletteH() { return 70; }

    _drawPalette(mx, my, playerCol) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const pH = this._paletteH();
        const pY = gameHeight - pH;

        // Panel background
        p.noStroke();
        p.fill(20, 22, 35, 235);
        p.rect(0, pY, gameWidth, pH);

        // Player colour accent bar at top of palette
        p.fill(...playerCol, 180);
        p.rect(0, pY, gameWidth, 3);
        p.noStroke();

        p.stroke(60, 60, 90);
        p.strokeWeight(1);
        p.line(0, pY + 3, gameWidth, pY + 3);
        p.noStroke();

        // Label
        p.fill(...playerCol);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.text(`P${this._currentTurn + 1}:`, 12, pY + pH / 2);

        // Obstacle buttons
        const btnW   = 90;
        const btnH   = 44;
        const startX = 46;
        const btnY   = pY + (pH - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx        = startX + i * (btnW + 10);
            const hovered   = mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH;
            const selected  = this._selectedType === item.type;
            const tokens    = this._tokenCount(item.type);
            const available = tokens > 0;

            // Background
            if (!available) {
                p.fill(18, 18, 28);
            } else if (selected) {
                p.fill(50, 55, 100);
            } else if (hovered) {
                p.fill(38, 40, 65);
            } else {
                p.fill(28, 30, 50);
            }
            p.noStroke();
            p.rect(bx, btnY, btnW, btnH, 6);

            // Selection border in player colour
            if (selected) {
                p.stroke(...playerCol);
                p.strokeWeight(2);
                p.noFill();
                p.rect(bx, btnY, btnW, btnH, 6);
                p.noStroke();
            }

            // Colour swatch
            p.fill(...item.color.map(c => available ? c : Math.floor(c * 0.3)));
            p.rect(bx + 8, btnY + 12, 14, 14, 2);

            // Labels
            p.fill(available ? [220, 220, 240] : [70, 70, 80]);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(12);
            p.text(item.label, bx + 28, btnY + 8);

            p.fill(available ? [120, 120, 150] : [55, 55, 65]);
            p.textSize(10);
            p.text(item.hint, bx + 28, btnY + 26);

            // Token count badge (shop mode)
            if (this._isShopMode()) {
                const badge = tokens === Infinity ? '' : `×${tokens}`;
                p.fill(tokens > 0 ? [100, 200, 120] : [130, 60, 60]);
                p.textAlign(p.RIGHT, p.TOP);
                p.textSize(10);
                p.text(badge, bx + btnW - 4, btnY + 4);
            }
        });

        // Right side: next step hint
        const nextLabel = this._currentTurn < this.ctx.players.length - 1
            ? `ENTER → P${this._currentTurn + 2} Turn`
            : 'ENTER → Start Run';
        p.fill(100, 200, 120);
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(13);
        p.text(nextLabel, gameWidth - 14, pY + pH / 2);
    }

    _handlePaletteClick(mx, my) {
        const { gameHeight } = this.ctx;
        const btnW   = 90;
        const btnH   = 44;
        const startX = 46;
        const btnY   = gameHeight - this._paletteH() + (this._paletteH() - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx = startX + i * (btnW + 10);
            if (mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH) {
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
