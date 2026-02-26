export class Player {
  constructor(p, x, y, controls, c, name) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 40;
    this.h = 40;

    this.vx = 0;
    this.vy = 0;

    this.speed = 4.2;
    this.jumpForce = -12.5;

    this.controls = controls;
    this.col = c;
    this.name = name;

    this.onGround = false;
  }

  update(groundY, gravity) {
    const p = this.p;

    let move = 0;
    if (p.keyIsDown(this.controls.left))  move -= 1;
    if (p.keyIsDown(this.controls.right)) move += 1;
    this.vx = move * this.speed;

    if (p.keyIsDown(this.controls.down) && !this.onGround) {
      this.vy += 0.4;
    }

    if (p.keyIsDown(this.controls.up) && this.onGround) {
      this.vy = this.jumpForce;
      this.onGround = false;
    }

    this.vy += gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.y + this.h >= groundY) {
      this.y = groundY - this.h;
      this.vy = 0;
      this.onGround = true;
    }

    this.x = p.constrain(this.x, 0, p.width - this.w);
  }

  display() {
    const p = this.p;
    p.noStroke();
    p.fill(this.col);
    p.rect(this.x, this.y, this.w, this.h, 10);

    p.fill(240);
    p.textSize(12);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.text(this.name, this.x + this.w / 2, this.y - 6);
  }

  getAABB() {
    return { x: this.x, y: this.y, w: this.w, h: this.h };
  }
}
