//import { MAP, TILE } from "../utils/tiles.js";
import { GameConfig } from '../config/GameConfig.js';
//export const TILE = 40;

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

/**
 *
 * @param tx
 * @param ty
 */
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

/**
 *
 * @param tx
 * @param ty
 */
export function isSolid(tx, ty) {
  return createBlocks(tx, ty) === "#";
}

/**
 *
 * @param tx
 * @param ty
 */
export function isSpike(tx, ty) {
  return createBlocks(tx, ty) === "S";
}

/**
 *
 * @param p
 */
export function drawMap(p) {
        p.noStroke();
        for (let y = 0; y < MAP.length; y++) {
            for (let x = 0; x < MAP[0].length; x++) {
                const c = MAP[y][x];
                if (c === "#") {
                    p.fill(80);
                    p.rect(x * GameConfig.TILE, y * GameConfig.TILE, GameConfig.TILE, GameConfig.TILE);
                } else if (c === "S") {
                    p.fill(220, 80, 80);
                    const px = x * GameConfig.TILE, py = y * GameConfig.TILE;
                    p.triangle(px, py + GameConfig.TILE, px + GameConfig.TILE / 2, py + 6, px + GameConfig.TILE, py + GameConfig.TILE);
                } else if (c === "F") {
                    p.fill(100, 220, 100);
                    p.rect(x * GameConfig.TILE, y * GameConfig.TILE, GameConfig.TILE, GameConfig.TILE);
                    p.fill(255);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(12);
                    p.text("GOAL", x * GameConfig.TILE + GameConfig.TILE/2, y * GameConfig.TILE + GameConfig.TILE/2);
                }
            }
        }
    }

