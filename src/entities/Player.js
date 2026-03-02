export class Player {
  constructor(p, x, y, controls, c, name) {
    this.p = p;
    this.x = x;
    this.y = y;
    this.w = 50;
    this.h = 50;

    this.vx = 0;
    this.vy = 0;

    this.speed = 10;
    this.jumpForce = -12;
    this.gravity = 0.8;

    this.controls = controls;
    this.col = c;
    this.name = name;

    this.onGround = false;
    this.alive = true;
    this.score = 0;          // number of coins collected
    this.wallet = 0;         // gold value (each coin = 10g)

    this.spawnX = x;
    this.spawnY = y;
    this.deathTimer = 0;     // frames until respawn
    this.deathDuration = 90; // 1.5 seconds at 60fps
  }

  die() {
    if (!this.alive) return;
    this.alive = false;
    this.deathTimer = this.deathDuration;
    this.vx = 0;
    this.vy = 0;
  }

  respawn() {
    this.x = this.spawnX;
    this.y = this.spawnY;
    this.vx = 0;
    this.vy = 0;
    this.alive = true;
  }

  update(groundY) {
    const p = this.p;

    // Count down death timer
    if (!this.alive) {
      this.deathTimer--;
      if (this.deathTimer <= 0) this.respawn();
      return;
    }

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

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    // Fall off screen -> die
    if (this.y > groundY + 100) {
      this.die();
      return;
    }

    if (this.y + this.h >= groundY) {
      this.y = groundY - this.h;
      this.vy = 0;
      this.onGround = true;
    }

    this.x = p.constrain(this.x, 0, p.width - this.w);
  }

  collectCoin(value = 10) {
    this.score += 1;
    this.wallet += value;
  }

  display() {
    const p = this.p;

    if (!this.alive) {
      // Flash while dead
      if (p.frameCount % 10 < 5) {
        p.noStroke();
        p.fill(180, 60, 60, 160);
        p.rect(this.spawnX, this.spawnY, this.w, this.h, 10);
      }
      // Respawn countdown
      const secs = Math.ceil(this.deathTimer / 60);
      p.fill(255);
      p.textSize(14);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`${secs}`, this.spawnX + this.w / 2, this.spawnY + this.h / 2);
      return;
    }

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
