import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { GameOverScreen } from '../ui/GameOverScreen.js';
import { LeaderboardManager } from '../systems/LeaderboardManager.js';

/**
 * ResultsState — end-of-round scoreboard screen.
 *
 * Displayed automatically after RunState ends.
 * Shows the full Scoreboard (rank, time, deaths, coins, wallet).
 *
 * Controls:
 *   ENTER — proceed to shop for the next round
 *   ESC   — return to map menu
 *
 * Transitions:
 *   ENTER → ShopState
 *   ESC   → MapMenuState
 */
export class ResultsState extends State {
    enter() {
        const { p, gameWidth, gameHeight, players, scoreManager, mapKey } = this.ctx;
        this._isFinalRound = scoreManager.currentRound >= scoreManager.maxRounds;
        this.scoreboard = this._isFinalRound
            ? new GameOverScreen(p, gameWidth, gameHeight)
            : new Scoreboard(p, gameWidth, gameHeight);

        // Record this round to the leaderboard
        const key = mapKey ?? 'map1';
        LeaderboardManager.record(key, players, scoreManager);
        this._leaderboard = LeaderboardManager.get(key);
        this._mapKey  = key;
        this._showLB  = false; // toggle with L key or button
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        this.scoreboard.render(this.ctx.scoreManager, this.ctx.players);

        // Leaderboard toggle button (top-right)
        if (this._isFinalRound) return;

        const btnW = 120, btnH = 28;
        const btnX = gameWidth - btnW - 10;
        const btnY = 10;
        const hov  = mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH;
        p.noStroke();
        p.fill(hov ? [50, 80, 140] : [35, 55, 105]);
        p.rect(btnX, btnY, btnW, btnH, 5);
        p.fill(180, 200, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(6.6);
        p.text(this._showLB ? 'Close Board' : 'Leaderboard', btnX + btnW / 2, btnY + btnH / 2);

        if (!this._showLB) return;

        // Leaderboard panel
        const panW = 360, panH = 250;
        const panX = gameWidth / 2 - panW / 2;
        const panY = gameHeight / 2 - panH / 2;

        p.fill(14, 18, 32, 240);
        p.noStroke();
        p.rect(panX, panY, panW, panH, 10);
        p.stroke(60, 90, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(panX, panY, panW, panH, 10);
        p.noStroke();

        // Title
        p.fill(255, 215, 0);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text(`${this._mapKey?.toUpperCase() ?? 'MAP'} LEADERBOARD`, gameWidth / 2, panY + 14);

        p.stroke(45, 60, 110);
        p.strokeWeight(1);
        p.line(panX + 20, panY + 40, panX + panW - 20, panY + 40);
        p.noStroke();

        // Column headers
        p.fill(120, 130, 170);
        p.textSize(5.8);
        p.textAlign(p.LEFT, p.TOP);
        p.text('RANK', panX + 18, panY + 46);
        p.text('PLAYER', panX + 58, panY + 46);
        p.text('TIME', panX + 198, panY + 46);
        p.text('DATE', panX + 255, panY + 46);

        // Entries
        const entries = this._leaderboard;
        if (entries.length === 0) {
            p.fill(80, 85, 120);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(7.5);
            p.text('No records yet', gameWidth / 2, panY + 140);
        } else {
            entries.forEach((entry, i) => {
                const ey = panY + 62 + i * 18;
                p.fill(i === 0 ? [255, 215, 0] : i === 1 ? [192, 192, 200] : i === 2 ? [205, 127, 50] : [160, 165, 190]);
                p.textSize(6.6);
                p.textAlign(p.LEFT, p.TOP);
                const medal = i === 0 ? '1ST' : i === 1 ? '2ND' : i === 2 ? '3RD' : `${i + 1}.`;
                p.text(medal,           panX + 14, ey);
                p.text(this._fitText(entry.name, 13), panX + 58, ey);
                p.fill(180, 230, 180);
                p.text(`${entry.time}s`, panX + 198, ey);
                p.fill(120, 130, 160);
                p.text(this._fitText(entry.date, 10), panX + 255, ey);
            });
        }
    }

    mousePressed(mx, my) {
        if (this._isFinalRound) return;

        const { gameWidth } = this.ctx;
        const btnW = 130, btnH = 28;
        const btnX = gameWidth - btnW - 10;
        if (mx >= btnX && mx <= btnX + btnW && my >= 10 && my <= 10 + btnH) {
            this._showLB = !this._showLB;
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.key === 'l' || p.key === 'L') {
            if (this._isFinalRound) return;
            this._showLB = !this._showLB;
        } else if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this.goTo(this._isFinalRound ? GameStage.MENU : GameStage.SHOP);
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MENU);
        }
    }

    _fitText(text, maxChars) {
        const safe = String(text ?? '');
        return safe.length <= maxChars ? safe : `${safe.slice(0, maxChars - 1)}…`;
    }
}
