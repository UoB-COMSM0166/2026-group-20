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
    constructor(ctx, goTo, bgImage = null, menuFont = null) {
        super(ctx, goTo);
        this.bgImage = bgImage;
        this.menuFont = menuFont;
    }

    enter() {
        const { p, gameWidth, gameHeight } = this.ctx;
        this._showSettings = false;
        this.splashScreen = new SplashScreen(
            p,
            gameWidth,
            gameHeight,
            this.bgImage,
            this.menuFont,
        );
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        if (this.bgImage) {
            p.image(this.bgImage, 0, 0, gameWidth, gameHeight);
        } else {
            p.background(30);
        }
        this.splashScreen.render(
            p,
            mx,
            my,
            this._showSettings,
            this.ctx.displayMode ?? 'stretch',
        );
    }

    mousePressed(mx, my) {
        if (this._showSettings) {
            const action = this.splashScreen.settingsActionAt(mx, my);
            if (action === 'close') this._showSettings = false;
            else if (action === 'fit') this.ctx.displayMode = 'fit';
            else if (action === 'stretch') this.ctx.displayMode = 'stretch';
            return;
        }

        const action = this.splashScreen.menuActionAt(mx, my);
        if (action === 'tutorial') {
            this.ctx.tutorialReturnStage = GameStage.MENU;
            this.goTo(GameStage.TUTORIAL);
        } else if (action === 'play') {
            this.goTo(GameStage.CHAR_SELECT);
        } else if (action === 'settings') {
            this._showSettings = true;
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (this._showSettings && p.keyCode === p.ESCAPE) {
            this._showSettings = false;
            return;
        }
        if (p.key === ' ') {
            this.goTo(GameStage.CHAR_SELECT);
        }
    }
}
