import { GameConfig } from '../config/GameConfig.js';
import { TileType } from '../config/TileType.js';

/**
 * Axis-aligned bounding box overlap test.
 * Exported so other modules (e.g. Coin) can import it from one place.
 * @param ax
 * @param ay
 * @param aw
 * @param ah
 * @param bx
 * @param by
 * @param bw
 * @param bh
 * @returns {boolean} true if the two rectangles overlap
 */
export function aabbIntersects(ax, ay, aw, ah, bx, by, bw, bh) {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

/**
 *
 * @param MAP
 * @param tx
 * @param ty
 */
function getMapTile(MAP, tx, ty) {
    if (!MAP?.length || !MAP[0]?.length) return TileType.SOLID;
    if (ty < 0 || tx < 0 || tx >= MAP[0].length) {
        return TileType.SOLID;
    }
    // Let players fall out of the bottom of the map instead of treating the
    // void below the last row as an invisible solid floor.
    if (ty >= MAP.length) {
        return TileType.EMPTY;
    }
    return MAP[ty][tx];
}

/**
 *
 * @param MAP
 * @param tx
 * @param ty
 */
function isSolid(MAP, tx, ty) {
    const tile = getMapTile(MAP, tx, ty);
    return tile === TileType.SOLID;
}

/**
 *
 * @param MAP
 * @param tx
 * @param ty
 */
function isSpike(MAP, tx, ty) {
    return getMapTile(MAP, tx, ty) === TileType.SPIKE;
}

/**
 *
 * @param entity
 * @param p
 */
function getTileRange(entity, p) {
    return {
        left: p.floor(entity.x / GameConfig.TILE),
        right: p.floor((entity.x + entity.w) / GameConfig.TILE),
        top: p.floor(entity.y / GameConfig.TILE),
        bottom: p.floor((entity.y + entity.h) / GameConfig.TILE),
    };
}

/**
 * Move entity horizontally by dx, resolving collisions against:
 *   - solid map tiles
 *   - other players
 *   - solid placed obstacles
 * @param {object}     entity
 * @param {number}     dx
 * @param {Player[]}   allPlayers
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 * @param {Map}          MAP
 */
export function moveAndCollideX(
    entity,
    dx,
    allPlayers,
    p,
    obstacles = [],
    MAP,
) {
    if (dx === 0) return;
    entity.x += dx;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const tx = dx > 0 ? right : left;
    for (let ty = top; ty <= bottom; ty++) {
        if (!isSolid(MAP, tx, ty)) continue;
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
        if (
            !aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                other.x,
                other.y,
                other.w,
                other.h,
            )
        )
            continue;
        if (dx > 0) entity.x = other.x - entity.w - entity.skin;
        else entity.x = other.x + other.w + entity.skin;
    }

    // Placed solid obstacles
    for (const obs of obstacles) {
        if (!obs.isSolid) continue;
        if (
            !aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                obs.x,
                obs.y,
                obs.w,
                obs.h,
            )
        )
            continue;
        if (dx > 0) entity.x = obs.x - entity.w - entity.skin;
        else entity.x = obs.x + obs.w + entity.skin;
    }
}

/**
 * Move entity vertically by dy, resolving collisions against:
 *   - solid map tiles
 *   - other players
 *   - solid placed obstacles
 * @param {object}     entity
 * @param {number}     dy
 * @param {Player[]}   allPlayers
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 * @param {Map}          MAP
 */
export function moveAndCollideY(
    entity,
    dy,
    allPlayers,
    p,
    obstacles = [],
    MAP,
) {
    entity.onGround = false;
    if (dy === 0) return;
    const prevBottom = entity.y + entity.h;
    entity.y += dy;

    const { left, right, top, bottom } = getTileRange(entity, p);
    const ty = dy > 0 ? bottom : top;
    for (let tx = left; tx <= right; tx++) {
        const tileX = tx * GameConfig.TILE,
            tileY = ty * GameConfig.TILE;
        const tile = getMapTile(MAP, tx, ty);

        if (tile === TileType.SOLID) {
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
            continue;
        }

        // HALF tiles behave as one-way platforms at half tile height.
        if (tile === TileType.HALF && dy > 0) {
            const surfaceY = tileY + GameConfig.TILE / 2;
            const currBottom = entity.y + entity.h;
            const overlapsX =
                entity.x + entity.w > tileX &&
                entity.x < tileX + GameConfig.TILE;

            if (
                overlapsX &&
                prevBottom <= surfaceY + entity.skin &&
                currBottom >= surfaceY
            ) {
                entity.y = surfaceY - entity.h - entity.skin;
                entity.vy = 0;
                entity.onGround = true;
            }
        }

        // Slope tiles are also treated as one-way floor surfaces while falling.
        if (
            (tile === TileType.SLOPE_UP || tile === TileType.SLOPE_DOWN) &&
            dy > 0
        ) {
            const footX = entity.x + entity.w / 2;
            const inTileX = footX >= tileX && footX <= tileX + GameConfig.TILE;
            if (!inTileX) continue;

            const localX = Math.max(
                0,
                Math.min(GameConfig.TILE, footX - tileX),
            );

            // slopeUp  : left low  -> right high
            // slopeDown: left high -> right low
            const surfaceY =
                tile === TileType.SLOPE_UP
                    ? tileY + (GameConfig.TILE - localX)
                    : tileY + localX;

            const currBottom = entity.y + entity.h;
            if (
                prevBottom <= surfaceY + entity.skin &&
                currBottom >= surfaceY
            ) {
                entity.y = surfaceY - entity.h - entity.skin;
                entity.vy = 0;
                entity.onGround = true;
            }
        }
    }

    for (const other of allPlayers) {
        if (other === entity) continue;
        if (other.lifeState !== 'ALIVE') continue;
        if (
            !aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                other.x,
                other.y,
                other.w,
                other.h,
            )
        )
            continue;
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
        if (
            !aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                obs.x,
                obs.y,
                obs.w,
                obs.h,
            )
        )
            continue;
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
 * @param {object}     entity
 * @param {p5}         p
 * @param {Obstacle[]} obstacles
 * @param {Map}          MAP
 * @returns {boolean}
 */
export function checkSpikeCollision(entity, p, obstacles = [], MAP) {
    const { left, right, top, bottom } = getTileRange(entity, p);
    for (let ty = top; ty <= bottom; ty++) {
        for (let tx = left; tx <= right; tx++) {
            if (!isSpike(MAP, tx, ty)) continue;
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
        if (
            aabbIntersects(
                entity.x,
                entity.y,
                entity.w,
                entity.h,
                obs.x,
                obs.y,
                obs.w,
                obs.h,
            )
        ) {
            return true;
        }
    }

    return false;
}

/**
 *
 * @param entity
 * @param gameHeight
 */
export function checkFallDeath(entity, gameHeight) {
    return entity.y + entity.h > gameHeight;
}
