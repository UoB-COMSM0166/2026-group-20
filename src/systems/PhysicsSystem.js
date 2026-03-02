import { TILE, isSolid, isSpike } from "../utils/tiles.js";
import { aabbIntersects } from "../utils/collision.js";

function getTileRange(entity, p) {
    return {
        left: p.floor(entity.x / TILE),
        right: p.floor((entity.x + entity.w) / TILE),
        top: p.floor(entity.y / TILE),
        bottom: p.floor((entity.y + entity.h) / TILE),
    };
}

export function moveAndCollideX(entity, dx, allPlayers, p) {
    if (dx === 0) return;
    entity.x += dx;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const tx = dx > 0 ? right : left;
    for (let ty = top; ty <= bottom; ty++) {
        if (!isSolid(tx, ty)) continue;
        const tileX = tx * TILE, tileY = ty * TILE;
        if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, TILE, TILE)) {
            entity.x = dx > 0 ? (tileX - entity.w - entity.skin) : (tileX + TILE + entity.skin);
        }
    }

    for (const other of allPlayers) {
        if (other === entity) continue; 
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, other.x, other.y, other.w, other.h)) continue;
        if (dx > 0) entity.x = other.x - entity.w - entity.skin;
        else if (dx < 0) entity.x = other.x + other.w + entity.skin;
    }
}

export function moveAndCollideY(entity, dy, allPlayers, p) {
    entity.onGround = false;
    if (dy === 0) return;
    entity.y += dy;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const ty = dy > 0 ? bottom : top;
    for (let tx = left; tx <= right; tx++) {
        if (!isSolid(tx, ty)) continue;
        const tileX = tx * TILE, tileY = ty * TILE;
        if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, TILE, TILE)) {
            if (dy > 0) {
                entity.y = tileY - entity.h - entity.skin;
                entity.vy = 0;
                entity.onGround = true; 
            } else {
                entity.y = tileY + TILE + entity.skin;
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

export function checkSpikeCollision(entity, p) {
    const { left, right, top, bottom } = getTileRange(entity, p);
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (!isSpike(tx, ty)) continue;
            const tileX = tx * TILE, tileY = ty * TILE;
            if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, tileX, tileY, TILE, TILE)) {
                return true;
            }
        }
    }
    return false;
}