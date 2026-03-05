/**
 * Tracks each player's score across a game session.
 * Handles coin collection events and exposes per-player scores for the HUD.
 *
 * TODO: implement from feature/coinEntity
 */
export class ScoreManager {
    /**
     * @param {Player[]} players
     */
    constructor(players) {
        this.scores = new Map(players.map((p) => [p.playerNo, 0]));
    }

    /**
     * Add points for a player.
     * @param {Player} player
     * @param {number} points
     */
    addScore(player, points) {
        const current = this.scores.get(player.playerNo) ?? 0;
        this.scores.set(player.playerNo, current + points);
    }

    /**
     * @param {Player} player
     * @returns {number}
     */
    getScore(player) {
        return this.scores.get(player.playerNo) ?? 0;
    }

    reset() {
        for (const key of this.scores.keys()) {
            this.scores.set(key, 0);
        }
    }
}
