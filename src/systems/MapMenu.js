import { RectButton } from "../utilities/RectButton.js"
import { RoundButton } from "../utilities/RoundButton.js"

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
        this.buttonMap1 = new RectButton(p, 100, 150, 60, 25, "Map 1");
        this.buttonMap2 = new RectButton(p, 230, 150, 60, 25, "Map 2");
        this.buttonReturn = new RoundButton(p, 35, 40, 30, "↩");

    }
    /**
    * @description renders menu page 
    *
    * @param {p5} p - The p5 instance 
    */
    render(p){
        // placeholder title 
        p.textAlign(p.CENTER, p.BASELINE);
        p.textFont('Monaco', 20);
        p.fill(143,57,133); // purple
        p.text("Maps", p.width/2, p.height/5); 
        
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