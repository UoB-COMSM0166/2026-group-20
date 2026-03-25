import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { Scoreboard } from '../ui/Scoreboard.js';

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
        const { p, gameWidth, gameHeight } = this.ctx;
        this.scoreboard = new Scoreboard(p, gameWidth, gameHeight);
    }

    render() {
        this.scoreboard.render(this.ctx.scoreManager);
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this.goTo(GameStage.SHOP);
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        }
    }
}
