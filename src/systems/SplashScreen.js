import { RectButton } from "../utilities/RectButton.js"
import { GameConfig } from '../config/gameConfig.js';

/**
 * @description splash screen display 
 * Handles rendering of the start menu UI
 * @class
 */

export class SplashScreen{
    /**
    * @description creates splash screen
    *
    * @param {p5} p - The p5 instance 
    * @param {string} stage - Current game stage
    */
    constructor(p) {
        this.button1 = new RectButton(p, 
                            GameConfig.BUTTON1_X, 
                            GameConfig.BUTTON1_Y, 
                            GameConfig.BUTTON1_W, 
                            GameConfig.BUTTON1_H, 
                            "option1");
        this.button2 = new RectButton(p, 
                            GameConfig.BUTTON2_X, 
                            GameConfig.BUTTON2_Y, 
                            GameConfig.BUTTON2_W, 
                            GameConfig.BUTTON2_H, 
                            "option2");
    }
    /**
    * @description renders splash screen 
    *
    * @param {p5} p - The p5 instance 
    */
    render(p){
        // placeholder title 
        p.textAlign(p.LEFT, p.BASELINE);
        p.textFont(GameConfig.FONT, GameConfig.TITLE_FONTSIZE);
        p.fill(GameConfig.TITLE_COLOUR.r, GameConfig.TITLE_COLOUR.g, GameConfig.TITLE_COLOUR.b); 
        p.text("Ultimate Chicken Horse", GameConfig.TITLE_X, GameConfig.TITLE_Y); 
        
        // placeholder "press space to start"
        if(p.frameCount % 120 < 80) {
            p.textFont(GameConfig.FONT, GameConfig.PRESS_FONTSIZE);
            p.fill(GameConfig.PRESS_COLOUR.r, GameConfig.PRESS_COLOUR.g, GameConfig.PRESS_COLOUR.b); 
            p.text("Press Space to Start", GameConfig.PRESS_X, GameConfig.PRESS_Y);
        } 
        
        p.cursor(p.ARROW); // default cursor

        // placeholder option buttons
        this.button1.drawButton(p);
        this.button2.drawButton(p);
    
        this.button1.updateCursor();
        this.button2.updateCursor();
    }
}






