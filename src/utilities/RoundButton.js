import { Button } from "./Button.js";
/**
 * @description creates an interavtive round UI button 
 * extended from the Button class 
 * @class
 */

export class RoundButton extends Button{
    constructor(p, x, y, diameter, label){
        super(p, x, y, diameter, diameter);
        this.diameter = diameter;
        this.defaultColour={r:100, g:100, b:225}; // blue background
        this.changedColour={r:0, g:100, b:225}; // purple background 
        this.label=label; 
        this.textSize=25; 
        this.textColour=250;//white 
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
        
        p.circle(this.x, currentY, this.diameter);
        
        // text inside the button 
        this.p.fill(this.textColour);
        this.p.textSize(this.textSize);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(this.label, this.x, currentY);
    }
    /**
    * @description mouse GUI to show the button is clickable 
    */
    isHovered() {
        return this.p.dist(this.p.mouseX, this.p.mouseY, this.x, this.y)<this.diameter;
    }

    updateCursor(){
        super.updateCursor();
    }
}