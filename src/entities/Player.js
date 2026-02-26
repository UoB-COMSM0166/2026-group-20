import { TILE, isSolid, isSpike } from "../utils/tiles.js";
import { aabbIntersects } from "../utils/collision.js";

export class Player {
  constructor(p, x, y, idx) {
    this.p = p;
    this.idx = idx;
    this.spawnX = x;
    this.spawnY = y;
    this.x = x; this.y = y;
    this.w = 28; this.h = 34;
    this.vx = 0; this.vy = 0;
    this.onGround = false;

    this.speed = 3.2;
    this.jumpVel = 10.5;
    this.gravity = 0.7;
    this.maxFall = 18;
    this.skin = 0.01;
  }

  respawn() {
    this.x = this.spawnX; this.y = this.spawnY;
    this.vx = 0; this.vy = 0;
    this.onGround = false;
  }

  handleInput() {
    const p = this.p;
    let left, right, jump;
    if (this.idx === 0) {
      left = p.keyIsDown(65); right = p.keyIsDown(68); jump = p.keyIsDown(87);
    } else {
      left = p.keyIsDown(p.LEFT_ARROW); right = p.keyIsDown(p.RIGHT_ARROW); jump = p.keyIsDown(p.UP_ARROW);
    }
    this.vx = 0;
    if (left)  this.vx -= this.speed;
    if (right) this.vx += this.speed;
    if (jump && this.onGround) {
      this.vy = -this.jumpVel;
      this.onGround = false;
    }
  }

  getTileRange() {
    return {
      left:   this.p.floor(this.x / TILE),
      right:  this.p.floor((this.x + this.w) / TILE),
      top:    this.p.floor(this.y / TILE),
      bottom: this.p.floor((this.y + this.h) / TILE),
    };
  }

  update(allPlayers) {
    this.handleInput();
    this.vy += this.gravity;
    if (this.vy > this.maxFall) this.vy = this.maxFall;

    this.moveAndCollideX(this.vx, allPlayers);
    this.moveAndCollideY(this.vy, allPlayers);

    if (this.touchesSpike()) this.respawn();
  }

  collideTilesX(dx) {
    const { left, right, top, bottom } = this.getTileRange();
    const tx = dx > 0 ? right : left;
    for (let ty = top; ty <= bottom; ty++) {
      if (!isSolid(tx, ty)) continue;
      const tileX = tx * TILE, tileY = ty * TILE;
      if (aabbIntersects(this.x, this.y, this.w, this.h, tileX, tileY, TILE, TILE)) {
        this.x = dx > 0 ? (tileX - this.w - this.skin) : (tileX + TILE + this.skin);
      }
    }
  }

  collideTilesY(dy) {
    const { left, right, top, bottom } = this.getTileRange();
    const ty = dy > 0 ? bottom : top;
    for (let tx = left; tx <= right; tx++) {
      if (!isSolid(tx, ty)) continue;
      const tileX = tx * TILE, tileY = ty * TILE;
      if (aabbIntersects(this.x, this.y, this.w, this.h, tileX, tileY, TILE, TILE)) {
        if (dy > 0) {
          this.y = tileY - this.h - this.skin;
          this.vy = 0;
          this.onGround = true;
        } else {
          this.y = tileY + TILE + this.skin;
          this.vy = 0;
        }
      }
    }
  }

  collidePlayersX(dx, allPlayers) {
    for (const other of allPlayers) {
      if (other === this) continue;
      if (!aabbIntersects(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h)) continue;
      if (dx > 0) this.x = other.x - this.w - this.skin;
      else if (dx < 0) this.x = other.x + other.w + this.skin;
    }
  }

  collidePlayersY(dy, allPlayers) {
    for (const other of allPlayers) {
      if (other === this) continue;
      if (!aabbIntersects(this.x, this.y, this.w, this.h, other.x, other.y, other.w, other.h)) continue;
      if (dy > 0) {
        this.y = other.y - this.h - this.skin;
        this.vy = 0;
        this.onGround = true;
      } else if (dy < 0) {
        this.y = other.y + other.h + this.skin;
        this.vy = 0;
      }
    }
  }

  moveAndCollideX(dx, allPlayers) {
    if (dx === 0) return;
    this.x += dx;
    this.collideTilesX(dx);
    this.collidePlayersX(dx, allPlayers);
  }

  moveAndCollideY(dy, allPlayers) {
    this.onGround = false;
    if (dy === 0) return;
    this.y += dy;
    this.collideTilesY(dy);
    this.collidePlayersY(dy, allPlayers);
  }

  touchesSpike() {
    const { left, right, top, bottom } = this.getTileRange();
    for (let ty = top; ty <= bottom; ty++) {
      for (let tx = left; tx <= right; tx++) {
        if (!isSpike(tx, ty)) continue;
        const tileX = tx * TILE, tileY = ty * TILE;
        if (aabbIntersects(this.x, this.y, this.w, this.h, tileX, tileY, TILE, TILE)) return true;
      }
    }
    return false;
  }

  display() {
    const p = this.p;
    p.noStroke();
    p.fill(this.idx === 0 ? p.color(90, 170, 255) : p.color(255, 200, 80));
    p.rect(this.x, this.y, this.w, this.h, 6);

    if (this.onGround) {
      p.fill(255, 255, 255, 120);
      p.rect(this.x + 4, this.y + this.h - 6, this.w - 8, 3, 2);
    }
  }
}
