/**
 * HUD (Heads-Up Display) — renders in-game overlays:
 * timer, player scores, lives, and status indicators.
 *
 * TODO: implement from feature/HUDOverlay
 * Currently the timer is drawn inline in sketch.js — move it here.
 */
export class HUD {
    /**
     * @param {p5} p
     * @param {number} gameWidth
     * @param {number} gameHeight
     * @param {TimeManager} timeManager
     * @param {ScoreManager} scoreManager
     */
    constructor(p, gameWidth, gameHeight, timeManager, scoreManager) {
        this.p = p;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.timeManager = timeManager;
        this.scoreManager = scoreManager;
    }

    /**
     * Draw all HUD elements. Call at the end of each game-loop frame.
     * @param {Player[]} players
     */
    render(players) {
        this._drawTimer();
        this._drawScores(players);
        this._drawControls();
    }

    _drawTimer() {
        const p = this.p;
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(this.timeManager.timeLeft)}s`, this.gameWidth / 2, 20);
    }

    _drawScores(players) {
        // TODO: render per-player scores from ScoreManager
    }

    _drawControls() {
        const p = this.p;
        p.fill(255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text('P1: A/D + W   P2: ←/→ + ↑   (Press ESC to Return)', 10, this.gameHeight - 10);
    }
}
