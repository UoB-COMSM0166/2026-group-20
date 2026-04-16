import { State } from './State.js';
import { SplashScreen } from '../ui/SplashScreen.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';

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
            this.ctx.displayMode ?? 'fit',
            this.ctx.fontMode ?? 'press_start_2p',
        );
    }

    mousePressed(mx, my) {
        if (this._showSettings) {
            const action = this.splashScreen.settingsActionAt(mx, my);
            if (action === 'close') this._showSettings = false;
            else if (action === 'fit') this.ctx.displayMode = 'fit';
            else if (action === 'stretch') this.ctx.displayMode = 'stretch';
            else if (action === 'font_press_start_2p') {
                this.ctx.fontMode = 'press_start_2p';
                GameConfig.FONT = 'Press Start 2P';
                document.body.style.fontFamily = "'Press Start 2P', monospace";
            } else if (action === 'font_panas_chill') {
                this.ctx.fontMode = 'panas_chill';
                GameConfig.FONT = 'PanasChill';
                document.body.style.fontFamily = "'PanasChill', monospace";
            }
            return;
        }

        const action = this.splashScreen.menuActionAt(mx, my);
        if (action === 'play') {
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
