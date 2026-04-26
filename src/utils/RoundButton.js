import { Button } from './Button.js';
import { GameConfig } from '../config/GameConfig.js';

export class RoundButton extends Button {
    constructor(p, x, y, diameter, label) {
        super(p, x, y, diameter, diameter);
        this.diameter = diameter;
        this.defaultColour = { r: 100, g: 100, b: 225 };
        this.changedColour = { r: 0, g: 100, b: 225 };
        this.label = label;
        this.textSize = 10;
        this.textColour = 250;
    }

    drawButton(p, mx, my) {
        let currentY = this.getRenderY(mx, my);

        if (this.isHovered(mx, my)) {
            this.p.fill(
                this.defaultColour.r,
                this.defaultColour.g,
                this.defaultColour.b,
            );
        } else {
            this.p.fill(
                this.changedColour.r,
                this.changedColour.g,
                this.changedColour.b,
            );
        }

        p.circle(this.x, currentY, this.diameter);

        this.p.fill(this.textColour);
        this.p.textFont(GameConfig.FONT);
        this.p.textSize(
            Math.max(
                6,
                Math.min(this.textSize, Math.floor(this.diameter * 0.34)),
            ),
        );
        this.p.textAlign(this.p.CENTER, this.p.CENTER);
        this.p.text(this.label, this.x, currentY + 0.5);
    }

    isHovered(mx, my) {
        return this.p.dist(mx, my, this.x, this.y) < this.diameter / 2;
    }

    updateCursor(mx, my) {
        super.updateCursor(mx, my);
    }
}
