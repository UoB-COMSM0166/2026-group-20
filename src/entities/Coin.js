export class Coin {
  constructor(p, x, y, value = 10) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 20;
    this.h = 20;
    this.value = value;

    this.baseY = y;
    this.floatSpeed = 0.05;
    this.floatRange = 6;
    this.time = p.random(0, p.TWO_PI);

    this.collected = false;
  }

  update() {
    if (this.collected) return;
    this.time += this.floatSpeed;
    this.y = this.baseY + Math.sin(this.time) * this.floatRange;
  }

  display() {
    if (this.collected) return;
    const p = this.p;

    p.noStroke();
    p.fill(255, 220, 50, 80);
    p.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w + 10, this.h + 10);

    p.fill(255, 200, 0);
    p.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w, this.h);

    p.fill(255, 230, 100);
    p.ellipse(this.x + this.w / 2, this.y + this.h / 2, this.w * 0.5, this.h * 0.5);
  }

  getAABB() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
