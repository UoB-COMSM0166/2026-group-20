import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';

/**
 * Map2State — placeholder for Map 2.
 *
 * Transitions:
 *   ESC → MapMenuState
 */
export class Map2State extends State {
    render() {
        const { p, gameWidth, gameHeight } = this.ctx;

        p.background(50);
        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(24);
        p.text('Map 2 is coming soon...', gameWidth / 2, gameHeight / 2);
        p.textSize(14);
        p.text('Press ESC to return to Map Menu', gameWidth / 2, gameHeight / 2 + 40);
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.MAPMENU);
        }
    }
}
