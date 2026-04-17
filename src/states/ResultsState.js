import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { Scoreboard } from '../ui/Scoreboard.js';
import { GameOverScreen } from '../ui/GameOverScreen.js';

/**
 * ResultsState — end-of-round scoreboard screen.
 *
 * Displayed automatically after RunState ends.
 * Shows the full Scoreboard (rank, time, deaths, coins, wallet).
 * If 5 rounds are reached, shows the final GameOverScreen.
 *
 * Controls:
 *   ENTER — proceed to shop for the next round (or return to menu if Game Over)
 *   ESC   — return to map menu
 *
 * Transitions:
 *   ENTER (round < 5) → ShopState
 *   ENTER (round >= 5) → MapMenuState
 *   ESC   → MapMenuState
 */
export class ResultsState extends State {
    enter() {
        const { p, gameWidth, gameHeight, scoreManager } = this.ctx;
        if (scoreManager.currentRound >= 5) {
            this.screen = new GameOverScreen(p, gameWidth, gameHeight);
        } else {
            this.screen = new Scoreboard(p, gameWidth, gameHeight);
        }
    }

    render() {
        this.screen.render(this.ctx.scoreManager);
    }

    keyPressed() {
        const { p, scoreManager } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            if (scoreManager.currentRound >= 5) {
                this.goTo(GameStage.MAPMENU);
            } else {
                this.goTo(GameStage.SHOP);
            }
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        }
    }
}
