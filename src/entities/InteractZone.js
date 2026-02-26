import { rectsOverlap } from "../utils/collision.js";

export class InteractZone {
  constructor(p, x, y, w, h, label) {
    this.p = p;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.label = label;
  }

  isPlayerInside(player) {
    const a = player.getAABB();
    return rectsOverlap(this.x, this.y, this.w, this.h, a.x, a.y, a.w, a.h);
  }

  display() {
    const p = this.p;
    p.noStroke();
    p.fill(120, 200, 120);
    p.rect(this.x, this.y, this.w, this.h, 6);

    p.fill(20);
    p.textSize(12);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(this.label, this.x + this.w / 2, this.y + this.h / 2);
  }
}
