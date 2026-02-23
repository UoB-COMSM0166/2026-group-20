import { Button } from "./Button.js";
/**
 * @description creates an interavtive rectangular UI button 
 * the rectangular button is extended from the Button class 
 * @class
 */

export class RectButton extends Button{
    /**
    * @description creates a rectangular Button 
    *
    * @param {p5} p - The p5 instance 
    * @param {number} x - X position of the button
    * @param {number} y - Y position of the button
    * @param {number} w - Button width
    * @param {number} h - Button height
    * @param {string} label - text on the button 
    */
    constructor(p, x, y, w, h, label){
        super(p, x, y, w, h); 
        this.label=label;
        this.radius=10; 
        this.defaultColour={r:100, g:100, b:225}; // blue background
        this.changedColour={r:0, g:100, b:225}; // purple background 
        this.textFont="Monaco"; 
        this.textSize=10;
    }

    /**
    * @description draw button and display 
    */
    drawButton(p){
        let currentY = this.getRenderY();
        
        if (this.isHovered()){
            this.p.fill(this.defaultColour.r, this.defaultColour.g, this.defaultColour.b); 
        } 
        else{
            this.p.fill(this.changedColour.r, this.changedColour.g, this.changedColour.b);
        }
        p.rect(this.x, currentY, this.w, this.h, this.radius);

        // text inside the button 
        this.p.fill(250);
        this.p.textFont(this.textFont);
        this.p.textSize(this.textSize);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(this.label, this.x+this.w/2, currentY+this.h/2);
    }
    /**
    * @description mouse GUI to show the button is clickable (pointing hand)
    */
    updateCursor(){
        super.updateCursor();
    }
}



