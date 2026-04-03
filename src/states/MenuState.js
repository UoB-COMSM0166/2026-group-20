import { State } from './State.js';
import { SplashScreen } from '../ui/SplashScreen.js';
import { GameStage } from '../config/GameStage.js';

/**
 * MenuState — the main splash / title screen.
 *
 * Transitions:
 *   SPACE → MapMenuState
 */
export class MenuState extends State {
    enter() {
        const { p, gameWidth, gameHeight } = this.ctx;
        this.splashScreen = new SplashScreen(p, gameWidth, gameHeight);
    }

    render(mx, my) {
        const { p } = this.ctx;
        p.background(30);
        this.splashScreen.render(p, mx, my);
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.key === ' ') {
            this.goTo(GameStage.CHAR_SELECT);
        }
    }
}
