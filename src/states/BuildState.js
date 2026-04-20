import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
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
import { Bomb } from '../entities/obstacles/Bomb.js';
import { Shadow } from '../entities/obstacles/Shadow.js';
import { drawShadowIcon } from '../utils/ShadowIcon.js';
import { drawBombIcon } from '../utils/BombIcon.js';
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

const BUILD_ITEM_DESCRIPTIONS = {
    PLATFORM: 'Solid block that players can stand on.',
    MOVING_PLATFORM: 'Slides left and right on a fixed path.',
    FALLING_PLATFORM: 'Drops after a player stands on it.',
    ICE_PLATFORM: 'Solid but slippery. Players slide on top.',
    BOUNCE_PAD: 'Launches players upward on contact.',
    SPIKE: 'Instant kill on touch.',
    CANNON: 'Fires projectiles in the chosen direction.',
    SAW: 'Spinning blade that kills on contact.',
    FLAME: 'Pulses on and off. Deadly while lit.',
    SPIKED_BALL: 'Static hazard ball. Instant kill on touch.',
    ICE_BLOCK: 'Pass-through ice zone that boosts slide and speed.',
    WIND_ZONE: 'Pushes players in the chosen direction.',
    TELEPORTER: 'Warp gate. One token buys a linked pair.',
    BOMB: 'Triggered explosive with a short fuse.',
    SHADOW: 'Replays the player\'s last 5 seconds as a ghost.',
};

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
        {
            type: ObstacleType.BOMB,
            label: 'Bomb',
            hint: 'Destroys platforms',
            color: [220, 80, 40],
        },
        {
            type: ObstacleType.SHADOW,
            label: 'Shadow',
            hint: 'Replays last 5s',
            color: [140, 90, 220],
        },
    ];

    enter() {
        this.ctx.mapManager?.refreshBackground?.(this.ctx);

        if (this.ctx.shopHasRun && this.ctx.tiledMap === this.ctx.mapManager?.current) {
            this.ctx.mapManager?.generateRandomMap?.(this.ctx.mapKey, this.ctx);
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
        
        // Build blocked placement map based on platform collision geometry
        this._buildBlockedPlacementMap();
    }
    
    _buildBlockedPlacementMap() {
        const { tiledMap } = this.ctx;
        const MAP = tiledMap.MAP;
        
        // Create a map of "reachable from outside" positions
        // Any position NOT reachable from the map edges is considered "inside a platform"
        const rows = MAP.length;
        const cols = MAP[0].length;
        
        this._isReachable = [];
        for (let y = 0; y < rows; y++) {
            const row = [];
            for (let x = 0; x < cols; x++) {
                row.push(false);
            }
            this._isReachable.push(row);
        }
        
        // BFS/flood fill from all map edges
        const queue = [];
        
        // Add all edge positions to queue
        for (let x = 0; x < cols; x++) {
            // Top edge
            if (!this._hasMapTerrain(x, 0)) {
                queue.push({ x, y: 0 });
                this._isReachable[0][x] = true;
            }
            // Bottom edge
            if (!this._hasMapTerrain(x, rows - 1)) {
                queue.push({ x, y: rows - 1 });
                this._isReachable[rows - 1][x] = true;
            }
        }
        
        for (let y = 0; y < rows; y++) {
            // Left edge
            if (!this._hasMapTerrain(0, y)) {
                queue.push({ x: 0, y });
                this._isReachable[y][0] = true;
            }
            // Right edge
            if (!this._hasMapTerrain(cols - 1, y)) {
                queue.push({ x: cols - 1, y });
                this._isReachable[y][cols - 1] = true;
            }
        }
        
        // BFS to mark all positions reachable from edges
        while (queue.length > 0) {
            const { x, y } = queue.shift();
            
            // Check all 4 neighbors
            const neighbors = [
                { x: x + 1, y },
                { x: x - 1, y },
                { x, y: y + 1 },
                { x, y: y - 1 }
            ];
            
            for (const neighbor of neighbors) {
                if (neighbor.x < 0 || neighbor.x >= cols || neighbor.y < 0 || neighbor.y >= rows) {
                    continue;
                }
                
                // Skip if already visited or if visible map terrain occupies this tile
                if (this._isReachable[neighbor.y][neighbor.x] || 
                    this._hasMapTerrain(neighbor.x, neighbor.y)) {
                    continue;
                }
                
                this._isReachable[neighbor.y][neighbor.x] = true;
                queue.push(neighbor);
            }
        }
    }

    _hasMapTerrain(tx, ty) {
        const { tiledMap } = this.ctx;
        if (typeof tiledMap?.hasVisibleTerrain === 'function') {
            return tiledMap.hasVisibleTerrain(tx, ty);
        }
        const tile = tiledMap?.MAP?.[ty]?.[tx];
        return BLOCKED_TILES.has(tile);
    }

    update(_dt) {}

    // ── Turn / token helpers ──────────────────────────────────────────────

    _activePlayer() {
        return this.ctx.players[this._currentTurn];
    }

    _isShopMode() {
        return this.ctx.shopHasRun;
    }

    _tokenCount(type) {
        if (this.ctx.devMode) return Infinity;
        if (!this._isShopMode()) return Infinity;
        return this._activePlayer().inventory.get(type) ?? 0;
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
        const worldView = this._worldView();
        const paletteY = gameHeight - this._paletteH();
        const worldMx = (mx - worldView.x) / worldView.scale;
        const worldMy = (my - worldView.y) / worldView.scale;

        p.background(20);
        p.push();
        p.translate(worldView.x, worldView.y);
        p.scale(worldView.scale);
        const bg = this.ctx.backgroundImage;
        if (bg) {
            p.image(
                bg,
                0,
                0,
                this.ctx.mapPixelWidth ?? gameWidth,
                this.ctx.mapPixelHeight ?? gameHeight,
            );
            p.noStroke();
            p.fill(8, 14, 24, 110);
            p.rect(
                0,
                0,
                this.ctx.mapPixelWidth ?? gameWidth,
                this.ctx.mapPixelHeight ?? gameHeight,
            );
        }
        tiledMap.render();
        tiledMap.renderEndpoint(this.ctx.endpointFlag);

        for (const obs of this.ctx.placedObstacles) {
            obs.draw();
        }

        // Ghost preview
        const T = GameConfig.TILE;
        const snapX = Math.floor(worldMx / T) * T;
        const snapY = Math.floor(worldMy / T) * T;
        const onMap =
            snapX >= 0 &&
            snapX < (this.ctx.mapPixelWidth ?? gameWidth) &&
            snapY >= 0 &&
            snapY < (this.ctx.mapPixelHeight ?? gameHeight) &&
            my < paletteY;

        if (this._selectedType && onMap) {
            const canPlace = this._canPlaceSelectedAt(snapX, snapY);
            this._drawGhost(p, this._selectedType, snapX, snapY, !canPlace);
        }
        p.pop();

        this._drawPalette(mx, my, col);

        // Dev mode banner
        if (this.ctx.devMode) {
            p.noStroke();
            p.fill(255, 50, 50, 200);
            p.rect(0, 0, gameWidth, 48);
            p.fill(255, 255, 255);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(6);
            p.textStyle(p.BOLD);
            p.text('🛠  DEVELOPER MODE ENABLED', gameWidth / 2, 4);
            p.textStyle(p.NORMAL);
            p.textSize(5.5);
            p.text('Unlimited placement • D to toggle  •  Right-click to undo', gameWidth / 2, 22);
        }

        // Header
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(7);
        p.text(`P${this._currentTurn + 1} — TRAP SETTINGS`, gameWidth / 2, this.ctx.devMode ? 52 : 10);

        p.fill(180, 180, 200);
        p.textSize(5.5);
        p.text(
            'Place your purchased obstacles — ENTER to confirm turn',
            gameWidth / 2,
            this.ctx.devMode ? 72 : 30,
        );

        // Inventory summary
        if (this._isShopMode()) {
            const inv = this._activePlayer().inventory;
            const entries = [...inv.entries()].filter(([t, c]) => typeof t === 'string' && c > 0);
            p.textSize(5.5);
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
            p.textSize(5.5);
            p.text(
                `Cannon direction: ${this._cannonDir}  (R to rotate)`,
                gameWidth / 2,
                58,
            );
        } else if (this._selectedType === ObstacleType.WIND_ZONE) {
            p.noStroke();
            p.fill(120, 230, 230);
            p.textSize(5.5);
            p.text(
                `Wind direction: ${this._windDir}  (R to rotate)`,
                gameWidth / 2,
                58,
            );
        } else if (this._selectedType === ObstacleType.TELEPORTER) {
            p.noStroke();
            p.fill(160, 80, 240);
            p.textSize(5.5);
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
        const worldView = this._worldView();

        if (my >= paletteY) {
            this._handlePaletteClick(mx, my);
            return;
        }

        const worldMx = (mx - worldView.x) / worldView.scale;
        const worldMy = (my - worldView.y) / worldView.scale;
        const snapX = Math.floor(worldMx / T) * T;
        const snapY = Math.floor(worldMy / T) * T;

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
        if (!this._canPlaceSelectedAt(snapX, snapY)) return;

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
            this.goTo(this.ctx.shopHasRun ? GameStage.SHOP : GameStage.TUTORIAL);
        } else if (p.key === 'r' || p.key === 'R') {
            this._rotateDirection();
        } else if (p.key === 'd' || p.key === 'D') {
            this.ctx.devMode = !this.ctx.devMode;
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
        return 92;
    }

    _worldView() {
        const viewportW = this.ctx.gameWidth;
        const viewportH = this.ctx.gameHeight;
        const worldW = this.ctx.mapPixelWidth ?? viewportW;
        const worldH = this.ctx.mapPixelHeight ?? viewportH;
        const scale = Math.min(viewportW / worldW, viewportH / worldH);
        return {
            scale,
            x: (viewportW - worldW * scale) / 2,
            y: (viewportH - worldH * scale) / 2,
        };
    }

    _drawGhost(p, type, x, y, invalid = false) {
        const sprites = this.ctx.shopIcons ?? {};
        switch (type) {
            case ObstacleType.PLATFORM:
                Platform.drawGhost(p, x, y, sprites.PLATFORM);
                break;
            case ObstacleType.MOVING_PLATFORM:
                MovingPlatform.drawGhost(p, x, y, sprites.MOVING_PLATFORM);
                break;
            case ObstacleType.FALLING_PLATFORM:
                FallingPlatform.drawGhost(p, x, y, this.fallingPlatformFrames);
                break;
            case ObstacleType.ICE_PLATFORM:
                IcePlatform.drawGhost(p, x, y, sprites.ICE_PLATFORM);
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
                IceBlock.drawGhost(p, x, y, sprites.ICE_BLOCK);
                break;
            case ObstacleType.WIND_ZONE:
                WindZone.drawGhost(p, x, y, this._windDir, sprites.WIND_ZONE);
                break;
            case ObstacleType.TELEPORTER:
                Teleporter.drawGhost(p, x, y, sprites.TELEPORTER);
                break;
            case ObstacleType.BOMB:
                Bomb.drawGhost(p, x, y);
                break;
            case ObstacleType.SHADOW:
                Shadow.drawGhost(p, x, y);
                break;
        }

        if (invalid) {
            p.noStroke();
            p.fill(255, 60, 60, 110);
            p.rect(x, y, GameConfig.TILE, GameConfig.TILE, 4);
        }
    }

    _drawPalette(mx, my, playerCol) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const sprites = this.ctx.shopIcons ?? {};
        const pH = this._paletteH();
        const pY = gameHeight - pH;
        const ROW_SZ = 7; // items per row
        const btnW = 118;
        const btnH = 22;
        const startX = 28;
        const btnGap = 6;
        const row0Y = pY + 6;
        const row1Y = row0Y + btnH + 5;
        let hoveredItem = null;

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
        p.textSize(4.8);
        p.text(`P${this._currentTurn + 1}`, 8, pY + pH / 2 - 10);

        BuildState.PALETTE.forEach((item, i) => {
            const row = Math.floor(i / ROW_SZ);
            const col_i = i % ROW_SZ;
            const bx = startX + col_i * (btnW + btnGap);
            const by = row === 0 ? row0Y : row1Y;

            const hovered =
                mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH;
            if (hovered) hoveredItem = item;
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

            const iconX = bx + 3;
            const iconY = by + 2;
            const iconS = 18;
            p.fill(15, 18, 28);
            p.rect(iconX, iconY, iconS, iconS, 3);
            p.push();
            if (!available) p.tint(120, 120);
            else p.tint(255, 230);
            this._drawPaletteIcon(item.type, iconX, iconY, iconS, iconS, available);
            p.pop();

            p.fill(available ? [210, 210, 235] : [65, 65, 75]);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(4.8);
            p.text(item.label, bx + 25, by + btnH / 2);

            if (this._isShopMode()) {
                const badge = tokens === Infinity ? '' : `×${tokens}`;
                p.fill(tokens > 0 ? [100, 200, 120] : [130, 60, 60]);
                p.textAlign(p.RIGHT, p.CENTER);
                p.textSize(4.8);
                p.text(badge, bx + btnW - 5, by + btnH / 2);
            }
        });

        // ── Action row (below both obstacle rows) ─────────────────────────
        const actionY   = row1Y + btnH + 5;
        const actionH   = 18;

        // Undo Last — left side
        const undoBtnW  = 104;
        const undoBtnX  = startX;
        const canUndo   = this._turnObstacles.length > 0;
        const undoHov   = mx >= undoBtnX && mx <= undoBtnX + undoBtnW &&
                          my >= actionY   && my <= actionY + actionH;
        p.noStroke();
        p.fill(canUndo ? (undoHov ? [90, 70, 140] : [65, 48, 105]) : [30, 28, 45]);
        p.rect(undoBtnX, actionY, undoBtnW, actionH, 5);
        p.fill(canUndo ? [200, 175, 255] : [70, 65, 90]);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(4.8);
        p.text('UNDO', undoBtnX + undoBtnW / 2, actionY + actionH / 2 + 0.5);

        // Quit to Menu — right side
        const quitBtnW  = 104;
        const quitBtnX  = gameWidth - quitBtnW - startX;
        const quitHov   = mx >= quitBtnX && mx <= quitBtnX + quitBtnW &&
                          my >= actionY   && my <= actionY + actionH;
        p.noStroke();
        p.fill(quitHov ? [130, 38, 38] : [88, 26, 26]);
        p.rect(quitBtnX, actionY, quitBtnW, actionH, 5);
        p.fill(230, 130, 130);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(4.8);
        p.text('QUIT', quitBtnX + quitBtnW / 2, actionY + actionH / 2 + 0.5);

        // ENTER hint — centre
        const nextLabel =
            this._currentTurn < this.ctx.players.length - 1
                ? `ENTER → P${this._currentTurn + 2} Turn`
                : 'ENTER → Start Run';
        p.fill(100, 200, 120);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(4.8);
        p.text(nextLabel, gameWidth / 2, actionY + actionH / 2);

        if (hoveredItem) {
            const tipW = 292;
            const tipH = 72;
            const tipX = Math.min(mx + 12, gameWidth - tipW - 8);
            const tipY = pY - tipH - 6;
            p.noStroke();
            p.fill(16, 18, 30, 238);
            p.rect(tipX, tipY, tipW, tipH, 6);
            p.stroke(...playerCol, 180);
            p.strokeWeight(1);
            p.noFill();
            p.rect(tipX, tipY, tipW, tipH, 6);
            p.noStroke();
            p.fill(225, 232, 255);
            p.textAlign(p.LEFT, p.TOP);
            this._drawPaletteIcon(hoveredItem.type, tipX + 8, tipY + 8, 20, 20, true);
            p.textSize(4.8);
            p.text(hoveredItem.label, tipX + 34, tipY + 8);
            p.fill(170, 178, 205);
            p.textSize(4.3);
            p.text(
                BUILD_ITEM_DESCRIPTIONS[hoveredItem.type] ?? hoveredItem.hint,
                tipX + 8,
                tipY + 32,
                tipW - 16,
                tipH - 38,
            );
        }
    }

    _drawPaletteIcon(type, x, y, w, h, available = true) {
        const { p, shopIcons } = this.ctx;
        const img = shopIcons?.[type] ?? null;
        p.push();
        p.noSmooth();

        if (img) {
            const { sx, sy, sw, sh, dx, dy, dw, dh } = this._paletteIconDrawSpec(
                type,
                img,
                x,
                y,
                w,
                h,
            );
            p.image(img, dx, dy, dw, dh, sx, sy, sw, sh);
            p.pop();
            return;
        }

        if (type === ObstacleType.BOMB) {
            drawBombIcon(p, x, y, w, h);
            p.pop();
            return;
        }

        if (type === ObstacleType.SHADOW) {
            const boost = Math.max(1, Math.floor(Math.min(w, h) * 0.12));
            drawShadowIcon(
                p,
                x - boost,
                y - boost,
                w + boost * 2,
                h + boost * 2,
            );
            p.pop();
            return;
        }

        const fallbackColour = BuildState.PALETTE.find((item) => item.type === type)?.color ?? [150, 150, 150];
        p.noStroke();
        p.fill(
            ...fallbackColour.map((c) => (available ? c : Math.floor(c * 0.3))),
        );
        p.rect(x + 2, y + 2, w - 4, h - 4, 2);
        p.pop();
    }

    _fitIconRect(x, y, w, h, sourceW, sourceH, maxW = w, maxH = h) {
        const scale = Math.min(maxW / sourceW, maxH / sourceH);
        const dw = sourceW * scale;
        const dh = sourceH * scale;
        return {
            dx: x + (w - dw) / 2,
            dy: y + (h - dh) / 2,
            dw,
            dh,
        };
    }

    _paletteIconDrawSpec(type, img, x, y, w, h) {
        if (type === ObstacleType.MOVING_PLATFORM) {
            const fit = this._fitIconRect(x, y, w, h, 32, 8, w, h);
            return {
                sx: 0, sy: 0, sw: 32, sh: 8,
                ...fit,
            };
        }

        if (type === ObstacleType.FALLING_PLATFORM) {
            const fit = this._fitIconRect(x, y, w, h, 32, 10, w, h);
            return {
                sx: 0, sy: 0, sw: 32, sh: 10,
                ...fit,
            };
        }

        if (type === ObstacleType.BOUNCE_PAD) {
            const fit = this._fitIconRect(x, y, w, h, 28, 28, w, h);
            return {
                sx: 0, sy: 0, sw: 28, sh: 28,
                ...fit,
            };
        }

        if (type === ObstacleType.SAW) {
            const fit = this._fitIconRect(x, y, w, h, 38, 38, w, h);
            return {
                sx: 0, sy: 0, sw: 38, sh: 38,
                ...fit,
            };
        }

        if (type === ObstacleType.CANNON) {
            const fit = this._fitIconRect(x, y, w, h, 30, 18, w, h);
            return {
                sx: 0, sy: 0, sw: 30, sh: 18,
                ...fit,
            };
        }

        if (type === ObstacleType.WIND_ZONE) {
            const fit = this._fitIconRect(x, y, w, h, 32, 32, w, h);
            return {
                sx: 0, sy: 0, sw: 32, sh: 32,
                ...fit,
            };
        }

        if (type === ObstacleType.TELEPORTER) {
            const fit = this._fitIconRect(x, y, w, h, 40, 40, w, h);
            return {
                sx: 0, sy: 0, sw: 40, sh: 40,
                ...fit,
            };
        }

        if (type === ObstacleType.FLAME) {
            const fit = this._fitIconRect(x, y, w, h, 16, 32, w, h);
            return {
                sx: 0, sy: 0, sw: 16, sh: 32,
                ...fit,
            };
        }

        if (type === ObstacleType.SPIKED_BALL) {
            const fit = this._fitIconRect(x, y, w, h, img.width, img.height, w, h);
            return {
                sx: 0, sy: 0, sw: img.width, sh: img.height,
                ...fit,
            };
        }

        const fit = this._fitIconRect(x, y, w, h, img.width, img.height, w, h);
        return {
            sx: 0, sy: 0, sw: img.width, sh: img.height,
            ...fit,
        };
    }

    _handlePaletteClick(mx, my) {
        const { gameWidth, gameHeight } = this.ctx;
        const ROW_SZ = 7;
        const btnW = 118;
        const btnH = 22;
        const startX = 28;
        const btnGap = 6;
        const pH     = this._paletteH();
        const pY     = gameHeight - pH;
        const row0Y  = pY + 6;
        const row1Y  = row0Y + btnH + 5;

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
        const undoBtnW = 104;
        const undoBtnX = startX;
        const quitBtnW = 104;
        const quitBtnX = gameWidth - quitBtnW - startX;
        const actionY  = row1Y + btnH + 5;
        const actionH  = 18;

        if (mx >= undoBtnX && mx <= undoBtnX + undoBtnW &&
            my >= actionY   && my <= actionY + actionH) {
            this._undoLast();
            return;
        }
        if (mx >= quitBtnX && mx <= quitBtnX + quitBtnW &&
            my >= actionY   && my <= actionY + actionH) {
            this.goTo(GameStage.MENU);
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
        // Even in devMode, enforce blocking to prevent穿模
        const { tiledMap } = this.ctx;
        const T = GameConfig.TILE;
        const tx = Math.floor(px / T);
        const ty = Math.floor(py / T);
        const MAP = tiledMap.MAP;
        
        // Bounds check
        if (ty < 0 || ty >= MAP.length || tx < 0 || tx >= MAP[0].length) {
            return true;
        }
        
        // Also block if visible map terrain occupies this tile
        if (this._hasMapTerrain(tx, ty)) {
            return true;
        }
        
        return false;
    }

    _canPlaceSelectedAt(px, py) {
        if (this._isTileBlocked(px, py)) return false;
        if (this._obstacleAt(px, py)) return false;

        if (this._selectedType === ObstacleType.BOMB) {
            return this._canPlaceBomb(px, py);
        }

        return true;
    }

    /**
     * Bombs are surface-only items:
     *   - the bomb tile itself must be empty
     *   - the tile directly below must be solid ground
     *   - the tile above must also be empty, so the bomb is not tucked into terrain
     */
    _canPlaceBomb(bombX, bombY) {
        const { tiledMap } = this.ctx;
        const T = GameConfig.TILE;
        const MAP = tiledMap.MAP;

        const bombTx = Math.floor(bombX / T);
        const bombTy = Math.floor(bombY / T);

        if (
            bombTy <= 0 ||
            bombTy >= MAP.length - 1 ||
            bombTx < 0 ||
            bombTx >= MAP[0].length
        ) {
            return false;
        }

        const currentTile = MAP[bombTy]?.[bombTx];
        const belowTile = MAP[bombTy + 1]?.[bombTx];
        const aboveTile = MAP[bombTy - 1]?.[bombTx];

        if (currentTile !== TileType.EMPTY) {
            return false;
        }

        return belowTile === TileType.SOLID && aboveTile === TileType.EMPTY;
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
        const sprites = this.ctx.shopIcons ?? {};
        let obs = null;
        switch (type) {
            case ObstacleType.PLATFORM:          obs = new Platform(p, x, y, sprites.PLATFORM); break;
            case ObstacleType.MOVING_PLATFORM:   obs = new MovingPlatform(p, x, y, sprites.MOVING_PLATFORM); break;
            case ObstacleType.FALLING_PLATFORM:  obs = new FallingPlatform(p, x, y, this.fallingPlatformFrames); break;
            case ObstacleType.ICE_PLATFORM:      obs = new IcePlatform(p, x, y, sprites.ICE_PLATFORM); break;
            case ObstacleType.BOUNCE_PAD:        obs = new BouncePad(p, x, y, this.trampolineBouncing); break;
            case ObstacleType.SPIKE:             obs = new SpikeObstacle(p, x, y); break;
            case ObstacleType.CANNON:            obs = new Cannon(p, x, y, this._cannonDir, this.cannonImg); break;
            case ObstacleType.SAW:               obs = new Saw(p, x, y, this.sawFrames); break;
            case ObstacleType.FLAME:             obs = new Flame(p, x, y, this.fireFrames); break;
            case ObstacleType.SPIKED_BALL:       obs = new SpikedBall(p, x, y, this.spikedBallImg); break;
            case ObstacleType.ICE_BLOCK:         obs = new IceBlock(p, x, y, sprites.ICE_BLOCK); break;
            case ObstacleType.WIND_ZONE:         obs = new WindZone(p, x, y, this._windDir, sprites.WIND_ZONE); break;
            case ObstacleType.TELEPORTER:        obs = new Teleporter(p, x, y, sprites.TELEPORTER); break;
            case ObstacleType.BOMB:              obs = new Bomb(p, x, y, this.ctx); break;
            case ObstacleType.SHADOW:            obs = new Shadow(p, x, y, this.ctx); break;
            default: return null;
        }
        if (obs) obs.type = type; // stamp type so undo/refund can read it back
        return obs;
    }
}
