/**
 * @description creates an interavtive UI button 
 * @class
 */

export class Button {
    /**
    * @description creates a Button 
    *
    * @param {p5} p - The p5 instance 
    * @param {number} x - X position of the button
    * @param {number} y - Y position of the button
    * @param {number} w - Button width
    * @param {number} h - Button height
    */
    constructor(p, x, y, w, h) {
        this.p=p; 
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h; 
        this.offsetY=-2; // animation when mouse is hovered 
    }
   /**
   * @description check if the mouse is hovered over the button 
   * @returns {boolean} true/false if the mouse is hovered over the button 
   */
    isHovered(){
        return this.p.mouseX > this.x && this.p.mouseX < this.x+this.w 
        && this.p.mouseY > this.y && this.p.mouseY < this.y+this.h;
    }
   /**
   * @description computes the Y position used for button animation 
   * when the mouse is hovered over the button 
   * @returns {number} the adjusted Y for drawing 
   */
    getRenderY(){
        if (this.isHovered()){
            return this.y+this.offsetY;
        }
        return this.y;
    }
    /**
    * @description mouse GUI to show the button is clickable (pointing hand)
    */
    updateCursor(){
        if (this.isHovered()){
            this.p.cursor(this.p.HAND);
        }
    }
}