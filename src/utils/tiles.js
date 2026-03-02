export const TILE = 40;

export const MAP = [
  "........................",
  "........................",
  "...F....##......####.....",
  "...###......#........##.",
  "........................",
  ".........##...###.......",
  "..............S.........",
  ".....###................",
  "........................",
  "##########  ############",
];

export function tileAt(tx, ty) {
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
  return tileAt(tx, ty) === "#";
}

export function isSpike(tx, ty) {
  return tileAt(tx, ty) === "S";
}
