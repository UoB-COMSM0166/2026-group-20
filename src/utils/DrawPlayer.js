import { PlayerState } from '../config/PlayerState.js';
import { PlayerMovementState } from '../config/PlayerMovementState.js';
import { AnimationConfigChick } from '../config/AnimationConfigChick.js';
import { AnimationConfigBunny } from '../config/AnimationConfigBunny.js';

/**
 * DrawPlayer — renders a player each frame.
 *
 * If the player has a loaded sprite sheet (framesArr.length > 0), draws
 * the appropriate animation frame for the current movement/life state.
 * Otherwise falls back to a simple label (useful in tests / dev).
 *
 * Frame advance rate: every call advances the frame index by 1. At ~60 fps
 * the animation plays at the p5 frame rate. The sprite branch animates on
 * every draw call, so we preserve that behaviour exactly.
 * @param player
 */
export function DrawPlayer(player) {
    if (!player.isVisible) return;

    const p = player.p;

    // ── Sprite path ───────────────────────────────────────────────────────
    if (player.framesArr.length > 0) {
        // Use the character's own animConfig (set by setSprite / CharSelectState).
        // Fall back to playerNo-based default so the game works before char select runs.
        const cfg =
            player.animConfig ??
            (player.playerNo === 0
                ? AnimationConfigChick
                : AnimationConfigBunny);

        const state = player.movementState;
        const lifeState = player.lifeState;

        // Respawning overrides movement state
        if (lifeState === PlayerState.RESPAWNING && cfg.RESPAWNING) {
            _drawFrame(player, p, cfg.RESPAWNING, 'frameIndexRespawning', true);
        } else if (state === PlayerMovementState.RUN) {
            _drawFrame(player, p, cfg.RUN, 'frameIndexRun', true);
        } else if (state === PlayerMovementState.JUMP) {
            _drawFrame(player, p, cfg.JUMP, 'frameIndexJump', true);
        } else if (state === PlayerMovementState.FALL) {
            _drawFrame(player, p, cfg.FALL, 'frameIndexFall', true);
        } else {
            // IDLE (and any unrecognised state)
            _drawFrame(player, p, cfg.IDLE, 'frameIndexIdle', false);
        }
    }

    // ── HUD label above player ─
    p.noStroke();
    p.fill(255);
    p.textAlign(p.CENTER, p.BOTTOM);
    p.textSize(16);
    p.textFont('Arial');

    if (player.lifeState === PlayerState.RESPAWNING) {
        p.fill(255, 100, 100);
        p.text(
            Math.ceil(player.respawnCountdown) + 's',
            player.x + player.w / 2,
            player.y - 5,
        );
    } else {
        p.text(player.movementState, player.x + player.w / 2, player.y - 5);
    }
}

/**
 * Draw a single sprite frame, handling horizontal flip for left-facing.
 * Advances the frame index on every call.
 * @param {Player}   player
 * @param {p5}       p
 * @param {number[]} frames      - array of frame indices into framesArr
 * @param {string}   indexKey    - which frameIndex property to advance
 * @param {boolean}  flipOnLeft  - whether to mirror the sprite when facing left
 */
function _drawFrame(player, p, frames, indexKey, flipOnLeft) {
    const idx = player[indexKey] % frames.length;
    const img = player.framesArr[frames[idx]];

    if (!img) return; // guard against missing frame

    if (flipOnLeft && !player.facingRight) {
        p.push();
        p.translate(player.x + player.w, player.y);
        p.scale(-1, 1);
        p.image(img, 0, 0);
        p.pop();
    } else {
        p.image(img, player.x, player.y);
    }

    // Advance frame index — wraps automatically
    player[indexKey] = (player[indexKey] + 1) % frames.length;
}
