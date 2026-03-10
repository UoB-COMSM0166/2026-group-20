/**
 * Scoreboard — end-of-round overlay showing full player stats and rankings.
 *
 * Displayed when timeManager.isGameOver becomes true.
 * Shows a table with: Rank | Player | Status | Time | Deaths | Coins | Wallet
 *
 * Ranking order (from ScoreManager.getRankedScores):
 *   finished players (by finish time asc) → failed players (by coins desc)
 */
export class Scoreboard {
    /**
     * @param {p5}     p
     * @param {number} gameWidth
     * @param {number} gameHeight
     */
    constructor(p, gameWidth, gameHeight) {
        this.p          = p;
        this.gameWidth  = gameWidth;
        this.gameHeight = gameHeight;

        // Colours per player index
        this.playerColours = [
            { r: 90,  g: 170, b: 255 }, // P1 — blue
            { r: 255, g: 200, b: 80  }, // P2 — orange
            { r: 100, g: 220, b: 120 }, // P3 — green
            { r: 255, g: 100, b: 120 }, // P4 — red
        ];
    }

    /**
     * Render the full scoreboard overlay.
     * Call every frame while isGameOver is true.
     *
     * @param {ScoreManager} scoreManager
     */
    render(scoreManager) {
        const p  = this.p;
        const gw = this.gameWidth;
        const gh = this.gameHeight;

        // ── Background overlay ──────────────────────────────────────────────
        p.fill(0, 0, 0, 185);
        p.noStroke();
        p.rect(0, 0, gw, gh);

        // ── Panel ───────────────────────────────────────────────────────────
        const panelW = gw * 0.72;
        const panelH = gh * 0.72;
        const panelX = (gw - panelW) / 2;
        const panelY = (gh - panelH) / 2;

        p.fill(20, 20, 35, 230);
        p.stroke(80, 80, 120);
        p.strokeWeight(2);
        p.rect(panelX, panelY, panelW, panelH, 12);
        p.noStroke();

        // ── Title ────────────────────────────────────────────────────────────
        p.fill(255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(32);
        p.textStyle(p.BOLD);
        p.text('ROUND OVER', gw / 2, panelY + 18);
        p.textStyle(p.NORMAL);

        // ── Column headers ───────────────────────────────────────────────────
        const cols = this._colPositions(panelX, panelW);
        const headerY = panelY + 68;

        p.fill(160, 160, 200);
        p.textSize(13);
        p.textAlign(p.CENTER, p.TOP);

        p.text('RANK',    cols.rank,   headerY);
        p.text('PLAYER',  cols.player, headerY);
        p.text('STATUS',  cols.status, headerY);
        p.text('TIME',    cols.time,   headerY);
        p.text('DEATHS',  cols.deaths, headerY);
        p.text('COINS',   cols.coins,  headerY);
        p.text('WALLET',  cols.wallet, headerY);

        // Divider
        p.stroke(60, 60, 90);
        p.strokeWeight(1);
        p.line(panelX + 16, headerY + 22, panelX + panelW - 16, headerY + 22);
        p.noStroke();

        // ── Rows ─────────────────────────────────────────────────────────────
        const ranked = scoreManager.getRankedScores();
        const rowH   = 38;
        const firstRowY = headerY + 30;

        ranked.forEach((score, i) => {
            const rowY  = firstRowY + i * rowH;
            const col   = this.playerColours[score.playerNo] ?? { r: 200, g: 200, b: 200 };
            const isTop = i === 0;

            // Highlight top row
            if (isTop && score.finished) {
                p.fill(255, 215, 0, 25);
                p.rect(panelX + 10, rowY - 4, panelW - 20, rowH - 4, 6);
            }

            p.textSize(15);
            p.textAlign(p.CENTER, p.TOP);

            // Rank medal / number
            p.fill(255, 215, 0);
            p.textSize(isTop ? 20 : 15);
            const medal = ['🥇', '🥈', '🥉'][i] ?? `#${score.rank}`;
            p.text(medal, cols.rank, rowY);
            p.textSize(15);

            // Player name (coloured)
            p.fill(col.r, col.g, col.b);
            p.text(`P${score.playerNo + 1}`, cols.player, rowY + 2);

            // Status badge
            if (score.finished) {
                p.fill(100, 220, 100);
                p.text('✓ Finished', cols.status, rowY + 2);
            } else {
                p.fill(220, 80, 80);
                p.text('✗ Failed', cols.status, rowY + 2);
            }

            // Time
            p.fill(200, 200, 220);
            p.text(score.finishTimeFormatted, cols.time, rowY + 2);

            // Deaths
            p.fill(score.deaths > 0 ? p.color(255, 130, 130) : p.color(180, 180, 200));
            p.text(score.deaths, cols.deaths, rowY + 2);

            // Coins
            p.fill(255, 215, 0);
            p.text(`🪙 ${score.coins}`, cols.coins, rowY + 2);

            // Wallet
            p.fill(100, 220, 180);
            p.text(`💰 ${score.wallet}`, cols.wallet, rowY + 2);

            // Row divider
            if (i < ranked.length - 1) {
                p.stroke(40, 40, 60);
                p.strokeWeight(1);
                p.line(panelX + 16, rowY + rowH - 6, panelX + panelW - 16, rowY + rowH - 6);
                p.noStroke();
            }
        });

        // ── Footer hint ──────────────────────────────────────────────────────
        p.fill(120, 120, 150);
        p.textSize(13);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('Press ESC to return to Map Menu', gw / 2, panelY + panelH - 12);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Returns x-centre positions for each column given a panel origin and width.
     * @private
     */
    _colPositions(panelX, panelW) {
        // Seven columns — distribute across panel width with small margins
        const usable = panelW - 32;
        const segments = [0.07, 0.14, 0.22, 0.15, 0.14, 0.14, 0.14];
        let positions = [];
        let acc = 0;
        for (const frac of segments) {
            positions.push(panelX + 16 + (acc + frac / 2) * usable);
            acc += frac;
        }
        const [rank, player, status, time, deaths, coins, wallet] = positions;
        return { rank, player, status, time, deaths, coins, wallet };
    }
}
