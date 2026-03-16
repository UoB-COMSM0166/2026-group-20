import { GameConfig } from '../config/GameConfig.js';
import { PlayerScore } from '../models/PlayerScore.js';

/**
 * ScoreManager — single source of truth for all scoring data.
 *
 * Responsibilities:
 *   1. Coin tracking  — roundCoins (lost on fail) and wallet (persistent)
 *   2. Stat tracking  — deaths and finish times via PlayerScore records
 *   3. Ranking        — getRankedScores() orders players by:
 *                         finished first → finish time (asc) → coins (desc)
 *
 * Reward algorithm (finish order → wallet):
 *   1st → 20   2nd → 10   3rd → 5   4th → 2   Fail → 0
 *   Configured in GameConfig.FINISH_REWARDS.
 */
export class ScoreManager {
    /**
     * @param {Player[]} players
     */
    constructor(players) {
        this.wallet = new Map(players.map((p) => [p.playerNo, 0]));
        this.roundCoins = new Map(players.map((p) => [p.playerNo, 0]));

        // One PlayerScore record per player — live-updated throughout the round
        this.scores = new Map(
            players.map((p) => [p.playerNo, new PlayerScore(p.playerNo)]),
        );
    }

    // ─── Per-frame ────────────────────────────────────────────────────────────

    /**
     * Called by Coin.update() when a player touches a coin.
     * @param {Player} player
     * @param {Coin}   coin
     */
    collectCoin(player, coin) {
        const current = this.roundCoins.get(player.playerNo) ?? 0;
        this.roundCoins.set(player.playerNo, current + coin.value);
        console.log(
            `Player ${player.playerNo} collected a coin (+${coin.value}) — round total: ${current + coin.value}`,
        );
    }

    /**
     * Called by RespawnManager when a player dies.
     * @param {Player} player
     */
    recordDeath(player) {
        const score = this.scores.get(player.playerNo);
        if (score) score.deaths++;
        console.log(`Player ${player.playerNo} death #${score?.deaths}`);
    }

    // ─── End-of-round events ─────────────────────────────────────────────────

    /**
     * Called by TimeManager when a player reaches the finish tile.
     * Awards (finish reward + round coins) to wallet, snapshots stats.
     *
     * @param {Player} player
     * @param {number} rank        — 1-indexed finish position
     * @param {number} elapsedSecs — seconds elapsed since round start
     */
    onPlayerFinish(player, rank, elapsedSecs) {
        const reward = GameConfig.FINISH_REWARDS[rank - 1] ?? 0;
        const coins = this.roundCoins.get(player.playerNo) ?? 0;
        const prev = this.wallet.get(player.playerNo) ?? 0;
        const newWallet = prev + reward + coins;

        this.wallet.set(player.playerNo, newWallet);
        this.roundCoins.set(player.playerNo, 0);

        // Snapshot into PlayerScore
        const score = this.scores.get(player.playerNo);
        score.finished = true;
        score.finishTime = elapsedSecs;
        score.coins = coins;
        score.wallet = newWallet;

        console.log(
            `Player ${player.playerNo} finished rank ${rank} in ${elapsedSecs.toFixed(1)}s: ` +
                `+${reward} reward, +${coins} coins → wallet ${newWallet}`,
        );
    }

    /**
     * Called by TimeManager when a player fails (time up without finishing).
     * Round coins are lost; wallet unchanged; stats snapshotted.
     *
     * @param {Player} player
     */
    onPlayerFail(player) {
        const lost = this.roundCoins.get(player.playerNo) ?? 0;
        const wallet = this.wallet.get(player.playerNo) ?? 0;

        this.roundCoins.set(player.playerNo, 0);

        // Snapshot into PlayerScore
        const score = this.scores.get(player.playerNo);
        score.finished = false;
        score.coins = lost; // record what was collected even though it's lost
        score.wallet = wallet;

        console.log(
            `Player ${player.playerNo} failed — lost ${lost} round coins, wallet unchanged at ${wallet}`,
        );
    }

    // ─── Ranking ──────────────────────────────────────────────────────────────

    /**
     * Returns all PlayerScore records sorted by final leaderboard position.
     *
     * Ranking algorithm:
     *   1. Finished players always rank above failed players.
     *   2. Among finished: lower finishTime = higher rank.
     *   3. Among failed:   more coins collected = higher rank (consolation).
     *
     * Also stamps rank back onto each PlayerScore.
     *
     * @returns {PlayerScore[]}
     */
    getRankedScores() {
        const all = [...this.scores.values()];

        const finished = all
            .filter((s) => s.finished)
            .sort((a, b) => a.finishTime - b.finishTime);

        const failed = all
            .filter((s) => !s.finished)
            .sort((a, b) => b.coins - a.coins);

        const ranked = [...finished, ...failed];
        ranked.forEach((s, i) => {
            s.rank = i + 1;
        });

        return ranked;
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /** @param {Player} player @returns {number} */
    getWallet(player) {
        return this.wallet.get(player.playerNo) ?? 0;
    }

    /** @param {Player} player @returns {number} */
    getRoundCoins(player) {
        return this.roundCoins.get(player.playerNo) ?? 0;
    }

    /** @param {Player} player @returns {PlayerScore} */
    getScore(player) {
        return this.scores.get(player.playerNo);
    }

    // ─── Reset ────────────────────────────────────────────────────────────────

    /**
     * Reset round state. Wallet persists; PlayerScore records are fresh.
     * Call at the start of each new round.
     */
    resetRound() {
        for (const [playerNo] of this.roundCoins) {
            this.roundCoins.set(playerNo, 0);
            this.scores.set(playerNo, new PlayerScore(playerNo));
        }
    }
}
