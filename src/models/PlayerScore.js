/**
 * PlayerScore — immutable-ish data record for one player's round statistics.
 *
 * Fields:
 *   playerNo    {number}       — player index (0-based)
 *   finished    {boolean}      — true if the player reached the finish tile
 *   finishTime  {number|null}  — seconds elapsed when finish was reached; null if failed
 *   deaths      {number}       — total death count this round
 *   coins       {number}       — coins collected this round (before banking)
 *   wallet      {number}       — persistent wallet total after round rewards applied
 *   rank        {number|null}  — final leaderboard position (1-based); set by ScoreManager
 */
export class PlayerScore {
    /**
     * @param {number} playerNo
     */
    constructor(playerNo) {
        this.playerNo   = playerNo;
        this.finished   = false;
        this.finishTime = null; // seconds elapsed at finish
        this.deaths     = 0;
        this.coins      = 0;   // snapshot of round coins at end-of-round
        this.wallet     = 0;   // snapshot of wallet after rewards applied
        this.rank       = null;
    }

    /**
     * Returns a formatted finish-time string, e.g. "1:23.4" or "—" if failed.
     * @returns {string}
     */
    get finishTimeFormatted() {
        if (this.finishTime === null) return '—';
        const mins = Math.floor(this.finishTime / 60);
        const secs = (this.finishTime % 60).toFixed(1).padStart(4, '0');
        return mins > 0 ? `${mins}:${secs}` : `${secs}s`;
    }

    /**
     * Returns "1st", "2nd", "3rd", "4th", or "—" if no rank assigned.
     * @returns {string}
     */
    get rankFormatted() {
        if (this.rank === null) return '—';
        const suffixes = ['st', 'nd', 'rd'];
        const suffix = suffixes[this.rank - 1] ?? 'th';
        return `${this.rank}${suffix}`;
    }
}
