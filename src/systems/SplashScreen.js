import { RectButton } from "../utilities/RectButton.js"
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
    constructor(p, stage) {
        this.stage=stage;
        this.button1 = new RectButton(p, 110, 300, 60, 25, "option1");
        this.button2 = new RectButton(p, 210, 300, 60, 25, "option2");

    }
     /**
    * @description renders start menu UI
    *
    * @param {p5} p - The p5 instance 
    */
    render(p){
        // placeholder title 
        p.textAlign(p.LEFT, p.BASELINE);
        p.textFont('Monaco', 20);
        p.fill(143,57,133); // purple
        p.text("Ultimate Chicken Horse", p.width/6, p.height/3); 
        
        // placeholder "press space to start"
        if(p.frameCount % 120 < 80) {
            p.textFont('Monaco', 15);
            p.fill(0, 0, 225); 
            p.text("Press Space to Start", 100, 250);
        } 
        
        p.cursor(p.ARROW); // default cursor

        // placeholder option buttons
        this.button1.drawButton(p);
        this.button2.drawButton(p);

        this.button1.updateCursor();
        this.button2.updateCursor();
    }
}






