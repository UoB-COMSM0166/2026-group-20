export class GameOverScreen {
    constructor(p, gameWidth, gameHeight) {
        this.p = p;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
    }

    render(scoreManager, players) {
        const p = this.p;
        const gw = this.gameWidth;
        const gh = this.gameHeight;
        const standings = [...players]
            .map((player) => ({
                player,
                wallet: scoreManager.getWallet(player),
                roundRank: scoreManager.getScore(player)?.rank ?? 999,
            }))
            .sort(
                (a, b) =>
                    b.wallet - a.wallet ||
                    a.roundRank - b.roundRank ||
                    a.player.playerNo - b.player.playerNo,
            );

        const winner = standings[0]?.player ?? null;

        p.fill(0, 0, 0, 190);
        p.noStroke();
        p.rect(0, 0, gw, gh);

        const panelW = gw * 0.72;
        const panelH = gh * 0.7;
        const panelX = (gw - panelW) / 2;
        const panelY = (gh - panelH) / 2;

        p.fill(18, 22, 38, 240);
        p.stroke(90, 120, 190);
        p.strokeWeight(2);
        p.rect(panelX, panelY, panelW, panelH, 12);
        p.noStroke();

        p.fill(255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(15);
        p.text('FINAL RESULTS', gw / 2, panelY + 18);

        p.fill(170, 180, 210);
        p.textSize(6);
        p.text(`After ${scoreManager.maxRounds} rounds`, gw / 2, panelY + 42);

        if (winner) {
            p.fill(255, 215, 90);
            p.textSize(8);
            p.text(
                `${winner.nickname ?? `Player ${winner.playerNo + 1}`} wins!`,
                gw / 2,
                panelY + 64,
            );
        }

        const cols = {
            rank: panelX + 48,
            player: panelX + 156,
            wallet: panelX + 286,
            round: panelX + 396,
        };
        const tableTop = panelY + 112;

        p.fill(145, 155, 190);
        p.textSize(6);
        p.textAlign(p.CENTER, p.TOP);
        p.text('RANK', cols.rank, tableTop);
        p.text('PLAYER', cols.player, tableTop);
        p.text('GOLD', cols.wallet, tableTop);
        p.text('LAST ROUND', cols.round, tableTop);

        p.stroke(55, 70, 110);
        p.strokeWeight(1);
        p.line(panelX + 22, tableTop + 16, panelX + panelW - 22, tableTop + 16);
        p.noStroke();

        standings.forEach((entry, idx) => {
            const y = tableTop + 26 + idx * 34;
            const player = entry.player;
            const tint =
                player.playerNo === 0 ? [90, 170, 255] : [255, 200, 80];

            if (idx === 0) {
                p.fill(255, 215, 0, 24);
                p.rect(panelX + 16, y - 4, panelW - 32, 28, 8);
            }

            p.textAlign(p.CENTER, p.TOP);
            p.textSize(6.3);
            p.fill(idx === 0 ? [255, 215, 0] : [210, 214, 232]);
            p.text(
                idx === 0 ? '1ST' : idx === 1 ? '2ND' : `${idx + 1}TH`,
                cols.rank,
                y,
            );

            p.fill(...tint);
            p.text(
                player.nickname ?? `Player ${player.playerNo + 1}`,
                cols.player,
                y,
            );

            p.fill(110, 220, 180);
            p.text(String(entry.wallet), cols.wallet, y);

            p.fill(200, 206, 230);
            p.text(
                entry.roundRank === 999 ? '—' : `#${entry.roundRank}`,
                cols.round,
                y,
            );
        });

        p.fill(130, 140, 170);
        p.textSize(6);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.text('ENTER or ESC → Main Menu', gw / 2, panelY + panelH - 14);
    }
}
