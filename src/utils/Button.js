/**
 * @description creates an interactive UI button 
 * @class
 */
export class Button {
    constructor(p, x, y, w, h) {
        this.p = p; 
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h; 
        this.offsetY = -2; // animation when mouse is hovered 
    }

   /**
   * @description check if the mouse is hovered over the button 
   * @param {number} mx 
   * @param {number} my 
   * @returns {boolean} true/false if the mouse is hovered over the button 
   */
    isHovered(mx, my) {
        return mx > this.x && mx < this.x + this.w 
            && my > this.y && my < this.y + this.h;
    }

   /**
   * @description computes the Y position used for button animation 
   */
    getRenderY(mx, my) {
        if (this.isHovered(mx, my)) {
            return this.y + this.offsetY;
        }
        return this.y;
    }

    /**
    * @description mouse GUI to show the button is clickable (pointing hand)
    */
    updateCursor(mx, my) {
        if (this.isHovered(mx, my)) {
            this.p.cursor(this.p.HAND);
        }
    }
}