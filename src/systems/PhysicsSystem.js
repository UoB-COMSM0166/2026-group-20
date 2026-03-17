import { isSolid, isSpike } from "../maps/MapLoader.js";
import { GameConfig } from "../config/GameConfig.js";

/**
 * Axis-aligned bounding box overlap test.
 * Exported so other modules (e.g. Coin) can import it from one place.
 *
 * @returns {boolean} true if the two rectangles overlap
 */
export function aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function getTileRange(entity, p) {
    return {
        left:   p.floor(entity.x / GameConfig.TILE),
        right:  p.floor((entity.x + entity.w) / GameConfig.TILE),
        top:    p.floor(entity.y / GameConfig.TILE),
        bottom: p.floor((entity.y + entity.h) / GameConfig.TILE),
    };
}

/**
 * Move entity horizontally by dx, resolving collisions against:
 *   - solid map tiles
 *   - other players
 *   - solid placed obstacles
 *
 * @param {object}     entity
 * @param {number}     dx
 * @param {Player[]}   allPlayers
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 */
export function moveAndCollideX(entity, dx, allPlayers, p, obstacles = []) {
    if (dx === 0) return;
    entity.x += dx;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const tx = dx > 0 ? right : left;
    for (let ty = top; ty <= bottom; ty++) {
        if (!isSolid(tx, ty)) continue;
        const tileX = tx * GameConfig.TILE,
            tileY = ty * GameConfig.TILE;
        if (
            aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                tileX,
                tileY,
                GameConfig.TILE,
                GameConfig.TILE,
            )
        ) {
            entity.x =
                dx > 0
                    ? tileX - entity.w - entity.skin
                    : tileX + GameConfig.TILE + entity.skin;
        }
    }

    for (const other of allPlayers) {
        if (other === entity) continue;
        if (other.lifeState !== 'ALIVE') continue;
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, other.x, other.y, other.w, other.h)) continue;
        if (dx > 0) entity.x = other.x - entity.w - entity.skin;
        else        entity.x = other.x + other.w  + entity.skin;
    }

    // Placed solid obstacles
    for (const obs of obstacles) {
        if (!obs.isSolid) continue;
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, obs.x, obs.y, obs.w, obs.h)) continue;
        if (dx > 0) entity.x = obs.x - entity.w - entity.skin;
        else        entity.x = obs.x + obs.w     + entity.skin;
    }
}

/**
 * Move entity vertically by dy, resolving collisions against:
 *   - solid map tiles
 *   - other players
 *   - solid placed obstacles
 *
 * @param {object}     entity
 * @param {number}     dy
 * @param {Player[]}   allPlayers
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 */
export function moveAndCollideY(entity, dy, allPlayers, p, obstacles = []) {
    entity.onGround = false;
    if (dy === 0) return;
    entity.y += dy;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const ty = dy > 0 ? bottom : top;
    for (let tx = left; tx <= right; tx++) {
        if (!isSolid(tx, ty)) continue;
        const tileX = tx * GameConfig.TILE,
            tileY = ty * GameConfig.TILE;
        if (
            aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                tileX,
                tileY,
                GameConfig.TILE,
                GameConfig.TILE,
            )
        ) {
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
        if (other.lifeState !== 'ALIVE') continue;
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, other.x, other.y, other.w, other.h)) continue;
        if (dy > 0) {
            entity.y = other.y - entity.h - entity.skin;
            entity.vy = 0;
            entity.onGround = true;
        } else {
            entity.y = other.y + other.h + entity.skin;
            entity.vy = 0;
        }
    }

    // Placed solid obstacles
    for (const obs of obstacles) {
        if (!obs.isSolid) continue;
        if (!aabbIntersects(entity.x, entity.y, entity.w, entity.h, obs.x, obs.y, obs.w, obs.h)) continue;
        if (dy > 0) {
            entity.y = obs.y - entity.h - entity.skin;
            entity.vy = 0;
            entity.onGround = true;
        } else {
            entity.y = obs.y + obs.h + entity.skin;
            entity.vy = 0;
        }
    }
}

/**
 * Returns true if the entity overlaps any spike — either a map 'S' tile
 * or a placed hazard obstacle.
 *
 * @param {object}     entity
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 * @returns {boolean}
 */
export function checkSpikeCollision(entity, p, obstacles = []) {
    const { left, right, top, bottom } = getTileRange(entity, p);
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (!isSpike(tx, ty)) continue;
            const tileX = tx * GameConfig.TILE,
                tileY = ty * GameConfig.TILE;
            if (
                aabbIntersects(
                    entity.x,
                    entity.y,
                    entity.w,
                    entity.h,
                    tileX,
                    tileY,
                    GameConfig.TILE,
                    GameConfig.TILE,
                )
            ) {
                return true;
            }
        }
    }

    for (const obs of obstacles) {
        if (!obs.isHazard) continue;
        if (aabbIntersects(entity.x, entity.y, entity.w, entity.h, obs.x, obs.y, obs.w, obs.h)) {
            return true;
        }
    }

    return false;
}
