import { RectButton } from "../utilities/RectButton.js"
import { RoundButton } from "../utilities/RoundButton.js"
import { GameConfig } from '../config/gameConfig.js';

/**
 * @description Map menu where the players can choose different maps
 * @class
 */

export class MapMenu{
    /**
    * @description creates splash screen
    *
    * @param {p5} p - The p5 instance 
    * @param {string} stage - Current game stage
    */
    constructor(p) {
        //this.stage=stage;
        this.buttonMap1 = new RectButton(p, 
                            GameConfig.MAP_BUTTON1_X, 
                            GameConfig.MAP_BUTTON1_Y, 
                            GameConfig.MAP_BUTTON1_W, 
                            GameConfig.MAP_BUTTON1_H, 
                            "Map 1");
        this.buttonMap2 = new RectButton(p, 
                            GameConfig.MAP_BUTTON2_X, 
                            GameConfig.MAP_BUTTON2_Y, 
                            GameConfig.MAP_BUTTON2_W, 
                            GameConfig.MAP_BUTTON2_H, 
                            "Map 2");
        this.buttonReturn = new RoundButton(p, 
                            GameConfig.MAP_RETURN_X, 
                            GameConfig.MAP_RETURN_Y, 
                            GameConfig.MAP_RETURN_R, 
                            "↩");

    }
    /**
    * @description renders menu page 
    *
    * @param {p5} p - The p5 instance 
    */
    render(p){
        // placeholder title 
        p.textAlign(p.CENTER, p.BASELINE);
        p.textFont(GameConfig.FONT, 20);
        p.fill(GameConfig.MAP_TITLE_COLOUR.r, GameConfig.MAP_TITLE_COLOUR.g, GameConfig.MAP_TITLE_COLOUR.b); 
        p.text("Maps", GameConfig.MAP_TITLE_X, GameConfig.MAP_TITLE_Y); 
        
        p.cursor(p.ARROW); // default cursor

        // placeholder buttons
        this.buttonMap1.drawButton(p);
        this.buttonMap2.drawButton(p);
        this.buttonReturn.drawButton(p);
    
        this.buttonMap1.updateCursor();
        this.buttonMap2.updateCursor();
        this.buttonReturn.updateCursor();
    }
}