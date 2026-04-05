import { PlayerState } from "../config/PlayerState.js";
import { PlayerMovementState } from "../config/PlayerMovementState.js";


/**
 *
 * @param player
 */
export function DrawPlayer(player) {
      // if (player.playerNo === 0){
      //    player.animationconfig = AnimationConfig; 
      // }
      // else{
      //    player.animationconfig = AnimationConfig2; 
      // }

        if (!player.isVisible) {
            return;
        }
        const p = player.p;
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
