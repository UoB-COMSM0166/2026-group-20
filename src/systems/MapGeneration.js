//import { MAP, TILE } from "../utils/tiles.js";
import { GameConfig, TILE } from '../config/GameConfig.js';

//Make the map more difficult (and map 2 the easier one)
export const MAP = [
  "........................",
  "........................",
  "........##......####..F..",
  "...###......#........##.",
  "....S...................",
  ".........##...###.......",
  "..............S.........",
  ".....###................",
  "...S....................",
  "########################",
];

export function createBlocks(tx, ty) {
  if(ty===NaN){
      ty=0;
  }
  if(tx===NaN){
      tx=0;
  }
  if (ty < 0 || ty >= MAP.length || tx < 0 || tx >= MAP[0].length) return "#";
  return MAP[ty][tx];
}

export function isSolid(tx, ty) {
  return createBlocks(tx, ty) === "#";
}

export function isSpike(tx, ty) {
  return createBlocks(tx, ty) === "S";
}

export function drawMap(p) {
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
                } else if (c === "F") {
                    p.fill(100, 220, 100);
                    p.rect(x * TILE, y * TILE, TILE, TILE);
                    p.fill(255);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(12);
                    p.text("GOAL", x * TILE + GameConfig.TILE/2, y * TILE + TILE/2);
                }
            }
        }
    }

