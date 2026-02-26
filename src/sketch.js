import { Player } from "./entities/Player.js";
import { MAP, TILE } from "./utils/tiles.js";

export const sketch = (p) => {
  let players = [];

  p.setup = () => {
    p.createCanvas(MAP[0].length * TILE, MAP.length * TILE);
    players = [
      new Player(p, 11 * TILE, 7 * TILE - 40, 0),
      new Player(p, 13 * TILE, 7 * TILE - 40, 1),
    ];
  };

  p.draw = () => {
    p.background(25);
    drawMap();
    for (const player of players) player.update(players);
    for (const player of players) player.display();

    p.fill(255);
    p.textSize(14);
    p.text("P1: A/D + W    P2: ←/→ + ↑    (Jump onto ### then test spike)", 10, 18);
  };

  function drawMap() {
    p.noStroke();
    for (let y = 0; y < MAP.length; y++) {
      for (let x = 0; x < MAP[0].length; x++) {
        const c = MAP[y][x];
        if (c === "#") {
          p.fill(80);
          p.rect(x * TILE, y * TILE, TILE, TILE);
        } else if (c === "S") {
          p.fill(220, 80, 80);
          const px = x * TILE, py = y * TILE;
          p.triangle(px, py + TILE, px + TILE / 2, py + 6, px + TILE, py + TILE);
        }
      }
    }
  }
};
