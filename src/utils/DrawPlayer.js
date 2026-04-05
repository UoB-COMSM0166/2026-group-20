import { PlayerState } from '../config/PlayerState.js';
import { PlayerMovementState } from '../config/PlayerMovementState.js';
/**
 * DrawPlayer — renders a player each frame.
 *
 * If the player has a loaded sprite sheet (framesArr.length > 0), draws
 * the appropriate animation frame for the current movement/life state.
 * Otherwise falls back to a coloured rectangle (useful in tests / dev).
 *
 * Frame advance rate: every call advances the frame index by 1. At ~60 fps
 * the animation plays at the p5 frame rate. The sprite branch animates on
 * every draw call, so we preserve that behaviour exactly.
 */
export function DrawPlayer(player) {
    if (!player.isVisible) return;

    const p = player.p;

    // ── Sprite path ───────────────────────────────────────────────────────
    if (player.framesArr.length > 0) {
        // Use the character's own animConfig (set by setSprite / CharSelectState).
        // Fall back to playerNo-based default so the game works before char select runs.
        const cfg = player.animConfig
            ?? (player.playerNo === 0 ? AnimationConfig : AnimationConfig2);

        const state     = player.movementState;
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
    } else {
        // ── Fallback rectangle ────────────────────────────────────────────
        p.noStroke();
        let alpha;
        if(PlayerState.RESPAWNING===player.lifeState){
            alpha=120;
        }
        else{
            alpha=255;
        }

      
         if (player.movementState === PlayerMovementState.IDLE){
            const frames = player.animationconfig.IDLE;
            player.p.image( player.framesArr[frames[player.frameIndexIdle]], player.x, player.y);
            player.frameIndexIdle = (player.frameIndexIdle + 1) % frames.length;
         }
      
         if(player.movementState===PlayerMovementState.RUN){
            const frames = player.animationconfig.RUN;
            const img = player.framesArr[frames[player.frameIndexRun]];
            player.p.push();
            if(player.facingRight){
               player.p.image( player.framesArr[frames[player.frameIndexRun]], player.x, player.y);
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            player.frameIndexRun = (player.frameIndexRun + 1) % frames.length;
         }

         if(player.movementState===PlayerMovementState.JUMP){
            const frames = player.animationconfig.JUMP;
            const img = player.framesArr[frames[player.frameIndexJump]];
            player.p.push();
            if(player.facingRight){
               player.p.image( player.framesArr[frames[player.frameIndexJump]], player.x, player.y);
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            player.frameIndexJump = (player.frameIndexJump + 1) % frames.length;
         }

         if(player.movementState===PlayerMovementState.FALL){
            const frames = player.animationconfig.FALL;
            const img = player.framesArr[frames[player.frameIndexFall]];
            player.p.push();
            if(player.facingRight){
               player.p.image( player.framesArr[frames[player.frameIndexFall]], player.x, player.y);
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            player.frameIndexFall = (player.frameIndexFall + 1) % frames.length;
         }

         if(player.lifeState===PlayerState.RESPAWNING){
            const frames = player.animationconfig.RESPAWNING;
            player.p.image(player.framesArr[frames[player.frameIndexRespawning]], player.x, player.y);
            player.frameIndexRespawning = (player.frameIndexRespawning + 1) % frames.length;
         }

        p.fill(255);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(16);
        p.textFont('Arial');

        if (player.lifeState === PlayerState.RESPAWNING) {
            p.fill(255, 100, 100);
            p.text(Math.ceil(player.respawnCountdown) + "s", player.x + player.w / 2, player.y - 5);
        } 
        else {
            p.text(player.movementState, player.x + player.w / 2, player.y - 5);
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
        p.text(Math.ceil(player.respawnCountdown) + 's',
               player.x + player.w / 2, player.y - 5);
    } else {
        p.text(player.movementState, player.x + player.w / 2, player.y - 5);
    }
}

/**
 * Draw a single sprite frame, handling horizontal flip for left-facing.
 * Advances the frame index on every call.
 *
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
