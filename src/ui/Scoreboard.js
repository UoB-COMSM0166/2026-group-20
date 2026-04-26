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
        this.p = p;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;

        this.playerColours = [
            { r: 90, g: 170, b: 255 },
            { r: 255, g: 200, b: 80 },
            { r: 100, g: 220, b: 120 },
            { r: 255, g: 100, b: 120 },
        ];
    }

    /**
     * @param {ScoreManager} scoreManager
     */
    render(scoreManager) {
        const p = this.p;
        const gw = this.gameWidth;
        const gh = this.gameHeight;

        p.fill(0, 0, 0, 185);
        p.noStroke();
        p.rect(0, 0, gw, gh);

        const panelW = gw * 0.76;
        const panelH = gh * 0.7;
        const panelX = (gw - panelW) / 2;
        const panelY = (gh - panelH) / 2;

        p.fill(20, 20, 35, 230);
        p.stroke(80, 80, 120);
        p.strokeWeight(2);
        p.rect(panelX, panelY, panelW, panelH, 12);
        p.noStroke();

        p.fill(255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(14);
        p.textStyle(p.BOLD);
        p.text('ROUND OVER', gw / 2, panelY + 18);
        p.textStyle(p.NORMAL);

        const cols = this._colPositions(panelX, panelW);
        const headerY = panelY + 62;

        p.fill(160, 160, 200);
        p.textSize(6.4);
        p.textAlign(p.CENTER, p.TOP);
        p.text('RANK', cols.rank, headerY);
        p.text('PLAYER', cols.player, headerY);
        p.text('STATUS', cols.status, headerY);
        p.text('TIME', cols.time, headerY);
        p.text('DEATHS', cols.deaths, headerY);
        p.text('COINS', cols.coins, headerY);
        p.text('WALLET', cols.wallet, headerY);

        p.stroke(60, 60, 90);
        p.strokeWeight(1);
        p.line(panelX + 16, headerY + 18, panelX + panelW - 16, headerY + 18);
        p.noStroke();

        const ranked = scoreManager.getRankedScores();
        const rowH = 32;
        const firstRowY = headerY + 26;

        ranked.forEach((score, i) => {
            const rowY = firstRowY + i * rowH;
            const col = this.playerColours[score.playerNo] ?? {
                r: 200,
                g: 200,
                b: 200,
            };
            const isTop = i === 0 && score.finished;

            if (isTop) {
                p.fill(255, 215, 0, 22);
                p.rect(panelX + 10, rowY - 3, panelW - 20, rowH - 3, 6);
            }

            p.textAlign(p.CENTER, p.TOP);
            p.textSize(6.2);

            p.fill(255, 215, 0);
            p.text(this._rankLabel(i, score.rank), cols.rank, rowY + 1);

            p.fill(col.r, col.g, col.b);
            p.text(`P${score.playerNo + 1}`, cols.player, rowY + 1);

            p.fill(score.finished ? 100 : 220, score.finished ? 220 : 80, 100);
            p.text(
                score.finished ? 'FINISHED' : 'FAILED',
                cols.status,
                rowY + 1,
            );

            p.fill(200, 200, 220);
            p.text(
                this._fitText(score.finishTimeFormatted, 9),
                cols.time,
                rowY + 1,
            );

            p.fill(
                score.deaths > 0 ? 255 : 180,
                score.deaths > 0 ? 130 : 180,
                score.deaths > 0 ? 130 : 200,
            );
            p.text(String(score.deaths), cols.deaths, rowY + 1);

            p.fill(255, 215, 0);
            p.text(String(score.coins), cols.coins, rowY + 1);

            p.fill(100, 220, 180);
            p.text(String(score.wallet), cols.wallet, rowY + 1);

            if (i < ranked.length - 1) {
                p.stroke(40, 40, 60);
                p.strokeWeight(1);
                p.line(
                    panelX + 16,
                    rowY + rowH - 5,
                    panelX + panelW - 16,
                    rowY + rowH - 5,
                );
                p.noStroke();
            }
        });

        p.fill(120, 120, 150);
        p.textSize(6.2);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('ENTER → Shop  •  ESC → Menu', gw / 2, panelY + panelH - 12);
    }

    _rankLabel(index, rank) {
        if (index === 0) return '1ST';
        if (index === 1) return '2ND';
        if (index === 2) return '3RD';
        return `#${rank}`;
    }

    _fitText(text, maxChars) {
        const safe = String(text ?? '');
        return safe.length <= maxChars
            ? safe
            : `${safe.slice(0, maxChars - 1)}…`;
    }

    _colPositions(panelX, panelW) {
        const usable = panelW - 32;
        const segments = [0.08, 0.12, 0.22, 0.18, 0.14, 0.12, 0.14];
        const positions = [];
        let acc = 0;
        for (const frac of segments) {
            positions.push(panelX + 16 + (acc + frac / 2) * usable);
            acc += frac;
        }
        const [rank, player, status, time, deaths, coins, wallet] = positions;
        return { rank, player, status, time, deaths, coins, wallet };
    }
}
