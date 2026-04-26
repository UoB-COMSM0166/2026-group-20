import { State } from './State.js';
import { RespawnManager } from '../systems/RespawnManager.js';
import { TimeManager } from '../systems/TimeManager.js';
import { checkFallDeath } from '../systems/PhysicsSystem.js';
import { PlayerGameState } from '../config/PlayerGameState.js';
import { PlayerState } from '../config/PlayerState.js';
import { DeathReason } from '../config/DeathReason.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { TileType } from '../config/TileType.js';
import { DrawPlayer } from '../utils/DrawPlayer.js';
import { PauseManager } from '../systems/PauseManager.js';

/**
 * RunState — the active gameplay phase.
 *
 * Reads ctx.placedObstacles (filled by BuildState) and passes them
 * into the physics system each frame so they behave like solid/hazard tiles.
 *
 * On game over, transitions to ResultsState automatically.
 *
 * Transitions:
 *   game over (auto) → ResultsState
 *   ESC              → MapMenuState
 */
export class RunState extends State {
    enter() {
        if (this.ctx.resumeRunState) {
            this.ctx.resumeRunState = false;
            this.ctx.audioManager?.playMusic();
            return;
        }
        const { p, gameWidth, gameHeight, players, scoreManager, tiledMap } =
            this.ctx;

        this.coins = tiledMap.getCoins(this.ctx.placedObstacles);
        this.respawnManager = new RespawnManager(scoreManager);
        this.timeManager = new TimeManager(players, scoreManager);
        this.pauseManager = new PauseManager(
            p,
            gameWidth,
            gameHeight,
            this.ctx.audioManager,
        );

        this.ctx.audioManager?.playMusic();
        this._showBackpack = false;
        this._backpackPlayer = 0;
        this._timelineFrozen = false; // dev mode: freeze time
        this._runTime = 0;
        this._resetRound(true);
    }

    update(deltaTime) {
        if (!this.pauseManager) return; // guard: enter() may have crashed
        if (this.pauseManager.isPaused) return;
        const {
            players,
            scoreManager,
            placedObstacles,
            gameWidth,
            gameHeight,
            mapPixelWidth,
            mapPixelHeight,
            tiledMap,
        } = this.ctx;

        // In dev mode with frozen time, skip all time-based updates
        const actualDeltaTime = this._timelineFrozen ? 0 : deltaTime;
        this._runTime += actualDeltaTime;

        this.respawnManager.update(actualDeltaTime);
        this.timeManager.update(actualDeltaTime);

        if (this.timeManager.isGameOver) {
            this.goTo(GameStage.RESULTS);
            return;
        }

        // Update obstacles first so moving platforms have their new position
        for (const obs of this.ctx.placedObstacles) {
            obs.update(
                actualDeltaTime,
                mapPixelWidth ?? gameWidth,
                mapPixelHeight ?? this.ctx.gameHeight,
                this.ctx.tiledMap?.MAP,
            );
        }

        // Carry players on moving platforms BEFORE physics resolves this frame
        for (const obs of this.ctx.placedObstacles) {
            obs.carryPlayers(players);
        }

        // Pre-physics effects (IceBlock, WindZone) — must run before player.update()
        // so that slideMode and velocity changes are visible to horizontalMovement()
        for (const obs of placedObstacles) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.PLAYING) continue;
                obs.preEffect(player);
            }
        }

        for (const player of players) {
            if (player.gameState === PlayerGameState.SUCCESS) continue;

            // Pass placed obstacles into physics
            player.update(
                players,
                this.respawnManager,
                placedObstacles,
                tiledMap.MAP,
                mapPixelHeight ?? this.ctx.gameHeight,
            );

            const { p } = this.ctx;
            const tx = p.floor((player.x + player.w / 2) / GameConfig.TILE);
            const ty = p.floor((player.y + player.h / 2) / GameConfig.TILE);
            if (
                tiledMap.MAP[ty] &&
                tiledMap.MAP[ty][tx] === TileType.ENDPOINT
            ) {
                this.timeManager.onPlayerReachFinish(player);
                player.lifeState = PlayerState.DEAD;
                this.ctx.audioManager?.playSound('finish');
            }
        }

        // Post-physics effects (FallingPlatform, BouncePad, SpikePlatform, Teleporter, Flame)
        for (const obs of placedObstacles) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.PLAYING) continue;
                obs.applyEffect(
                    player,
                    players,
                    this.respawnManager,
                    placedObstacles,
                );
            }
        }

        for (const coin of this.coins) {
            const before = coin.collected;
            coin.update(players, scoreManager);
            if (!before && coin.collected) {
                this.ctx.audioManager?.playSound('coin');
            }
        }

        // Projectile collision — cannons manage their own projectiles internally
        for (const obs of this.ctx.placedObstacles) {
            if (!obs.checkProjectileHit) continue;
            for (const player of players) {
                if (player.gameState !== PlayerGameState.PLAYING) continue;
                if (obs.checkProjectileHit(player)) {
                    this.respawnManager.triggerDeath(player, DeathReason.TRAP);
                }
            }
        }

        // Bomb explosion: kill nearby players, then prune exploded bombs
        for (const obs of this.ctx.placedObstacles) {
            if (!obs._exploded || !obs._killRadius) continue;
            for (const player of players) {
                if (player.gameState !== PlayerGameState.PLAYING) continue;
                const px = player.x + player.w / 2;
                const py = player.y + player.h / 2;
                const d = Math.sqrt(
                    (px - obs._explosionX) ** 2 + (py - obs._explosionY) ** 2,
                );
                if (d <= obs._killRadius) {
                    this.respawnManager.triggerDeath(player, DeathReason.TRAP);
                    this.ctx.audioManager?.playSound('death');
                }
            }
        }

        // Check if any players have fallen off the map
        const mapHeight = tiledMap?.gameHeight ?? gameHeight;
        for (const player of players) {
            if (player.lifeState !== PlayerState.ALIVE) continue;
            if (checkFallDeath(player, mapHeight)) {
                this.respawnManager.triggerDeath(player, DeathReason.TRAP);
            }
        }

        // Remove exploded bombs
        // Keep exploded bombs alive until the blast-ring animation finishes
        this.ctx.placedObstacles = this.ctx.placedObstacles.filter(
            (o) =>
                !o._exploded ||
                (o._blastTimer !== undefined &&
                    o._blastTimer < o._blastDuration),
        );

        for (const player of players) {
            this._recordShadowSnapshot(player);
        }
    }

    render(mx, my) {
        try {
            const {
                p,
                players,
                scoreManager,
                gameWidth,
                gameHeight,
                placedObstacles,
                tiledMap,
            } = this.ctx;
            const worldView = this._worldView();

            p.background(25);
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

            // Draw placed obstacles
            for (const obs of placedObstacles) {
                obs.draw();
            }

            // Draw coins
            for (const coin of this.coins) {
                coin.draw();
            }

            // Draw players
            for (const player of players) {
                DrawPlayer(player);
            }
            p.pop();

            // HUD — phase label
            const hudTop = 10;
            const timerY = hudTop;
            const roundY = 34;

            // HUD — timer
            p.fill(255);
            p.textSize(8.8);
            p.textAlign(p.CENTER, p.TOP);
            p.text(
                `Time: ${Math.ceil(this.timeManager.timeLeft)}s`,
                gameWidth / 2,
                timerY,
            );

            p.fill(180, 190, 210);
            p.textSize(5.2);
            p.textAlign(p.CENTER, p.TOP);
            p.text(
                `Round ${this.ctx.scoreManager.currentRound} / ${this.ctx.scoreManager.maxRounds}`,
                gameWidth / 2,
                roundY,
            );

            // HUD — per-player coins + wallet + inventory bag
            p.textSize(6);
            const bagRects = this._bagButtonRects();
            for (const player of players) {
                const side = player.playerNo === 0 ? p.LEFT : p.RIGHT;
                const hx = player.playerNo === 0 ? 10 : gameWidth - 10;
                const bag = bagRects[player.playerNo];
                const bagLabel = `🎒 ${this._showBackpack && this._backpackPlayer === player.playerNo ? 'OPEN' : 'BAG'}`;
                p.textAlign(side, p.TOP);
                p.fill(
                    player.playerNo === 0
                        ? p.color(90, 170, 255)
                        : p.color(255, 200, 80),
                );
                p.text(
                    `P${player.playerNo + 1}  🪙 ${scoreManager.getRoundCoins(player)}  💰 ${scoreManager.getWallet(player)}  ${bagLabel}`,
                    hx,
                    10,
                );
            }

            // Backpack overlay
            if (this._showBackpack) {
                const player = players[this._backpackPlayer];
                const pcol =
                    this._backpackPlayer === 0
                        ? [90, 170, 255]
                        : [255, 200, 80];
                const bpPanW = 364,
                    bpPanH = 272;
                const bpPanX = gameWidth / 2 - bpPanW / 2;
                const bpPanY = gameHeight / 2 - bpPanH / 2;
                p.noStroke();
                p.fill(0, 0, 0, 150);
                p.rect(0, 0, gameWidth, gameHeight);
                p.fill(16, 20, 36);
                p.rect(bpPanX, bpPanY, bpPanW, bpPanH, 10);
                p.stroke(...pcol);
                p.strokeWeight(1.5);
                p.noFill();
                p.rect(bpPanX, bpPanY, bpPanW, bpPanH, 10);
                p.noStroke();
                p.fill(...pcol);
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(8);
                p.text(
                    `P${this._backpackPlayer + 1} Inventory`,
                    gameWidth / 2,
                    bpPanY + 14,
                );
                p.stroke(45, 60, 110);
                p.strokeWeight(1);
                p.line(
                    bpPanX + 20,
                    bpPanY + 38,
                    bpPanX + bpPanW - 20,
                    bpPanY + 38,
                );
                p.noStroke();
                const inv = [...player.inventory.entries()].filter(
                    ([t, c]) => typeof t === 'string' && c > 0,
                );
                if (inv.length === 0) {
                    p.fill(90, 90, 110);
                    p.textSize(5);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.text(
                        'No items in inventory',
                        gameWidth / 2,
                        bpPanY + bpPanH / 2,
                    );
                } else {
                    const cols = 3;
                    const cardW = 100;
                    const cardH = 78;
                    const gapX = 12;
                    const gapY = 10;
                    const startX = bpPanX + 20;
                    const startY = bpPanY + 52;
                    inv.forEach(([type, count], i) => {
                        const colIdx = i % cols;
                        const rowIdx = Math.floor(i / cols);
                        const cardX = startX + colIdx * (cardW + gapX);
                        const cardY = startY + rowIdx * (cardH + gapY);

                        p.noStroke();
                        p.fill(26, 32, 52);
                        p.rect(cardX, cardY, cardW, cardH, 8);
                        p.stroke(...this._itemColor(type), 180);
                        p.strokeWeight(1.2);
                        p.noFill();
                        p.rect(cardX, cardY, cardW, cardH, 8);
                        p.noStroke();

                        p.fill(36, 44, 70);
                        p.rect(cardX, cardY, cardW, 18, 8, 8, 0, 0);
                        p.fill(220, 228, 255);
                        p.textAlign(p.LEFT, p.CENTER);
                        p.textSize(4.2);
                        p.text(this._labelFor(type), cardX + 8, cardY + 10);

                        p.fill(16, 20, 34);
                        p.rect(cardX + 8, cardY + 24, 46, 46, 6);
                        p.stroke(66, 78, 120);
                        p.strokeWeight(1);
                        p.noFill();
                        p.rect(cardX + 8, cardY + 24, 46, 46, 6);
                        p.noStroke();
                        this._drawInventoryIcon(
                            type,
                            cardX + 8,
                            cardY + 24,
                            46,
                            46,
                        );

                        p.fill(110, 205, 135);
                        p.textAlign(p.LEFT, p.TOP);
                        p.textSize(5.2);
                        p.text(`x${count}`, cardX + 62, cardY + 32);

                        p.fill(150, 162, 196);
                        p.textSize(3.8);
                        p.text('Stored', cardX + 62, cardY + 50);
                    });
                }
                p.fill(70, 85, 130);
                p.textAlign(p.CENTER, p.BOTTOM);
                p.textSize(5);
                p.text(
                    'Click 🎒 again or press ESC to close',
                    gameWidth / 2,
                    bpPanY + bpPanH - 8,
                );
            }

            // Developer mode indicator and shortcuts
            if (this.ctx.devMode) {
                p.noStroke();
                p.fill(255, 60, 60, 180);
                p.rect(0, 0, gameWidth, 24);
                p.fill(255, 255, 255);
                p.textAlign(p.CENTER, p.TOP);
                p.textSize(5);
                p.text(
                    '🛠 DEV MODE: K=Kill  E=Teleport  T=Freeze time',
                    gameWidth / 2,
                    6,
                );

                // Show frozen time indicator
                if (this._timelineFrozen) {
                    p.fill(255, 150, 0);
                    p.textSize(5);
                    p.textAlign(p.RIGHT, p.TOP);
                    p.text('⏱ TIME FROZEN', gameWidth - 10, 6);
                }
            }

            // Pause overlay — drawn last so it sits on top
            this.pauseManager.render(mx, my);
        } catch (e) {
            console.error('[RunState.render] CRASH:', e.stack || e);
        }
    }

    mousePressed(mx, my) {
        if (this.pauseManager.isPaused) {
            this.pauseManager.mousePressed(
                mx,
                my,
                () => this.pauseManager.resume(),
                () => {
                    this._resetRound(false);
                    this.pauseManager.resume();
                },
                () => {
                    // Store where to return so TutorialState knows to come back
                    this.ctx.tutorialReturnStage = GameStage.RUN;
                    this.goTo(GameStage.TUTORIAL);
                },
                () => this.goTo(GameStage.MENU),
                () => {
                    this.ctx.devMode = !this.ctx.devMode;
                    this.pauseManager.resume();
                },
            );
            return;
        }

        // Backpack buttons
        const bagRects = this._bagButtonRects();
        const p1Bag = bagRects[0];
        const p2Bag = bagRects[1];
        if (
            mx >= p1Bag.x &&
            mx <= p1Bag.x + p1Bag.w &&
            my >= p1Bag.y &&
            my <= p1Bag.y + p1Bag.h
        ) {
            if (this._showBackpack && this._backpackPlayer === 0) {
                this._showBackpack = false;
            } else {
                this._showBackpack = true;
                this._backpackPlayer = 0;
            }
            return;
        }
        if (
            mx >= p2Bag.x &&
            mx <= p2Bag.x + p2Bag.w &&
            my >= p2Bag.y &&
            my <= p2Bag.y + p2Bag.h
        ) {
            if (this._showBackpack && this._backpackPlayer === 1) {
                this._showBackpack = false;
            } else {
                this._showBackpack = true;
                this._backpackPlayer = 1;
            }
            return;
        }
    }

    keyPressed() {
        const { p, players } = this.ctx;
        if (p.keyCode === p.ESCAPE) {
            if (this._showBackpack) {
                this._showBackpack = false;
            } else {
                this.pauseManager.toggle();
            }
        }

        // Developer mode shortcuts
        if (this.ctx.devMode) {
            if (p.key === 'k' || p.key === 'K') {
                // Kill player - trigger death for first playing player
                for (const player of players) {
                    if (player.gameState === PlayerGameState.PLAYING) {
                        this.respawnManager.triggerDeath(
                            player,
                            DeathReason.TRAP,
                        );
                        this.ctx.audioManager?.playSound('death');
                        break;
                    }
                }
            } else if (p.key === 'e' || p.key === 'E') {
                // Teleport to end - move first playing player to finish line
                const { tiledMap, gameWidth, gameHeight } = this.ctx;
                for (const player of players) {
                    if (player.gameState === PlayerGameState.PLAYING) {
                        // Find endpoint tile position
                        let endX = gameWidth / 2,
                            endY = gameHeight / 2;
                        for (let ty = 0; ty < tiledMap.MAP.length; ty++) {
                            for (
                                let tx = 0;
                                tx < tiledMap.MAP[ty].length;
                                tx++
                            ) {
                                if (
                                    tiledMap.MAP[ty][tx] === TileType.ENDPOINT
                                ) {
                                    endX = tx * GameConfig.TILE;
                                    endY = ty * GameConfig.TILE;
                                    break;
                                }
                            }
                        }
                        player.x = endX;
                        player.y = endY - 50;
                        player.vy = 0;
                        this.ctx.audioManager?.playSound('finish');
                        break;
                    }
                }
            } else if (p.key === 't' || p.key === 'T') {
                // Toggle time freeze
                this._timelineFrozen = !this._timelineFrozen;
            }
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    exit() {
        this.ctx.audioManager?.stopMusic();
    }

    _resetRound(advanceRound) {
        const { players, scoreManager } = this.ctx;

        this.respawnManager.clear();
        this.timeManager.reset();
        scoreManager.resetRound({ advanceRound });

        this.coins = this.ctx.tiledMap.getCoins(this.ctx.placedObstacles);
        for (const coin of this.coins) coin.reset();

        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING);
            player._shadowHistory = [];
        }
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

    _bagButtonRects() {
        const { gameWidth, p, players, scoreManager } = this.ctx;
        const topY = 10;
        const bagH = 18;
        const paddingX = 4;
        const makeBagLabel = (player) =>
            `🎒 ${this._showBackpack && this._backpackPlayer === player.playerNo ? 'OPEN' : 'BAG'}`;

        p.push();
        p.textFont(GameConfig.FONT);
        p.textSize(18);

        const p1Prefix = `P1  🪙 ${scoreManager.getRoundCoins(players[0])}  💰 ${scoreManager.getWallet(players[0])}  `;
        const p1BagLabel = makeBagLabel(players[0]);
        const p1X = 10 + p.textWidth(p1Prefix) - paddingX;
        const p1W = p.textWidth(p1BagLabel) + paddingX * 2;

        const p2BagLabel = makeBagLabel(players[1]);
        const p2W = p.textWidth(p2BagLabel) + paddingX * 2;
        const p2RightEdge = gameWidth - 10;

        p.pop();

        return [
            { x: p1X, y: topY, w: p1W, h: bagH },
            { x: p2RightEdge - p2W - paddingX, y: topY, w: p2W, h: bagH },
        ];
    }

    _recordShadowSnapshot(player) {
        if (!player || !player.isVisible) return;
        if (!Array.isArray(player._shadowHistory)) {
            player._shadowHistory = [];
        }

        player._shadowHistory.push({
            time: this._runTime,
            x: player.x,
            y: player.y,
            left: Boolean(player.input?.left),
            right: Boolean(player.input?.right),
            jump: Boolean(player.input?.jump),
            facingRight: player.facingRight,
            movementState: player.movementState,
            framesArr: player.framesArr,
            animConfig: player.animConfig,
            w: player.w,
            h: player.h,
        });

        const cutoff = this._runTime - GameConfig.SHADOW_RECORD_MS;
        while (
            player._shadowHistory.length > 0 &&
            player._shadowHistory[0].time < cutoff
        ) {
            player._shadowHistory.shift();
        }
    }

    _labelFor(type) {
        return type
            .split('_')
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
    }

    _itemColor(type) {
        const map = {
            PLATFORM: [120, 90, 60],
            MOVING_PLATFORM: [80, 110, 160],
            FALLING_PLATFORM: [90, 65, 40],
            ICE_PLATFORM: [160, 220, 245],
            BOUNCE_PAD: [80, 200, 100],
            SPIKE: [220, 60, 60],
            CANNON: [100, 100, 115],
            SAW: [200, 60, 60],
            FLAME: [240, 100, 20],
            SPIKED_BALL: [170, 80, 40],
            ICE_BLOCK: [120, 190, 230],
            WIND_ZONE: [60, 185, 185],
            TELEPORTER: [160, 80, 240],
            BOMB: [220, 80, 40],
            SHADOW: [140, 90, 220],
        };
        return map[type] ?? [150, 150, 150];
    }

    _drawInventoryIcon(type, x, y, w, h) {
        const { p, shopIcons } = this.ctx;
        const img = shopIcons?.[type] ?? null;
        p.push();
        p.noSmooth();
        if (img) {
            const { sx, sy, sw, sh, dx, dy, dw, dh } = this._inventoryIconSpec(
                type,
                img,
                x,
                y,
                w,
                h,
            );
            p.image(img, dx, dy, dw, dh, sx, sy, sw, sh);
        } else if (type === ObstacleType.BOMB) {
            const cx = x + w / 2;
            const cy = y + h / 2 + 2;
            p.noStroke();
            p.fill(38, 42, 50);
            p.circle(cx, cy, Math.min(w, h) - 12);
            p.stroke(210, 160, 60);
            p.strokeWeight(2.5);
            p.noFill();
            p.arc(cx + 8, cy - 11, 14, 14, Math.PI, Math.PI * 1.7);
            p.noStroke();
            p.fill(255, 180, 80);
            p.circle(cx + 12, cy - 16, 5);
        } else if (type === ObstacleType.SHADOW) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            p.noStroke();
            p.fill(70, 46, 122, 210);
            p.circle(cx, cy, Math.min(w, h) - 12);
            p.stroke(210, 180, 255);
            p.strokeWeight(2);
            p.noFill();
            p.circle(cx, cy, Math.min(w, h) - 18);
            p.noStroke();
            p.fill(240, 230, 255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(16);
            p.text('◌', cx, cy + 1);
        } else {
            p.noStroke();
            p.fill(...this._itemColor(type));
            p.rect(x + 8, y + 8, w - 16, h - 16, 4);
        }
        p.pop();
    }

    _inventoryIconSpec(type, img, x, y, w, h) {
        if (type === ObstacleType.MOVING_PLATFORM) {
            return {
                sx: 0,
                sy: 0,
                sw: 32,
                sh: 8,
                dx: x + 4,
                dy: y + Math.floor(h / 2) - 5,
                dw: w - 8,
                dh: 10,
            };
        }

        if (type === ObstacleType.FALLING_PLATFORM) {
            return {
                sx: 0,
                sy: 0,
                sw: 32,
                sh: 10,
                dx: x + 5,
                dy: y + Math.floor(h / 2) - 5,
                dw: w - 10,
                dh: 10,
            };
        }

        if (type === ObstacleType.BOUNCE_PAD) {
            return {
                sx: 0,
                sy: 0,
                sw: 28,
                sh: 28,
                dx: x + 6,
                dy: y + 6,
                dw: w - 12,
                dh: h - 12,
            };
        }

        if (type === ObstacleType.SAW) {
            return {
                sx: 0,
                sy: 0,
                sw: 38,
                sh: 38,
                dx: x + 6,
                dy: y + 6,
                dw: w - 12,
                dh: h - 12,
            };
        }

        if (type === ObstacleType.FLAME) {
            return {
                sx: 0,
                sy: 0,
                sw: 16,
                sh: 32,
                dx: x + 13,
                dy: y + 5,
                dw: w - 26,
                dh: h - 10,
            };
        }

        if (type === ObstacleType.WIND_ZONE) {
            return {
                sx: 32 * 2 + 6,
                sy: 9,
                sw: 22,
                sh: 14,
                dx: x,
                dy: y,
                dw: w,
                dh: h,
            };
        }

        if (type === ObstacleType.SPIKE) {
            return {
                sx: 41,
                sy: 0,
                sw: 38,
                sh: 40,
                dx: x,
                dy: y,
                dw: w,
                dh: h,
            };
        }

        if (type === ObstacleType.CANNON) {
            return {
                sx: 0,
                sy: 0,
                sw: 30,
                sh: 18,
                dx: x + 6,
                dy: y + 12,
                dw: w - 12,
                dh: 20,
            };
        }

        if (type === ObstacleType.SPIKED_BALL) {
            return {
                sx: 0,
                sy: 0,
                sw: 28,
                sh: 28,
                dx: x + 6,
                dy: y + 6,
                dw: w - 12,
                dh: h - 12,
            };
        }

        if (type === ObstacleType.TELEPORTER) {
            return {
                sx: 0,
                sy: 0,
                sw: 40,
                sh: 40,
                dx: x + 4,
                dy: y + 4,
                dw: w - 8,
                dh: h - 8,
            };
        }

        if (
            type === ObstacleType.PLATFORM ||
            type === ObstacleType.ICE_PLATFORM ||
            type === ObstacleType.ICE_BLOCK
        ) {
            return {
                sx: 0,
                sy: 0,
                sw: 40,
                sh: 40,
                dx: x + 5,
                dy: y + 5,
                dw: w - 10,
                dh: h - 10,
            };
        }

        return {
            sx: 0,
            sy: 0,
            sw: img.width,
            sh: img.height,
            dx: x + 5,
            dy: y + 5,
            dw: w - 10,
            dh: h - 10,
        };
    }
}
