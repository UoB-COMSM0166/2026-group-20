export class Button {
    constructor(p, x, y, w, h) {
        this.p=p; 
        this.x=x;
        this.y=y;
        this.w=w;
        this.h=h; 
        this.offsetY=-2; // animation when mouse is hovered 
    }

    isHovered(){
        return this.p.mouseX > this.x && this.p.mouseX < this.x+this.w 
        && this.p.mouseY > this.y && this.p.mouseY < this.y+this.h;
    }

    getRenderY(){
        if (this.isHovered()){
            return this.y+this.offsetY;
        }
        return this.y;
    }
    updateCursor(){
        if (this.isHovered()){
            this.p.cursor(this.p.HAND);
        }
    }
}