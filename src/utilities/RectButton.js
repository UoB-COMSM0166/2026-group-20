import { Button } from "./Button.js";

export class RectButton extends Button{
    constructor(p, x, y, w, h, label){
        super(p, x, y, w, h); 
        this.label=label;
        this.radius=15; 
        this.defaultColour={r:100, g:100, b:225}; // blue background
        this.changedColour={r:0, g:100, b:225}; // purple background 
        this.textFont="Monaco"; 
        this.textSize=10;
    }
    // super(p, x, y, diameter, diameter); for a circular button 
    // override isHovered for a circular button
    drawButton(p){
        let currentY = this.getRenderY();
        
        if (this.isHovered()){
            this.p.fill(this.defaultColour.r, this.defaultColour.g, this.defaultColour.b); 
        } 
        else{
            this.p.fill(this.changedColour.r, this.changedColour.g, this.changedColour.b);
        }
        p.rect(this.x, currentY, this.w, this.h, 10);

        // text
        this.p.fill(250);
        this.p.textFont(this.textFont);
        this.p.textSize(this.textSize);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(this.label, this.x+this.w/2, currentY+this.h/2);
    }
    updateCursor(){
        super.updateCursor();
    }
}



