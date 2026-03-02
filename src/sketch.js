import { Player } from "./entities/Player.js";
import { Coin } from "./entities/Coin.js";
import { aabbIntersects } from "./utils/collision.js";

const GRAVITY = 0.8;

export const sketch = (p) => {
  let p1, p2;
  let coins = [];
  let groundY;

  p.setup = () => {
    p.createCanvas(900, 450);
    groundY = p.height - 70;

    p1 = new Player(p, 180, groundY - 50, {
      left: 65, right: 68, up: 87, down: 83
    }, p.color(255, 120, 120), "P1");

    p2 = new Player(p, 620, groundY - 50, {
      left: p.LEFT_ARROW, right: p.RIGHT_ARROW,
      up: p.UP_ARROW, down: p.DOWN_ARROW
    }, p.color(120, 160, 255), "P2");

    // Spawn coins at various positions
    coins = [
      new Coin(p, 100, groundY - 120),
      new Coin(p, 220, groundY - 180),
      new Coin(p, 360, groundY - 140),
      new Coin(p, 480, groundY - 200),
      new Coin(p, 600, groundY - 120),
      new Coin(p, 720, groundY - 160),
      new Coin(p, 820, groundY - 130),
    ];
  };

  p.draw = () => {
    p.background(20);
    drawGround();

    // Update
    p1.update(groundY);
    p2.update(groundY);
    for (const coin of coins) coin.update();

    // Check pickups
    checkPickups(p1);
    checkPickups(p2);

    // Draw coins first (behind players)
    for (const coin of coins) coin.display();

    // Draw players
    p1.display();
    p2.display();

    drawHUD();
  };

  function checkPickups(player) {
    const pa = player.getAABB();
    for (const coin of coins) {
      if (coin.collected) continue;
      const ca = coin.getAABB();
      if (aabbIntersects(pa.x, pa.y, pa.w, pa.h, ca.x, ca.y, ca.w, ca.h)) {
        coin.collected = true;
        player.score += 1;
      }
    }
  }

  function drawGround() {
    p.noStroke();
    p.fill(70);
    p.rect(0, groundY, p.width, p.height - groundY);
  }

  function drawHUD() {
    p.fill(230);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Controls:", 12, 10);
    p.text("P1: W/A/S/D", 12, 28);
    p.text("P2: Arrow keys", 12, 46);

    // Scores
    p.textSize(16);
    p.textAlign(p.CENTER, p.TOP);
    p.fill(p1.col);
    p.text(`P1 Score: ${p1.score}`, p.width / 2 - 80, 10);
    p.fill(p2.col);
    p.text(`P2 Score: ${p2.score}`, p.width / 2 + 80, 10);

    // All collected message
    const allCollected = coins.every(c => c.collected);
    if (allCollected) {
      p.fill(255, 220, 50);
      p.textSize(28);
      p.textAlign(p.CENTER, p.CENTER);
      p.text("All coins collected!", p.width / 2, p.height / 2);
    }
  }
};
