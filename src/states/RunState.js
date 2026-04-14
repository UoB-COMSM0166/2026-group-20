import { State } from './State.js';
import { RespawnManager } from '../systems/RespawnManager.js';
import { TimeManager } from '../systems/TimeManager.js';
import { PauseManager } from '../systems/PauseManager.js';
import { PlayerGameState } from '../config/PlayerGameState.js';
import { PlayerState } from '../config/PlayerState.js';
import { DeathReason } from '../config/DeathReason.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { drawMap, MAP, getCoins } from '../maps/MapLoader.js';
import { DrawPlayer } from '../utils/DrawPlayer.js';

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
        const { p, gameWidth, gameHeight, players, scoreManager } = this.ctx;

        this.coins          = getCoins(p, this.ctx.placedObstacles);
        this.respawnManager = new RespawnManager(scoreManager);
        this.timeManager    = new TimeManager(players, scoreManager);
        this.pauseManager   = new PauseManager(p, gameWidth, gameHeight);

        this._resetRound();
    }

    update(deltaTime) {
        // All game logic is frozen while paused
        if (this.pauseManager.isPaused) return;

        const { players, scoreManager, placedObstacles, gameWidth, gameHeight } = this.ctx;

        this.respawnManager.update(deltaTime);
        this.timeManager.update(deltaTime);

        if (this.timeManager.isGameOver) {
            this.goTo(GameStage.RESULTS);
            return;
        }

        // Update obstacles first so moving platforms have their new position
        for (const obs of this.ctx.placedObstacles) {
            obs.update(deltaTime, gameWidth, gameHeight);
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
            player.update(players, this.respawnManager, placedObstacles);

            const { p } = this.ctx;
            const tx = p.floor((player.x + player.w / 2) / GameConfig.TILE);
            const ty = p.floor((player.y + player.h / 2) / GameConfig.TILE);
            if (MAP[ty] && MAP[ty][tx] === 'F') {
                this.timeManager.onPlayerReachFinish(player);
                player.lifeState = PlayerState.DEAD;
            }
        }

        // Post-physics effects (FallingPlatform, BouncePad, SpikePlatform, Teleporter, Flame)
        for (const obs of placedObstacles) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.PLAYING) continue;
                obs.applyEffect(player, players, this.respawnManager, placedObstacles);
            }
        }

        for (const coin of this.coins) {
            coin.update(players, scoreManager);
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
    }

    render(mx, my) {
        const { p, players, scoreManager, gameWidth, gameHeight, placedObstacles } = this.ctx;

        p.background(25);
        drawMap(p);

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

        // HUD — phase label
        p.noStroke();
        p.fill(100, 200, 120);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(13);
        p.text('RUN PHASE', gameWidth / 2, 8);

        // HUD — timer
        p.fill(255);
        p.textSize(22);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(this.timeManager.timeLeft)}s`, gameWidth / 2, 26);

        // HUD — per-player coins + wallet
        p.textSize(15);
        for (const player of players) {
            const side = player.playerNo === 0 ? p.LEFT : p.RIGHT;
            const hx   = player.playerNo === 0 ? 10 : gameWidth - 10;
            p.textAlign(side, p.TOP);
            p.fill(player.playerNo === 0 ? p.color(90, 170, 255) : p.color(255, 200, 80));
            p.text(
                `P${player.playerNo + 1}  🪙 ${scoreManager.getRoundCoins(player)}  💰 ${scoreManager.getWallet(player)}`,
                hx, 10,
            );
        }

        // Controls hint
        p.fill(160, 160, 180);
        p.textSize(13);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('P1: A/D + W   P2: ←/→ + ↑', 10, gameHeight - 8);

        // Pause button (bottom-right)
        const qW = 100, qH = 24;
        const qX = gameWidth - qW - 8;
        const qY = gameHeight - qH - 6;
        const qHov = mx >= qX && mx <= qX + qW && my >= qY && my <= qY + qH;
        p.noStroke();
        p.fill(qHov ? [55, 65, 110] : [35, 42, 78]);
        p.rect(qX, qY, qW, qH, 5);
        p.fill(180, 195, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(11);
        p.text('⏸  Pause', qX + qW / 2, qY + qH / 2);

        // Pause overlay — drawn last so it sits on top of everything
        this.pauseManager.render(mx, my);
    }

    mousePressed(mx, my) {
        // If paused, PauseManager handles all clicks
        if (this.pauseManager.isPaused) {
            this.pauseManager.mousePressed(mx, my,
                () => this.pauseManager.resume(),
                () => { this._resetRound(); this.pauseManager.resume(); },
                () => this.goTo(GameStage.MENU)
            );
            return;
        }

        // Pause button (bottom-right)
        const { gameWidth, gameHeight } = this.ctx;
        const qW = 100, qH = 24;
        const qX = gameWidth - qW - 8;
        const qY = gameHeight - qH - 6;
        if (mx >= qX && mx <= qX + qW && my >= qY && my <= qY + qH) {
            this.pauseManager.pause();
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ESCAPE) {
            this.pauseManager.toggle();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    _resetRound() {
        const { players, scoreManager } = this.ctx;

        this.respawnManager.clear();
        this.timeManager.reset();
        scoreManager.resetRound();

        for (const coin of this.coins) coin.reset();

        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING);
        }
    }
}
