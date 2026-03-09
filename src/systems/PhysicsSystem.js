// import { isSolid, isSpike } from "../systems/MapGeneration.js";
import { aabbIntersects } from "../utils/collision.js";
import { GameConfig } from "../config/GameConfig.js";

function checkIsSolid(tx, ty, MAP) {
    if (!MAP || !MAP[ty] || MAP[ty][tx] === undefined) return false;
    return MAP[ty][tx] === "#";
}

function checkIsSpike(tx, ty, MAP) {
    if (!MAP || !MAP[ty] || MAP[ty][tx] === undefined) return false;
    return MAP[ty][tx] === "S";
}

//huh??
function getTileRange(entity, p) {
    return {
        left: p.floor(entity.x / GameConfig.TILE),
        right: p.floor((entity.x + entity.w) / GameConfig.TILE),
        top: p.floor(entity.y / GameConfig.TILE),
        bottom: p.floor((entity.y + entity.h) / GameConfig.TILE),
    };
}

export function moveAndCollideX(entity, dx, allPlayers, p, MAP) {
    if (dx === 0) return;
    entity.x += dx;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const tx = dx > 0 ? right : left;
    for (let ty = top; ty <= bottom; ty++) {
        if (!checkIsSolid(tx, ty, MAP)) continue;
        const tileX = tx * GameConfig.TILE, tileY = ty * GameConfig.TILE;
        if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, GameConfig.TILE, GameConfig.TILE)) {
            entity.x = dx > 0 ? (tileX - entity.w - entity.skin) : (tileX + GameConfig.TILE + entity.skin);
        }
    }

    for (const other of allPlayers) {
        if (other === entity) continue; 
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, other.x, other.y, other.w, other.h)) continue;
        if (dx > 0) entity.x = other.x - entity.w - entity.skin;
        else if (dx < 0) entity.x = other.x + other.w + entity.skin;
    }
}

export function moveAndCollideY(entity, dy, allPlayers, p, MAP) {
    entity.onGround = false;
    if (dy === 0) return;
    entity.y += dy;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const ty = dy > 0 ? bottom : top;
    for (let tx = left; tx <= right; tx++) {
        if (!checkIsSolid(tx, ty, MAP)) continue;
        const tileX = tx * GameConfig.TILE, tileY = ty * GameConfig.TILE;
        if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, GameConfig.TILE, GameConfig.TILE)) {
            if (dy > 0) {
                entity.y = tileY - entity.h - entity.skin;
                entity.vy = 0;
                entity.onGround = true; 
            } else {
                entity.y = tileY + GameConfig.TILE + entity.skin;
                entity.vy = 0;         
            }
        }
    }

    for (const other of allPlayers) {
        if (other === entity) continue;
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, other.x, other.y, other.w, other.h)) continue;
        if (dy > 0) {
            entity.y = other.y - entity.h - entity.skin;
            entity.vy = 0;
            entity.onGround = true;
        } else if (dy < 0) {
            entity.y = other.y + other.h + entity.skin;
            entity.vy = 0;
        }
    }
}

export function checkSpikeCollision(entity, p, MAP) {
    const { left, right, top, bottom } = getTileRange(entity, p);
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (!checkIsSpike(tx, ty, MAP)) continue;
            const tileX = tx * GameConfig.TILE, tileY = ty * GameConfig.TILE;
            if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, GameConfig.TILE, GameConfig.TILE)) {
                return true;
            }
        }
    }
    return false;
}