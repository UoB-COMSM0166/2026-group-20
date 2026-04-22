import { State } from './State.js';
import { SplashScreen } from '../ui/SplashScreen.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { AIMapGenerator } from '../systems/AIMapGenerator.js';

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
        this._apiKeyFocused = false;
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
            this.ctx.aiMapFlag ?? 1,
            this.ctx.apiKey ?? '',
            this._apiKeyFocused
        );
    }

    mousePressed(mx, my) {
        if (this._showSettings) {
            const action = this.splashScreen.settingsActionAt(mx, my);
            if (action === 'close') {
                this._showSettings = false;
                this._apiKeyFocused = false;
            }
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
            } else if (action === 'ai_on') {
                const hasApiKey = this.ctx.apiKey && this.ctx.apiKey.trim().length > 0;
                if (hasApiKey) {
                    this.ctx.aiMapFlag = 0;
                    this.ctx.mapManager.aiMapFlag = 0;
                    this.ctx.mapManager.preloadNextAIMap();
                }
            } else if (action === 'ai_off') {
                this.ctx.aiMapFlag = 1;
                this.ctx.mapManager.aiMapFlag = 1;
            } else if (action === 'focus_api_key') {
                this._apiKeyFocused = true;
            } else {
                this._apiKeyFocused = false;
            }
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
        if (this._showSettings) {
            if (p.keyCode === p.ESCAPE) {
                this._showSettings = false;
                this._apiKeyFocused = false;
                return;
            }
            if (this._apiKeyFocused) {
                if (p.keyCode === p.ENTER || p.keyCode === 13) {
                    this._apiKeyFocused = false;
                    // Update MapManager with the new API Key
                    if (this.ctx.apiKey) {
                        this.ctx.mapManager.aiGenerator = new AIMapGenerator(this.ctx.apiKey);
                    }
                } else if (p.keyCode === p.BACKSPACE) {
                    this.ctx.apiKey = this.ctx.apiKey.slice(0, -1);
                    if (this.ctx.apiKey.trim().length === 0) {
                        this.ctx.aiMapFlag = 1;
                        this.ctx.mapManager.aiMapFlag = 1;
                    }
                } else if (p.key && p.key.length === 1) {
                    this.ctx.apiKey += p.key;
                }
                return;
            }
        }
        if (p.key === ' ') {
            this.goTo(GameStage.CHAR_SELECT);
        }
    }
}
