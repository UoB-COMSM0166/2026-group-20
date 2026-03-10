import { State } from './State.js';
import { RespawnManager } from '../systems/RespawnManager.js';
import { TimeManager } from '../systems/TimeManager.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { PlayerGameState } from '../config/PlayerGameState.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { drawMap, MAP, getCoins } from '../maps/MapLoader.js';
import { DrawPlayer } from '../utils/DrawPlayer.js';

/**
 * PlayState — the main in-game loop for Map 1.
 *
 * Owns all per-round objects (respawnManager, timeManager, coins, scoreboard).
 * The shared context provides players and scoreManager so the wallet
 * persists if the player returns to the map menu and starts a new round.
 *
 * enter() always resets the round so replaying is clean.
 *
 * Transitions:
 *   ESC → MapMenuState
 */
export class PlayState extends State {
    enter() {
        const { p, gameWidth, gameHeight, players, scoreManager } = this.ctx;

        // Per-round objects — recreated / reset each time we enter this state
        this.coins         = getCoins(p);
        this.respawnManager = new RespawnManager(scoreManager);
        this.timeManager   = new TimeManager(players, scoreManager);
        this.scoreboard    = new Scoreboard(p, gameWidth, gameHeight);

        this._resetRound();
    }

    update(deltaTime) {
        if (this.timeManager.isGameOver) return;

        const { players, scoreManager } = this.ctx;

        this.respawnManager.update(deltaTime);
        this.timeManager.update(deltaTime);

        for (const player of players) {
            if (player.gameState === PlayerGameState.SUCCESS) continue;

            player.update(players, this.respawnManager);

            // Finish tile detection
            const { p } = this.ctx;
            const tx = p.floor((player.x + player.w / 2) / GameConfig.TILE);
            const ty = p.floor((player.y + player.h / 2) / GameConfig.TILE);
            if (MAP[ty] && MAP[ty][tx] === 'F') {
                this.timeManager.onPlayerReachFinish(player);
            }
        }

        // Coins
        for (const coin of this.coins) {
            coin.update(players, scoreManager);
        }
    }

    render(mx, my) {
        const { p, players, scoreManager, gameWidth, gameHeight } = this.ctx;

        p.background(25);
        drawMap(p);

        // Draw coins
        for (const coin of this.coins) {
            coin.draw();
        }

        // Draw players
        for (const player of players) {
            DrawPlayer(player);
        }

        // HUD — timer (centre top)
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(this.timeManager.timeLeft)}s`, gameWidth / 2, 20);

        // HUD — per-player round coins + wallet (sides)
        p.textSize(16);
        for (const player of players) {
            const side = player.playerNo === 0 ? p.LEFT : p.RIGHT;
            const hx   = player.playerNo === 0 ? 10 : gameWidth - 10;
            p.textAlign(side, p.TOP);
            p.fill(player.playerNo === 0 ? p.color(90, 170, 255) : p.color(255, 200, 80));
            p.text(
                `P${player.playerNo + 1}  🪙 ${scoreManager.getRoundCoins(player)}  💰 ${scoreManager.getWallet(player)}`,
                hx, 20
            );
        }

        // Controls hint
        p.fill(255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('P1: A/D + W   P2: ←/→ + ↑   (ESC to return)', 10, gameHeight - 10);

        // Scoreboard overlay when game is over
        if (this.timeManager.isGameOver) {
            this.scoreboard.render(scoreManager);
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        }
    }

    exit() {
        // Nothing to tear down — per-round objects are recreated on next enter()
    }

    // ── Private ──────────────────────────────────────────────────────────────

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
