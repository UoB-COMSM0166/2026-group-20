import { RectButton } from '../utils/RectButton.js';
import { RoundButton } from '../utils/RoundButton.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * @description splash screen display
 * Handles rendering of the start menu UI
 * @class
 */

export class SplashScreen {
    /**
     * @description creates splash screen
     * @param {p5} p - The p5 instance
     * @param {string} stage - Current game stage
     */
    constructor(p, gameWidth, gameHeight, bgImage = null, menuFont = null) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        this.bgImage = bgImage;
        this.menuFont = menuFont;
        const centerX = gameWidth / 2;
        const buttonGap = 28;
        const totalButtonsWidth =
            GameConfig.BUTTON1_W + GameConfig.BUTTON2_W + buttonGap;
        const buttonsLeft = centerX - totalButtonsWidth / 2;
        const buttonY = Math.round(gameHeight * 0.67);

        this.button1 = new RectButton(
            p,
            buttonsLeft,
            buttonY,
            GameConfig.BUTTON1_W,
            GameConfig.BUTTON1_H,
            'PLAY',
        );
        this.button2 = new RectButton(
            p,
            buttonsLeft + GameConfig.BUTTON1_W + buttonGap,
            buttonY,
            GameConfig.BUTTON2_W,
            GameConfig.BUTTON2_H,
            'SETTINGS',
        );

        this.settingsPanel = {
            w: 380,
            h: 328,
            x: gameWidth / 2 - 190,
            y: gameHeight / 2 - 98,
        };
        this.displayFitButton = new RectButton(
            p,
            this.settingsPanel.x + 32,
            this.settingsPanel.y + 96,
            140,
            42,
            'CLASSIC FIT',
        );
        this.displayStretchButton = new RectButton(
            p,
            this.settingsPanel.x + this.settingsPanel.w - 32 - 140,
            this.settingsPanel.y + 96,
            140,
            42,
            'FULL WINDOW',
        );
        this.fontPressStartButton = new RectButton(
            p,
            this.settingsPanel.x + this.settingsPanel.w - 32 - 140,
            this.settingsPanel.y + 214,
            140,
            42,
            'PRESS START',
        );
        this.fontPanasChillButton = new RectButton(
            p,
            this.settingsPanel.x + 32,
            this.settingsPanel.y + 214,
            140,
            42,
            'PANAS CHILL',
        );
        this.closeButton = new RoundButton(
            p,
            this.settingsPanel.x + this.settingsPanel.w - 26,
            this.settingsPanel.y + 26,
            22,
            'X',
        );
    }
    /**
     * @description renders splash screen
     * @param {p5} p - The p5 instance
     * @param {number} mx - Mouse X position
     * @param {number} my - Mouse Y position
     */
    render(p, mx, my, showSettings = false, displayMode = 'fit', fontMode = 'press_start_2p') {
        const scale = Math.min(this.gameWidth / 1920, this.gameHeight / 1080);
        const titleBaseX = 500 * (this.gameWidth / 1920);
        const titleX =
            fontMode === 'press_start_2p'
                ? titleBaseX + 180 * (this.gameWidth / 1920)
                : titleBaseX;
        const titleY = 230 * (this.gameHeight / 1080);
        const promptX = 1050 * (this.gameWidth / 1920);
        const promptY = 650 * (this.gameHeight / 1080);
        const homepageFont =
            fontMode === 'panas_chill'
                ? (this.menuFont ?? 'PanasChill')
                : 'Press Start 2P';
        const titleFontSize =
            fontMode === 'press_start_2p'
                ? Math.max(34, (140 * scale) / 1.5)
                : Math.max(34, 140 * scale);
        const titleText =
            fontMode === 'press_start_2p'
                ? 'The\nIncredible\nChickenBunny'
                : 'The Incredible\n ChickenBunny';

        // Branch-faithful title treatment
        p.textAlign(p.CENTER, p.CENTER);
        p.stroke(0);
        p.strokeWeight(Math.max(4, 8 * scale));
        p.textFont(homepageFont, titleFontSize);
        p.fill(
            GameConfig.TITLE_COLOUR.r,
            GameConfig.TITLE_COLOUR.g,
            GameConfig.TITLE_COLOUR.b,
        );
        p.text(titleText, titleX, titleY);

        // Branch-faithful prompt, with updated hint about the new button
        if (p.frameCount % 120 < 80) {
            p.textFont(homepageFont, Math.max(16, 57 * scale));
            p.stroke(0);
            p.strokeWeight(Math.max(3, 8 * scale));
            p.fill(
                GameConfig.PRESS_COLOUR.r,
                GameConfig.PRESS_COLOUR.g,
                GameConfig.PRESS_COLOUR.b,
            );
            p.text(
                'Press Space to Start',
                promptX,
                promptY,
            );
        }
        p.noStroke();

        p.cursor(p.ARROW); // default cursor

        this.button1.defaultColour = { r: 255, g: 210, b: 80 };
        this.button1.changedColour = { r: 220, g: 170, b: 55 };
        this.button2.defaultColour = { r: 255, g: 160, b: 200 };
        this.button2.changedColour = { r: 220, g: 120, b: 175 };
        this.button1.textSize = 10 * this._menuTextScale(fontMode);
        this.button2.textSize = 10 * this._menuTextScale(fontMode);

        this.button1.drawButton(p, mx, my);
        this.button2.drawButton(p, mx, my);

        this.button1.updateCursor(mx, my);
        this.button2.updateCursor(mx, my);

        if (showSettings) {
            this._drawSettingsPanel(p, mx, my, displayMode, fontMode);
        }
    }

    menuActionAt(mx, my) {
        if (this.button1.isHovered(mx, my)) return 'play';
        if (this.button2.isHovered(mx, my)) return 'settings';
        return null;
    }

    settingsActionAt(mx, my) {
        if (this.closeButton.isHovered(mx, my)) return 'close';
        if (this.displayFitButton.isHovered(mx, my)) return 'fit';
        if (this.displayStretchButton.isHovered(mx, my)) return 'stretch';
        if (this.fontPressStartButton.isHovered(mx, my)) return 'font_press_start_2p';
        if (this.fontPanasChillButton.isHovered(mx, my)) return 'font_panas_chill';
        return null;
    }

    _drawSettingsPanel(p, mx, my, displayMode, fontMode) {
        const panel = this.settingsPanel;
        const uiTextScale = this._menuTextScale(fontMode);
        p.noStroke();
        p.fill(0, 0, 0, 170);
        p.rect(0, 0, this.gameWidth, this.gameHeight);

        p.fill(18, 26, 42, 245);
        p.rect(panel.x, panel.y, panel.w, panel.h, 12);
        p.stroke(86, 126, 190);
        p.strokeWeight(2);
        p.noFill();
        p.rect(panel.x, panel.y, panel.w, panel.h, 12);
        p.noStroke();

        p.fill(220, 232, 255);
        p.textAlign(p.CENTER, p.TOP);
        p.textFont(GameConfig.FONT, 9.2 * uiTextScale);
        p.text('SETTINGS', panel.x + panel.w / 2, panel.y + 16);

        p.fill(120, 144, 188);
        p.textFont(GameConfig.FONT, 5.8 * uiTextScale);
        p.text('DISPLAY MODE', panel.x + panel.w / 2, panel.y + 48);

        this.displayFitButton.textSize = 7.4 * uiTextScale;
        this.displayStretchButton.textSize = 7.4 * uiTextScale;
        this.displayFitButton.drawButton(p, mx, my);
        this.displayStretchButton.drawButton(p, mx, my);
        this.displayFitButton.updateCursor(mx, my);
        this.displayStretchButton.updateCursor(mx, my);

        const activeText =
            displayMode === 'stretch'
                ? 'Current: Full Window Stretch'
                : 'Current: Classic Fit';
        p.fill(180, 208, 255);
        p.textFont(GameConfig.FONT, 5.1 * uiTextScale);
        p.text(activeText, panel.x + panel.w / 2, panel.y + 160);

        p.fill(120, 144, 188);
        p.textFont(GameConfig.FONT, 4.9 * uiTextScale);
        p.text('Classic Fit keeps the old letterboxed pixel view.', panel.x + panel.w / 2, panel.y + 180);
        p.text('Full Window stretches like releases/v0.2.0.', panel.x + panel.w / 2, panel.y + 194);

        p.fill(120, 144, 188);
        p.textFont(GameConfig.FONT, 5.8 * uiTextScale);
        p.text('FONT', panel.x + panel.w / 2, panel.y + 264);

        this.fontPressStartButton.textSize = 6.8 * uiTextScale;
        this.fontPanasChillButton.textSize = 6.8 * uiTextScale;
        this.fontPressStartButton.drawButton(p, mx, my);
        this.fontPanasChillButton.drawButton(p, mx, my);
        this.fontPressStartButton.updateCursor(mx, my);
        this.fontPanasChillButton.updateCursor(mx, my);

        const activeFontText =
            fontMode === 'panas_chill'
                ? 'Current: PanasChill from releases/v0.2.0'
                : 'Current: Press Start 2P';
        p.fill(180, 208, 255);
        p.textFont(GameConfig.FONT, 5 * uiTextScale);
        p.text(activeFontText, panel.x + panel.w / 2, panel.y + 294);

        this.closeButton.textSize = 7.2 * uiTextScale;
        this.closeButton.drawButton(p, mx, my);
        this.closeButton.updateCursor(mx, my);
    }

    _menuTextScale(fontMode) {
        return fontMode === 'press_start_2p' ? 1.5 : 3;
    }
}
