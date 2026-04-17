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
    constructor(ctx, goTo, bgImage, font) {
        super(ctx, goTo);
        this.bgImage = bgImage;
        this.font = font;
    }

    enter() {
        const { p } = this.ctx;
        this.splashScreen = new SplashScreen(p, this.font);
    }

    render() {
        // Destructure gameWidth and gameHeight from this.ctx
        // const { p, gameWidth, gameHeight } = this.ctx;
        const { p } = this.ctx;
        // if (this.bgImage) {
        //     // Draw the image to fill the internal game resolution
        //     p.image(this.bgImage, 0, 0, gameWidth, gameHeight);
        // } else {
        //     p.background(30);
        // }

        this.splashScreen.render(p);
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.key === ' ') {
            this.goTo(GameStage.CHAR_SELECT);
        }
    }
}
