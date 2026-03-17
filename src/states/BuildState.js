import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { Platform } from '../entities/obstacles/Platform.js';
<<<<<<< HEAD
import { SpikeObstacle } from '../entities/obstacles/SpikeObstacle.js';
import { Cannon, CannonDir } from '../entities/obstacles/Cannon.js';
import { Saw } from '../entities/obstacles/Saw.js';
=======
import { MovingPlatform } from '../entities/obstacles/MovingPlatform.js';
import { FallingPlatform } from '../entities/obstacles/FallingPlatform.js';
import { IcePlatform } from '../entities/obstacles/IcePlatform.js';
import { BouncePad } from '../entities/obstacles/BouncePad.js';
import { SpikeObstacle } from '../entities/obstacles/SpikeObstacle.js';
import { Cannon, CannonDir } from '../entities/obstacles/Cannon.js';
import { Saw } from '../entities/obstacles/Saw.js';
import { Flame } from '../entities/obstacles/Flame.js';
import { SpikePlatform } from '../entities/obstacles/SpikePlatform.js';
import { IceBlock } from '../entities/obstacles/IceBlock.js';
import { WindZone, WindDir } from '../entities/obstacles/WindZone.js';
import { Teleporter } from '../entities/obstacles/Teleporter.js';
>>>>>>> origin/feature/shop
import { drawMap, MAP } from '../maps/MapLoader.js';

// Map tile characters that cannot be overwritten when placing obstacles
const BLOCKED_TILES = new Set(['#', 'S', 'F', 'C']);

<<<<<<< HEAD
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
=======
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
 *   - Round 1 (shopHasRun = false): skip straight to RUN (no obstacles).
 *   - Round 2+ (shopHasRun = true): each player can only place what is in their
 *     own inventory (player.inventory Map<ObstacleType, count>).
 *     Right-clicking removes an obstacle placed this turn and refunds its token.
 *
 * Teleporter pairing:
 *   The first Teleporter placed is held as _pendingTeleporter. When a second
 *   Teleporter is placed, both are linked as partners and the pending slot clears.
 *   A third placement starts a new pair.
 *
 * Controls:
 *   Left click palette   — select / deselect obstacle type
 *   Left click map       — place selected obstacle
 *   Right click map      — undo a placement from this turn (refunds token)
 *   R                    — rotate Cannon / WindZone direction
 *   ENTER                — confirm turn → next player or → RunState
 *   ESC                  — return to map menu
 */
export class BuildState extends State {

    static PALETTE = [
        // Solid
        { type: ObstacleType.PLATFORM,         label: 'Platform',    hint: 'Solid block',      color: [120, 90,  60]  },
        { type: ObstacleType.MOVING_PLATFORM,  label: 'MovePlatform',hint: 'Slides back+forth', color: [80,  110, 160] },
        { type: ObstacleType.FALLING_PLATFORM, label: 'FallPlatform',hint: 'Drops when stood on',color:[90,  65,  40]  },
        { type: ObstacleType.ICE_PLATFORM,     label: 'IcePlatform', hint: 'Slippery solid',   color: [160, 220, 245] },
        { type: ObstacleType.BOUNCE_PAD,       label: 'BouncePad',   hint: 'Launches upward',  color: [80,  200, 100] },
        // Hazard
        { type: ObstacleType.SPIKE,            label: 'Spike',       hint: 'Kills on touch',   color: [220, 60,  60]  },
        { type: ObstacleType.CANNON,           label: 'Cannon',      hint: 'Fires projectiles',color: [70,  70,  80]  },
        { type: ObstacleType.SAW,              label: 'Saw',         hint: 'Spinning blade',   color: [200, 60,  60]  },
        { type: ObstacleType.FLAME,            label: 'Flame',       hint: 'Pulses on/off',    color: [240, 100, 20]  },
        // Solid + hazard
        { type: ObstacleType.SPIKE_PLATFORM,   label: 'SpikePlatform',hint:'Safe top, deadly sides',color:[170, 80, 40] },
        // Special effect
        { type: ObstacleType.ICE_BLOCK,        label: 'IceBlock',    hint: 'Slide through',    color: [120, 190, 230] },
        { type: ObstacleType.WIND_ZONE,        label: 'WindZone',    hint: 'Push direction',   color: [60,  185, 185] },
        { type: ObstacleType.TELEPORTER,       label: 'Teleporter',  hint: '1 token = 1 pair',  color: [160, 80,  240] },
    ];

    enter() {
        // Round 1: shop has not run yet — skip straight to RUN
        if (!this.ctx.shopHasRun) {
            this.goTo(GameStage.RUN);
            return;
        }

        this.ctx.placedObstacles.length = 0;
        this._currentTurn       = 0;
        this._selectedType      = null;
        this._cannonDir         = CannonDir.RIGHT;
        this._windDir           = WindDir.RIGHT;
        this._pendingTeleporter = null; // first placed teleporter waits for its partner
        this._turnObstacles     = [];   // obstacles placed this turn (for undo)
>>>>>>> origin/feature/shop
    }

    update(_dt) {}

<<<<<<< HEAD
    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;

        // ── Background + map ─────────────────────────────────────────────
        p.background(20);
        drawMap(p);

        // ── Already-placed obstacles ─────────────────────────────────────
=======
    // ── Turn / token helpers ──────────────────────────────────────────────

    _activePlayer() {
        return this.ctx.players[this._currentTurn];
    }

    _isShopMode() {
        return this.ctx.shopHasRun;
    }

    _tokenCount(type) {
        if (!this._isShopMode()) return Infinity;
        return this._activePlayer().inventory.get(type) ?? 0;
    }

    _consumeToken(type) {
        if (!this._isShopMode()) return;
        const pl    = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        if (count > 0) pl.inventory.set(type, count - 1);
    }

    _refundToken(type) {
        if (!this._isShopMode()) return;
        const pl    = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        pl.inventory.set(type, count + 1);
    }

    _advanceTurn() {
        this._selectedType      = null;
        this._cannonDir         = CannonDir.RIGHT;
        this._windDir           = WindDir.RIGHT;
        this._pendingTeleporter = null;
        this._turnObstacles     = [];
        this._currentTurn++;

        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.RUN);
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const col = PLAYER_COLOURS[this._currentTurn] ?? [200, 200, 200];

        p.background(20);
        drawMap(p);

>>>>>>> origin/feature/shop
        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

<<<<<<< HEAD
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
        p.text('Place obstacles on the map — Press ENTER to start | ESC to exit', gameWidth / 2, 30);

        // Show cannon direction hint when cannon is selected
        if (this._selectedType === ObstacleType.CANNON) {
            p.fill(255, 180, 80);
            p.text(`Cannon direction: ${this._cannonDir}  (press R to rotate)`, gameWidth / 2, 48);
=======
        // Ghost preview
        const T     = GameConfig.TILE;
        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;
        const onMap = snapX >= 0 && snapX < gameWidth &&
                      snapY >= 0 && snapY < gameHeight - this._paletteH();

        if (this._selectedType && onMap && !this._isTileBlocked(snapX, snapY)) {
            this._drawGhost(p, this._selectedType, snapX, snapY);
        }

        this._drawPalette(mx, my, col);

        // Header
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(15);
        p.text(`P${this._currentTurn + 1} — BUILD PHASE`, gameWidth / 2, 10);

        p.fill(180, 180, 200);
        p.textSize(12);
        p.text('Place your purchased obstacles — ENTER to confirm turn', gameWidth / 2, 30);

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

        // Direction hint for Cannon / WindZone
        if (this._selectedType === ObstacleType.CANNON) {
            p.noStroke();
            p.fill(255, 180, 80);
            p.textSize(12);
            p.text(`Cannon direction: ${this._cannonDir}  (R to rotate)`, gameWidth / 2, 58);
        } else if (this._selectedType === ObstacleType.WIND_ZONE) {
            p.noStroke();
            p.fill(120, 230, 230);
            p.textSize(12);
            p.text(`Wind direction: ${this._windDir}  (R to rotate)`, gameWidth / 2, 58);
        } else if (this._selectedType === ObstacleType.TELEPORTER) {
            p.noStroke();
            p.fill(160, 80, 240);
            p.textSize(12);
            const hint = this._pendingTeleporter
                ? 'Place the second portal to complete the pair'
                : 'Place the first portal';
            p.text(hint, gameWidth / 2, 58);
>>>>>>> origin/feature/shop
        }
    }

    mousePressed(mx, my) {
<<<<<<< HEAD
        const { p, gameWidth, gameHeight } = this.ctx;
=======
        const { p, gameHeight } = this.ctx;
>>>>>>> origin/feature/shop
        const T        = GameConfig.TILE;
        const paletteY = gameHeight - this._paletteH();

        if (my >= paletteY) {
<<<<<<< HEAD
            // Click is inside the palette panel
=======
>>>>>>> origin/feature/shop
            this._handlePaletteClick(mx, my);
            return;
        }

        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;

        if (p.mouseButton === p.RIGHT) {
<<<<<<< HEAD
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
=======
            // Only undo obstacles placed this player's own turn
            const obs = this._turnObstacles.find(o => o.x === snapX && o.y === snapY);
            if (obs) {
                this._removeAt(snapX, snapY);
                this._turnObstacles = this._turnObstacles.filter(o => o !== obs);

                // Teleporter undo logic:
                // One token covers both portals of a pair.
                // Only refund when removing the FIRST portal of the pair (the one that cost the token).
                // Removing the second portal of a complete pair: no refund, restore first to pending.
                if (obs.type === ObstacleType.TELEPORTER) {
                    if (obs === this._pendingTeleporter) {
                        // Removing the unpaired first portal — refund the token
                        this._pendingTeleporter = null;
                        this._refundToken(ObstacleType.TELEPORTER);
                    } else if (obs.partner) {
                        // Removing the second portal of a complete pair —
                        // no refund (token was spent on the pair), restore first to pending
                        obs.partner.partner = null;
                        if (this._turnObstacles.includes(obs.partner)) {
                            this._pendingTeleporter = obs.partner;
                        }
                    } else {
                        // Orphaned teleporter with no partner — refund
                        this._refundToken(ObstacleType.TELEPORTER);
                    }
                } else {
                    this._refundToken(obs.type);
                }
            }
            return;
        }

        // Left click — place
        if (!this._selectedType) return;
        if (this._isTileBlocked(snapX, snapY)) return;
        if (this._obstacleAt(snapX, snapY)) return;

        // Teleporter second portal is free — one token covers both ends of a pair
        const isTeleporterSecond = this._selectedType === ObstacleType.TELEPORTER &&
                                   this._pendingTeleporter !== null;
        if (!isTeleporterSecond && this._tokenCount(this._selectedType) <= 0) return;

        const obs = this._createObstacle(this._selectedType, snapX, snapY);
        if (obs) {
            this.ctx.placedObstacles.push(obs);
            this._turnObstacles.push(obs);

            if (this._selectedType === ObstacleType.TELEPORTER) {
                if (this._pendingTeleporter) {
                    // Complete the pair — no token consumed for second portal
                    obs.partner = this._pendingTeleporter;
                    this._pendingTeleporter.partner = obs;
                    this._pendingTeleporter = null;
                    // Deselect once pair is complete (or keep selected if more tokens remain)
                    if (this._tokenCount(this._selectedType) <= 0) {
                        this._selectedType = null;
                    }
                } else {
                    // First portal — consume one token, wait for second
                    this._consumeToken(this._selectedType);
                    this._pendingTeleporter = obs;
                    // Keep selected so player can immediately place the second portal
                }
            } else {
                this._consumeToken(this._selectedType);
                if (this._tokenCount(this._selectedType) <= 0) {
                    this._selectedType = null;
                }
            }
        }
>>>>>>> origin/feature/shop
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
<<<<<<< HEAD
            this.goTo(GameStage.RUN);
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        } else if (p.key === 'r' || p.key === 'R') {
            // Rotate cannon direction clockwise
            const dirs   = [CannonDir.RIGHT, CannonDir.DOWN, CannonDir.LEFT, CannonDir.UP];
            const idx    = dirs.indexOf(this._cannonDir);
            this._cannonDir = dirs[(idx + 1) % dirs.length];
=======
            this._advanceTurn();
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        } else if (p.key === 'r' || p.key === 'R') {
            this._rotateDirection();
>>>>>>> origin/feature/shop
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

<<<<<<< HEAD
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
=======
    _rotateDirection() {
        if (this._selectedType === ObstacleType.CANNON) {
            const dirs = [CannonDir.RIGHT, CannonDir.DOWN, CannonDir.LEFT, CannonDir.UP];
            const idx  = dirs.indexOf(this._cannonDir);
            this._cannonDir = dirs[(idx + 1) % dirs.length];
        } else if (this._selectedType === ObstacleType.WIND_ZONE) {
            const dirs = [WindDir.RIGHT, WindDir.DOWN, WindDir.LEFT, WindDir.UP];
            const idx  = dirs.indexOf(this._windDir);
            this._windDir = dirs[(idx + 1) % dirs.length];
        }
    }

    _paletteH() { return 116; }

    _drawGhost(p, type, x, y) {
        switch (type) {
            case ObstacleType.PLATFORM:         Platform.drawGhost(p, x, y);                        break;
            case ObstacleType.MOVING_PLATFORM:  MovingPlatform.drawGhost(p, x, y);                  break;
            case ObstacleType.FALLING_PLATFORM: FallingPlatform.drawGhost(p, x, y);                 break;
            case ObstacleType.ICE_PLATFORM:     IcePlatform.drawGhost(p, x, y);                     break;
            case ObstacleType.BOUNCE_PAD:       BouncePad.drawGhost(p, x, y);                       break;
            case ObstacleType.SPIKE:            SpikeObstacle.drawGhost(p, x, y);                   break;
            case ObstacleType.CANNON:           Cannon.drawGhost(p, x, y, this._cannonDir);          break;
            case ObstacleType.SAW:              Saw.drawGhost(p, x, y);                             break;
            case ObstacleType.FLAME:            Flame.drawGhost(p, x, y);                           break;
            case ObstacleType.SPIKE_PLATFORM:   SpikePlatform.drawGhost(p, x, y);                   break;
            case ObstacleType.ICE_BLOCK:        IceBlock.drawGhost(p, x, y);                        break;
            case ObstacleType.WIND_ZONE:        WindZone.drawGhost(p, x, y, this._windDir);          break;
            case ObstacleType.TELEPORTER:       Teleporter.drawGhost(p, x, y);                      break;
        }
    }

    _drawPalette(mx, my, playerCol) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const pH     = this._paletteH();
        const pY     = gameHeight - pH;
        const ROW_SZ = 7;   // items per row
        const btnW   = 116;
        const btnH   = 46;
        const startX = 40;
        const btnGap = 6;
        const row0Y  = pY + 8;
        const row1Y  = row0Y + btnH + 6;

        p.noStroke();
        p.fill(20, 22, 35, 235);
        p.rect(0, pY, gameWidth, pH);

        p.fill(...playerCol, 180);
        p.rect(0, pY, gameWidth, 3);
        p.noStroke();

        p.stroke(60, 60, 90);
        p.strokeWeight(1);
        p.line(0, pY + 3, gameWidth, pY + 3);
        p.noStroke();

        p.fill(...playerCol);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(11);
        p.text(`P${this._currentTurn + 1}:`, 8, pY + pH / 2);

        BuildState.PALETTE.forEach((item, i) => {
            const row    = Math.floor(i / ROW_SZ);
            const col_i  = i % ROW_SZ;
            const bx     = startX + col_i * (btnW + btnGap);
            const by     = row === 0 ? row0Y : row1Y;

            const hovered   = mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH;
            const selected  = this._selectedType === item.type;
            const tokens    = this._tokenCount(item.type);
            const available = tokens > 0;

            if (!available)      p.fill(18, 18, 28);
            else if (selected)   p.fill(50, 55, 100);
            else if (hovered)    p.fill(38, 40, 65);
            else                 p.fill(28, 30, 50);
            p.noStroke();
            p.rect(bx, by, btnW, btnH, 5);

            if (selected) {
                p.stroke(...playerCol);
                p.strokeWeight(2);
                p.noFill();
                p.rect(bx, by, btnW, btnH, 5);
                p.noStroke();
            }

            p.fill(...item.color.map(c => available ? c : Math.floor(c * 0.3)));
            p.rect(bx + 5, by + btnH / 2 - 6, 12, 12, 2);

            p.fill(available ? [210, 210, 235] : [65, 65, 75]);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(10);
            p.text(item.label, bx + 21, by + 6);

            p.fill(available ? [110, 110, 140] : [50, 50, 60]);
            p.textSize(9);
            p.text(item.hint, bx + 21, by + 20);

            if (this._isShopMode()) {
                const badge = tokens === Infinity ? '' : `×${tokens}`;
                p.fill(tokens > 0 ? [100, 200, 120] : [130, 60, 60]);
                p.textAlign(p.RIGHT, p.TOP);
                p.textSize(9);
                p.text(badge, bx + btnW - 3, by + 3);
            }
        });

        const nextLabel = this._currentTurn < this.ctx.players.length - 1
            ? `ENTER → P${this._currentTurn + 2} Turn`
            : 'ENTER → Start Run';
        p.fill(100, 200, 120);
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(12);
        p.text(nextLabel, gameWidth - 10, pY + pH / 2);
>>>>>>> origin/feature/shop
    }

    _handlePaletteClick(mx, my) {
        const { gameHeight } = this.ctx;
<<<<<<< HEAD
        const btnW   = 90;
        const btnH   = 44;
        const startX = 100;
        const btnY   = gameHeight - this._paletteH() + (this._paletteH() - btnH) / 2;

        BuildState.PALETTE.forEach((item, i) => {
            const bx = startX + i * (btnW + 10);
            if (mx >= bx && mx <= bx + btnW && my >= btnY && my <= btnY + btnH) {
                // Toggle off if already selected
=======
        const ROW_SZ = 7;
        const btnW   = 116;
        const btnH   = 46;
        const startX = 40;
        const btnGap = 6;
        const pY     = gameHeight - this._paletteH();
        const row0Y  = pY + 8;
        const row1Y  = row0Y + btnH + 6;

        BuildState.PALETTE.forEach((item, i) => {
            const row   = Math.floor(i / ROW_SZ);
            const col_i = i % ROW_SZ;
            const bx    = startX + col_i * (btnW + btnGap);
            const by    = row === 0 ? row0Y : row1Y;

            if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                if (this._tokenCount(item.type) <= 0) return;
>>>>>>> origin/feature/shop
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
<<<<<<< HEAD
        if (idx !== -1) arr.splice(idx, 1);
=======
        if (idx !== -1) return arr.splice(idx, 1)[0];
        return null;
>>>>>>> origin/feature/shop
    }

    _createObstacle(type, x, y) {
        const { p } = this.ctx;
<<<<<<< HEAD
        if (type === ObstacleType.PLATFORM) return new Platform(p, x, y);
        if (type === ObstacleType.SPIKE)    return new SpikeObstacle(p, x, y);
        if (type === ObstacleType.CANNON)   return new Cannon(p, x, y, this._cannonDir);
        if (type === ObstacleType.SAW)      return new Saw(p, x, y);
        return null;
=======
        switch (type) {
            case ObstacleType.PLATFORM:         return new Platform(p, x, y);
            case ObstacleType.MOVING_PLATFORM:  return new MovingPlatform(p, x, y);
            case ObstacleType.FALLING_PLATFORM: return new FallingPlatform(p, x, y);
            case ObstacleType.ICE_PLATFORM:     return new IcePlatform(p, x, y);
            case ObstacleType.BOUNCE_PAD:       return new BouncePad(p, x, y);
            case ObstacleType.SPIKE:            return new SpikeObstacle(p, x, y);
            case ObstacleType.CANNON:           return new Cannon(p, x, y, this._cannonDir);
            case ObstacleType.SAW:              return new Saw(p, x, y);
            case ObstacleType.FLAME:            return new Flame(p, x, y);
            case ObstacleType.SPIKE_PLATFORM:   return new SpikePlatform(p, x, y);
            case ObstacleType.ICE_BLOCK:        return new IceBlock(p, x, y);
            case ObstacleType.WIND_ZONE:        return new WindZone(p, x, y, this._windDir);
            case ObstacleType.TELEPORTER:       return new Teleporter(p, x, y);
            default:                            return null;
        }
>>>>>>> origin/feature/shop
    }
}
