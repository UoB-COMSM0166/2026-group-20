import { State } from './State.js';
import { DrawPlayer } from '../utils/DrawPlayer.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { PlayerGameState } from '../config/PlayerGameState.js';
import { TileType } from '../config/TileType.js';
import { Platform } from '../entities/obstacles/Platform.js';
import { MovingPlatform } from '../entities/obstacles/MovingPlatform.js';
import { FallingPlatform } from '../entities/obstacles/FallingPlatform.js';
import { IcePlatform } from '../entities/obstacles/IcePlatform.js';
import { BouncePad } from '../entities/obstacles/BouncePad.js';
import { SpikeObstacle } from '../entities/obstacles/SpikeObstacle.js';
import { Cannon, CannonDir } from '../entities/obstacles/Cannon.js';
import { Saw } from '../entities/obstacles/Saw.js';
import { Flame } from '../entities/obstacles/Flame.js';
import { SpikedBall } from '../entities/obstacles/SpikedBall.js';
import { IceBlock } from '../entities/obstacles/IceBlock.js';
import { WindZone, WindDir } from '../entities/obstacles/WindZone.js';
import { Teleporter } from '../entities/obstacles/Teleporter.js';
// import { drawMap, MAP } from '../maps/MapLoader.js';

// Map tile characters that cannot be overwritten when placing obstacles
const BLOCKED_TILES = new Set([
    TileType.SOLID,
    TileType.SPIKE,
    TileType.ENDPOINT,
    TileType.HALF,
    TileType.SLOPE_UP,
    TileType.SLOPE_DOWN,
]);

// Player colours — must match DrawPlayer / Scoreboard / ShopState
const PLAYER_COLOURS = [
    [90, 170, 255], // P1 blue
    [255, 200, 80], // P2 orange
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
    constructor(
        ctx,
        goTo,
        sawFrames,
        fireFrames,
        trampolineBouncing,
        spikedBallImg,
        cannonImg,
        fallingPlatformFrames,
    ) {
        super(ctx, goTo);
        this.sawFrames = sawFrames;
        this.fireFrames = fireFrames;
        this.trampolineBouncing = trampolineBouncing;
        this.spikedBallImg = spikedBallImg;
        this.cannonImg = cannonImg;
        this.fallingPlatformFrames = fallingPlatformFrames;
        //this.trampolineIdle= trampolineIdle;

        // Initialise turn state so render() is safe even before enter() runs.
        this._currentTurn = 0;
        this._selectedType = null;
        this._turnObstacles = [];
    }

    static PALETTE = [
        // Solid
        {
            type: ObstacleType.PLATFORM,
            label: 'Platform',
            hint: 'Solid block',
            color: [120, 90, 60],
        },
        {
            type: ObstacleType.MOVING_PLATFORM,
            label: 'MovePlatform',
            hint: 'Slides back+forth',
            color: [80, 110, 160],
        },
        {
            type: ObstacleType.FALLING_PLATFORM,
            label: 'FallPlatform',
            hint: 'Drops when stood on',
            color: [90, 65, 40],
        },
        {
            type: ObstacleType.ICE_PLATFORM,
            label: 'IcePlatform',
            hint: 'Slippery solid',
            color: [160, 220, 245],
        },
        {
            type: ObstacleType.BOUNCE_PAD,
            label: 'BouncePad',
            hint: 'Launches upward',
            color: [80, 200, 100],
        },
        // Hazard
        {
            type: ObstacleType.SPIKE,
            label: 'Spike',
            hint: 'Kills on touch',
            color: [220, 60, 60],
        },
        {
            type: ObstacleType.CANNON,
            label: 'Cannon',
            hint: 'Fires projectiles',
            color: [70, 70, 80],
        },
        {
            type: ObstacleType.SAW,
            label: 'Saw',
            hint: 'Spinning blade',
            color: [200, 60, 60],
        },
        {
            type: ObstacleType.FLAME,
            label: 'Flame',
            hint: 'Pulses on/off',
            color: [240, 100, 20],
        },
        // Solid + hazard
        {
            type: ObstacleType.SPIKED_BALL,
            label: 'SpikedBall',
            hint: 'Kills on touch',
            color: [170, 80, 40],
        },
        // Special effect
        {
            type: ObstacleType.ICE_BLOCK,
            label: 'IceBlock',
            hint: 'Slide through',
            color: [120, 190, 230],
        },
        {
            type: ObstacleType.WIND_ZONE,
            label: 'WindZone',
            hint: 'Push direction',
            color: [60, 185, 185],
        },
        {
            type: ObstacleType.TELEPORTER,
            label: 'Teleporter',
            hint: '1 token = 1 pair',
            color: [160, 80, 240],
        },
    ];

    async enter() {
        // Rounds 2+ use randomly generated maps for maps with chunk themes.
        // Round 1 (shopHasRun=false) keeps the static map — it bypasses build entirely.
        if (this.ctx.shopHasRun) {
            const mapManager = this.ctx.mapManager;
            if (mapManager) {
                await mapManager.generateRandomMap(this.ctx.mapKey, this.ctx);
            }
        }

        // Round 1: shop has not run yet — skip straight to RUN
        if (!this.ctx.shopHasRun) {
            this.goTo(GameStage.RUN);
            return;
        }

        this.ctx.placedObstacles.length = 0;
        this._currentTurn = 0;
        this._selectedType = null;
        this._cannonDir = CannonDir.RIGHT;
        this._windDir = WindDir.RIGHT;
        this._pendingTeleporter = null; // first placed teleporter waits for its partner
        this._turnObstacles = []; // obstacles placed this turn (for undo)

        // Reset players so they are visible during BUILD (they may be DEAD from previous round)
        for (const player of this.ctx.players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING);
        }
    }

    update(_dt) {}

    // ── Turn / token helpers ──────────────────────────────────────────────

    _activePlayer() {
        const players = this.ctx.players;
        if (!players || this._currentTurn >= players.length) return null;
        return players[this._currentTurn];
    }

    _isShopMode() {
        return this.ctx.shopHasRun;
    }

    _tokenCount(type) {
        if (!this._isShopMode()) return Infinity;
        const player = this._activePlayer();
        if (!player || !player.inventory) return 0;
        return player.inventory.get(type) ?? 0;
    }

    _consumeToken(type) {
        if (!this._isShopMode()) return;
        const pl = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        if (count > 0) pl.inventory.set(type, count - 1);
    }

    _refundToken(type) {
        if (!this._isShopMode()) return;
        const pl = this._activePlayer();
        const count = pl.inventory.get(type) ?? 0;
        pl.inventory.set(type, count + 1);
    }

    _advanceTurn() {
        this._selectedType = null;
        this._cannonDir = CannonDir.RIGHT;
        this._windDir = WindDir.RIGHT;
        this._pendingTeleporter = null;
        this._turnObstacles = [];
        this._currentTurn++;

        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.RUN);
        }
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────

    render(mx, my) {
        const { p, gameWidth, gameHeight, tiledMap } = this.ctx;
        const col = PLAYER_COLOURS[this._currentTurn] ?? [200, 200, 200];

        p.background(20);

        // Draw themed background if available
        const bg = this.ctx.backgroundImage;
        if (bg && bg.width > 1) {
            p.image(bg, 0, 0, gameWidth, gameHeight);
        }

        tiledMap.render();

        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

        // Draw players so the starting position is visible
        for (const player of this.ctx.players) {
            DrawPlayer(player);
        }

        // Ghost preview
        const T = GameConfig.TILE;
        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;
        const onMap =
            snapX >= 0 &&
            snapX < gameWidth &&
            snapY >= 0 &&
            snapY < gameHeight - this._paletteH();

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
        p.text(
            'Place your purchased obstacles — ENTER to confirm turn',
            gameWidth / 2,
            30,
        );

        // Inventory summary
        if (this._isShopMode() && this._activePlayer()) {
            const inv = this._activePlayer().inventory;
            const entries = [...inv.entries()].filter(
                ([t, c]) => typeof t === 'string' && c > 0,
            );
            p.textSize(11);
            if (entries.length > 0) {
                p.fill(...col);
                const summary = entries
                    .map(
                        ([type, c]) =>
                            `${type.charAt(0) + type.slice(1).toLowerCase()} ×${c}`,
                    )
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
            p.text(
                `Cannon direction: ${this._cannonDir}  (R to rotate)`,
                gameWidth / 2,
                58,
            );
        } else if (this._selectedType === ObstacleType.WIND_ZONE) {
            p.noStroke();
            p.fill(120, 230, 230);
            p.textSize(12);
            p.text(
                `Wind direction: ${this._windDir}  (R to rotate)`,
                gameWidth / 2,
                58,
            );
        } else if (this._selectedType === ObstacleType.TELEPORTER) {
            p.noStroke();
            p.fill(160, 80, 240);
            p.textSize(12);
            const hint = this._pendingTeleporter
                ? 'Place the second portal to complete the pair'
                : 'Place the first portal';
            p.text(hint, gameWidth / 2, 58);
        }
    }

    mousePressed(mx, my) {
        const { p, gameHeight } = this.ctx;
        const T = GameConfig.TILE;
        const paletteY = gameHeight - this._paletteH();

        if (my >= paletteY) {
            this._handlePaletteClick(mx, my);
            return;
        }

        const snapX = Math.floor(mx / T) * T;
        const snapY = Math.floor(my / T) * T;

        if (p.mouseButton === p.RIGHT) {
            // Only undo obstacles placed this player's own turn
            const obs = this._turnObstacles.find(
                (o) => o.x === snapX && o.y === snapY,
            );
            if (obs) {
                this._removeAt(snapX, snapY);
                this._turnObstacles = this._turnObstacles.filter(
                    (o) => o !== obs,
                );

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
        const isTeleporterSecond =
            this._selectedType === ObstacleType.TELEPORTER &&
            this._pendingTeleporter !== null;
        if (!isTeleporterSecond && this._tokenCount(this._selectedType) <= 0)
            return;

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
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this._advanceTurn();
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        } else if (p.key === 'r' || p.key === 'R') {
            this._rotateDirection();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _rotateDirection() {
        if (this._selectedType === ObstacleType.CANNON) {
            const dirs = [
                CannonDir.RIGHT,
                CannonDir.DOWN,
                CannonDir.LEFT,
                CannonDir.UP,
            ];
            const idx = dirs.indexOf(this._cannonDir);
            this._cannonDir = dirs[(idx + 1) % dirs.length];
        } else if (this._selectedType === ObstacleType.WIND_ZONE) {
            const dirs = [
                WindDir.RIGHT,
                WindDir.DOWN,
                WindDir.LEFT,
                WindDir.UP,
            ];
            const idx = dirs.indexOf(this._windDir);
            this._windDir = dirs[(idx + 1) % dirs.length];
        }
    }

    _paletteH() {
        return 152;
    }

    _drawGhost(p, type, x, y) {
        switch (type) {
            case ObstacleType.PLATFORM:
                Platform.drawGhost(p, x, y);
                break;
            case ObstacleType.MOVING_PLATFORM:
                MovingPlatform.drawGhost(p, x, y);
                break;
            case ObstacleType.FALLING_PLATFORM:
                FallingPlatform.drawGhost(p, x, y, this.fallingPlatformFrames);
                break;
            case ObstacleType.ICE_PLATFORM:
                IcePlatform.drawGhost(p, x, y);
                break;
            case ObstacleType.BOUNCE_PAD:
                BouncePad.drawGhost(p, x, y, this.trampolineBouncing);
                break;
            case ObstacleType.SPIKE:
                SpikeObstacle.drawGhost(p, x, y);
                break;
            case ObstacleType.CANNON:
                Cannon.drawGhost(p, x, y, this._cannonDir, this.cannonImg);
                break;
            case ObstacleType.SAW:
                Saw.drawGhost(p, x, y, this.sawFrames);
                break;
            case ObstacleType.FLAME:
                Flame.drawGhost(p, x, y, this.fireFrames);
                break;
            case ObstacleType.SPIKED_BALL:
                SpikedBall.drawGhost(p, x, y, this.spikedBallImg);
                break;
            case ObstacleType.ICE_BLOCK:
                IceBlock.drawGhost(p, x, y);
                break;
            case ObstacleType.WIND_ZONE:
                WindZone.drawGhost(p, x, y, this._windDir);
                break;
            case ObstacleType.TELEPORTER:
                Teleporter.drawGhost(p, x, y);
                break;
        }
    }

    _drawPalette(mx, my, playerCol) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const pH = this._paletteH();
        const pY = gameHeight - pH;
        const ROW_SZ = 7; // items per row
        const btnW = 116;
        const btnH = 46;
        const startX = 40;
        const btnGap = 6;
        const row0Y = pY + 8;
        const row1Y = row0Y + btnH + 6;

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
            const row = Math.floor(i / ROW_SZ);
            const col_i = i % ROW_SZ;
            const bx = startX + col_i * (btnW + btnGap);
            const by = row === 0 ? row0Y : row1Y;

            const hovered =
                mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH;
            const selected = this._selectedType === item.type;
            const tokens = this._tokenCount(item.type);
            const available = tokens > 0;

            if (!available) p.fill(18, 18, 28);
            else if (selected) p.fill(50, 55, 100);
            else if (hovered) p.fill(38, 40, 65);
            else p.fill(28, 30, 50);
            p.noStroke();
            p.rect(bx, by, btnW, btnH, 5);

            if (selected) {
                p.stroke(...playerCol);
                p.strokeWeight(2);
                p.noFill();
                p.rect(bx, by, btnW, btnH, 5);
                p.noStroke();
            }

            p.fill(
                ...item.color.map((c) => (available ? c : Math.floor(c * 0.3))),
            );
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

        // ── Action row (below both obstacle rows) ─────────────────────────
        const actionY = row1Y + btnH + 4;
        const actionH = 30;

        // Undo Last — left side
        const undoBtnW = 130;
        const undoBtnX = startX;
        const canUndo = this._turnObstacles.length > 0;
        const undoHov =
            mx >= undoBtnX &&
            mx <= undoBtnX + undoBtnW &&
            my >= actionY &&
            my <= actionY + actionH;
        p.noStroke();
        p.fill(
            canUndo ? (undoHov ? [90, 70, 140] : [65, 48, 105]) : [30, 28, 45],
        );
        p.rect(undoBtnX, actionY, undoBtnW, actionH, 5);
        p.fill(canUndo ? [200, 175, 255] : [70, 65, 90]);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(12);
        p.text('  ↩  Undo Last', undoBtnX + 6, actionY + actionH / 2);

        // Quit to Menu — right side
        const quitBtnW = 130;
        const quitBtnX = gameWidth - quitBtnW - startX;
        const quitHov =
            mx >= quitBtnX &&
            mx <= quitBtnX + quitBtnW &&
            my >= actionY &&
            my <= actionY + actionH;
        p.noStroke();
        p.fill(quitHov ? [130, 38, 38] : [88, 26, 26]);
        p.rect(quitBtnX, actionY, quitBtnW, actionH, 5);
        p.fill(230, 130, 130);
        p.textAlign(p.RIGHT, p.CENTER);
        p.textSize(12);
        p.text(
            '✕  Quit to Menu  ',
            quitBtnX + quitBtnW - 6,
            actionY + actionH / 2,
        );

        // ENTER hint — centre
        const nextLabel =
            this._currentTurn < this.ctx.players.length - 1
                ? `ENTER → P${this._currentTurn + 2} Turn`
                : 'ENTER → Start Run';
        p.fill(100, 200, 120);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(12);
        p.text(nextLabel, gameWidth / 2, actionY + actionH / 2);
    }

    _handlePaletteClick(mx, my) {
        const { gameWidth, gameHeight } = this.ctx;
        const ROW_SZ = 7;
        const btnW = 116;
        const btnH = 46;
        const startX = 40;
        const btnGap = 6;
        const pH = this._paletteH();
        const pY = gameHeight - pH;
        const row0Y = pY + 8;
        const row1Y = row0Y + btnH + 6;

        // Obstacle palette buttons
        BuildState.PALETTE.forEach((item, i) => {
            const row = Math.floor(i / ROW_SZ);
            const col_i = i % ROW_SZ;
            const bx = startX + col_i * (btnW + btnGap);
            const by = row === 0 ? row0Y : row1Y;

            if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                if (this._tokenCount(item.type) <= 0) return;
                this._selectedType =
                    this._selectedType === item.type ? null : item.type;
            }
        });

        // Action row buttons
        const undoBtnW = 130;
        const undoBtnX = startX;
        const quitBtnW = 130;
        const quitBtnX = gameWidth - quitBtnW - startX;
        const actionY = row1Y + btnH + 4;
        const actionH = 30;

        if (
            mx >= undoBtnX &&
            mx <= undoBtnX + undoBtnW &&
            my >= actionY &&
            my <= actionY + actionH
        ) {
            this._undoLast();
            return;
        }
        if (
            mx >= quitBtnX &&
            mx <= quitBtnX + quitBtnW &&
            my >= actionY &&
            my <= actionY + actionH
        ) {
            this.goTo(GameStage.MAPMENU);
        }
    }

    _undoLast() {
        if (this._turnObstacles.length === 0) return;
        const obs = this._turnObstacles[this._turnObstacles.length - 1];
        this._removeAt(obs.x, obs.y);
        this._turnObstacles.pop();

        if (obs.type === ObstacleType.TELEPORTER) {
            if (obs === this._pendingTeleporter) {
                this._pendingTeleporter = null;
                this._refundToken(ObstacleType.TELEPORTER);
            } else if (obs.partner) {
                obs.partner.partner = null;
                if (this._turnObstacles.includes(obs.partner)) {
                    this._pendingTeleporter = obs.partner;
                }
            } else {
                this._refundToken(ObstacleType.TELEPORTER);
            }
        } else {
            this._refundToken(obs.type);
        }
    }

    _isTileBlocked(px, py) {
        const { tiledMap } = this.ctx;
        const T = GameConfig.TILE;
        const tx = Math.floor(px / T);
        const ty = Math.floor(py / T);
        if (
            ty < 0 ||
            ty >= tiledMap.MAP.length ||
            tx < 0 ||
            tx >= tiledMap.MAP[0].length
        )
            return true;
        return BLOCKED_TILES.has(tiledMap.MAP[ty][tx]);
    }

    _obstacleAt(px, py) {
        return this.ctx.placedObstacles.some((o) => o.x === px && o.y === py);
    }

    _removeAt(px, py) {
        const arr = this.ctx.placedObstacles;
        const idx = arr.findIndex((o) => o.x === px && o.y === py);
        if (idx !== -1) return arr.splice(idx, 1)[0];
        return null;
    }

    _createObstacle(type, x, y) {
        const { p } = this.ctx;
        let obs = null;
        switch (type) {
            case ObstacleType.PLATFORM:
                obs = new Platform(p, x, y);
                break;
            case ObstacleType.MOVING_PLATFORM:
                obs = new MovingPlatform(p, x, y);
                break;
            case ObstacleType.FALLING_PLATFORM:
                obs = new FallingPlatform(p, x, y, this.fallingPlatformFrames);
                break;
            case ObstacleType.ICE_PLATFORM:
                obs = new IcePlatform(p, x, y);
                break;
            case ObstacleType.BOUNCE_PAD:
                obs = new BouncePad(p, x, y, this.trampolineBouncing);
                break;
            case ObstacleType.SPIKE:
                obs = new SpikeObstacle(p, x, y);
                break;
            case ObstacleType.CANNON:
                obs = new Cannon(p, x, y, this._cannonDir, this.cannonImg);
                break;
            case ObstacleType.SAW:
                obs = new Saw(p, x, y, this.sawFrames);
                break;
            case ObstacleType.FLAME:
                obs = new Flame(p, x, y, this.fireFrames);
                break;
            case ObstacleType.SPIKED_BALL:
                obs = new SpikedBall(p, x, y, this.spikedBallImg);
                break;
            case ObstacleType.ICE_BLOCK:
                obs = new IceBlock(p, x, y);
                break;
            case ObstacleType.WIND_ZONE:
                obs = new WindZone(p, x, y, this._windDir);
                break;
            case ObstacleType.TELEPORTER:
                obs = new Teleporter(p, x, y);
                break;
            default:
                return null;
        }
        if (obs) obs.type = type; // stamp type so undo/refund can read it back
        return obs;
    }
}
