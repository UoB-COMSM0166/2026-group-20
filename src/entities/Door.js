import { rectsOverlap } from "../utils/collision.js";

export class Door {
  constructor(p, x, y, w, h) {
    this.p = p;
    this.x = x; this.y = y; this.w = w; this.h = h;
    this.isOpen = false;
  }

  display() {
    const p = this.p;
    p.noStroke();
    if (this.isOpen) {
      p.fill(120, 120, 120, 80);
      p.rect(this.x, this.y, this.w, this.h, 8);
      p.fill(240);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("OPEN", this.x + this.w / 2, this.y + 14);
    } else {
      p.fill(220, 170, 70);
      p.rect(this.x, this.y, this.w, this.h, 8);
      p.fill(30);
      p.textSize(12);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("CLOSED", this.x + this.w / 2, this.y + 14);
    }
  }

  collideWith(player) {
    if (this.isOpen) return;

    const a = player.getAABB();
    if (!rectsOverlap(this.x, this.y, this.w, this.h, a.x, a.y, a.w, a.h)) return;

    const prevX = player.x - player.vx;
    if (prevX + player.w <= this.x) {
      player.x = this.x - player.w;
    } else if (prevX >= this.x + this.w) {
      player.x = this.x + this.w;
    } else {
      if (player.vx >= 0) player.x = this.x - player.w;
      else player.x = this.x + this.w;
    }
  }
}
