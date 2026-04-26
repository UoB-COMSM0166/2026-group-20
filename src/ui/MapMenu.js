import { RectButton } from '../utils/RectButton.js';
import { RoundButton } from '../utils/RoundButton.js';
import { GameConfig } from '../config/GameConfig.js';

/**
 * @description Map menu where the players can choose different maps
 * @class
 */

export class MapMenu {
    /**
     * @description creates splash screen
     * @param {p5} p - The p5 instance
     * @param {string} stage - Current game stage
     * @param gameWidth
     * @param gameHeight
     */
    constructor(p, gameWidth, gameHeight) {
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
        const centerX = gameWidth / 2;
        const buttonGap = 40;
        const totalButtonsWidth =
            GameConfig.MAP_BUTTON1_W + GameConfig.MAP_BUTTON2_W + buttonGap;
        const buttonsLeft = centerX - totalButtonsWidth / 2;
        const buttonY = Math.round(gameHeight * 0.66);

        this.buttonMap1 = new RectButton(
            p,
            buttonsLeft,
            buttonY,
            GameConfig.MAP_BUTTON1_W,
            GameConfig.MAP_BUTTON1_H,
            'Map 1',
        );
        this.buttonMap2 = new RectButton(
            p,
            buttonsLeft + GameConfig.MAP_BUTTON1_W + buttonGap,
            buttonY,
            GameConfig.MAP_BUTTON2_W,
            GameConfig.MAP_BUTTON2_H,
            'Map 2',
        );
        this.buttonReturn = new RoundButton(
            p,
            56,
            56,
            GameConfig.MAP_RETURN_R,
            '↩',
        );
    }
    /**
     * @description renders menu page
     * @param {p5} p - The p5 instance
     * @param {number} mx - Mouse X position
     * @param {number} my - Mouse Y position
     */
    render(p, mx, my) {
        const centerX = this.gameWidth / 2;
        const titleY = Math.round(this.gameHeight * 0.3);

        // placeholder title
        p.textAlign(p.CENTER, p.TOP);
        p.textFont(GameConfig.FONT, 14);
        p.fill(
            GameConfig.MAP_TITLE_COLOUR.r,
            GameConfig.MAP_TITLE_COLOUR.g,
            GameConfig.MAP_TITLE_COLOUR.b,
        );
        p.text('Map Select', centerX, titleY);

        p.fill(140, 150, 190);
        p.textFont(GameConfig.FONT, 5);
        p.text('Choose a map to preview', centerX, titleY + 34);

        p.cursor(p.ARROW); // default cursor

        this.buttonMap1.drawButton(p, mx, my);
        this.buttonMap2.drawButton(p, mx, my);
        this.buttonReturn.drawButton(p, mx, my);

        this.buttonMap1.updateCursor(mx, my);
        this.buttonMap2.updateCursor(mx, my);
        this.buttonReturn.updateCursor(mx, my);
    }
}
