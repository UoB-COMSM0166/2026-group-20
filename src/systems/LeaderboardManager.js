/**
 * LeaderboardManager — stores and retrieves per-map leaderboards.
 *
 * Uses localStorage for persistence across sessions.
 * Each entry: { name, time, date }
 * Top 10 entries per map are kept.
 */
export class LeaderboardManager {

    static KEY_PREFIX = 'uch_leaderboard_';
    static MAX_ENTRIES = 10;

    /**
     * Record a round finish. Adds entries for all ranked players.
     * @param {string}     mapKey   - e.g. 'map1'
     * @param {object[]}   players
     * @param {object}     scoreManager
     */
    static record(mapKey, players, scoreManager) {
        const board = this.get(mapKey);
        for (const player of players) {
            const score = scoreManager.getScore(player);
            if (!score?.finished || !score.finishTime) continue;
            board.push({
                name:  player.nickname || `Player ${player.playerNo + 1}`,
                time:  parseFloat(score.finishTime.toFixed(2)),
                rank:  score.rank,
                date:  new Date().toLocaleDateString(),
            });
        }
        // Sort by time ascending, keep top MAX_ENTRIES
        board.sort((a, b) => a.time - b.time);
        const trimmed = board.slice(0, this.MAX_ENTRIES);
        try {
            localStorage.setItem(this.KEY_PREFIX + mapKey, JSON.stringify(trimmed));
        } catch(e) {}
        return trimmed;
    }

    /**
     * Get leaderboard for a map.
     * @param {string} mapKey
     * @returns {{ name, time, date }[]}
     */
    static get(mapKey) {
        try {
            const raw = localStorage.getItem(this.KEY_PREFIX + mapKey);
            return raw ? JSON.parse(raw) : [];
        } catch(e) { return []; }
    }

    /** Clear leaderboard for a map. */
    static clear(mapKey) {
        try { localStorage.removeItem(this.KEY_PREFIX + mapKey); } catch(e) {}
    }
}
