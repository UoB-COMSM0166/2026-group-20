import { Player } from "./entities/Player.js";
import { Coin } from "./entities/Coin.js";
import { HUD } from "./entities/HUD.js";
import { aabbIntersects } from "./utils/collision.js";

export const sketch = (p) => {
  let p1, p2;
  let coins = [];
  let hud;
  let groundY;
  let currentLevel = 1;

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

    hud = new HUD(p);

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

    p1.update(groundY);
    p2.update(groundY);
    for (const coin of coins) coin.update();

    checkPickups(p1);
    checkPickups(p2);

    for (const coin of coins) coin.display();
    p1.display();
    p2.display();

    // HUD drawn last so it's always on top
    hud.display([p1, p2], currentLevel);
  };

  function checkPickups(player) {
    if (!player.alive) return;
    const pa = player.getAABB();
    for (const coin of coins) {
      if (coin.collected) continue;
      const ca = coin.getAABB();
      if (aabbIntersects(pa.x, pa.y, pa.w, pa.h, ca.x, ca.y, ca.w, ca.h)) {
        coin.collected = true;
        player.collectCoin(coin.value);
      }
    }
  }

  function drawGround() {
    p.noStroke();
    p.fill(70);
    p.rect(0, groundY, p.width, p.height - groundY);
  }
};
