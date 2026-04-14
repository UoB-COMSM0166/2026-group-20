import { GameConfig } from '../config/GameConfig.js';
import { PlayerGameState } from '../config/PlayerGameState.js';

export class TimeManager {
    /**
     * @param {Player[]}     players
     * @param {ScoreManager} scoreManager
     */
    constructor(players, scoreManager) {
        this.timeLimit = GameConfig.TIME_LIMIT;
        this.timeLeft = GameConfig.TIME_LIMIT;
        this.isGameOver = false;
        this.rankings = [];
        this.players = players;
        this.scoreManager = scoreManager;
    }

    /**
     * Tick the countdown. Triggers game-over when time reaches zero.
     * @param {number} deltaTime - ms since last frame
     */
    update(deltaTime) {
        if (this.isGameOver) return;

        this.timeLeft -= deltaTime / 1000;

        if (this.timeLeft <= 0) {
            this.timeLeft = 0;
            this.handleTimeUp();
        }
    }

    /**
     * Called when a player touches the finish tile.
     * Calculates elapsed time and forwards rank + time to ScoreManager.
     * @param {Player} player
     */
    onPlayerReachFinish(player) {
        if (this.isGameOver || player.gameState !== PlayerGameState.PLAYING)
            return;

        player.setGameState(PlayerGameState.SUCCESS);
        this.rankings.push(player);

        const rank = this.rankings.length;
        const elapsedSecs = parseFloat(
            (this.timeLimit - this.timeLeft).toFixed(2),
        );

        this.scoreManager.onPlayerFinish(player, rank, elapsedSecs);

        if (rank === this.players.length) {
            this.isGameOver = true;
            console.log('All players finished — game over.');
        }
    }

    /**
     * Called when time expires.
     * Any unfinished player is marked FAILED and loses their round coins.
     */
    handleTimeUp() {
        this.isGameOver = true;
        console.log("Time's up — game over.");

        for (const player of this.players) {
            if (player.gameState !== PlayerGameState.SUCCESS) {
                player.setGameState(PlayerGameState.FAILED);
                this.scoreManager.onPlayerFail(player);
            }
        }
    }

    /**
     * @param {Player} player
     * @returns {number|null} 1-indexed finish rank, or null if not finished
     */
    getPlayerRank(player) {
        const index = this.rankings.indexOf(player);
        return index !== -1 ? index + 1 : null;
    }

    /**
     * Reset timer and rankings for a new round.
     * Does NOT reset wallet — call scoreManager.resetRound() separately.
     */
    reset() {
        this.timeLeft = this.timeLimit;
        this.isGameOver = false;
        this.rankings = [];
    }
}
