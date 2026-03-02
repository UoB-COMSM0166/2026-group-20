import { Button } from "./Button.js";

export class RectButton extends Button {
    constructor(p, x, y, w, h, label) {
        super(p, x, y, w, h); 
        this.label = label;
        this.radius = 10; 
        this.defaultColour = {r: 100, g: 100, b: 225}; // blue background
        this.changedColour = {r: 0, g: 100, b: 225};   // purple background 
        this.textFont = "Monaco"; 
        this.textSize = 10;
        this.textColour = 250;
    }

    /**
    * @description draw button and display 
    * @param {p5} p - The p5 instance 
    * @param {number} mx 
    * @param {number} my 
    */
    drawButton(p, mx, my) {
        let currentY = this.getRenderY(mx, my);
        
        if (this.isHovered(mx, my)) {
            this.p.fill(this.defaultColour.r, this.defaultColour.g, this.defaultColour.b); 
        } 
        else {
            this.p.fill(this.changedColour.r, this.changedColour.g, this.changedColour.b);
        }
        p.rect(this.x, currentY, this.w, this.h, this.radius);

        // text inside the button 
        this.p.fill(this.textColour);
        this.p.textFont(this.textFont);
        this.p.textSize(this.textSize);
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(this.label, this.x + this.w / 2, currentY + this.h / 2);
    }

    updateCursor(mx, my) {
        super.updateCursor(mx, my);
    }
}