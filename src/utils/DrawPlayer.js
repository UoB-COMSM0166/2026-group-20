import { PlayerState } from "../config/PlayerState.js";
import { PlayerMovementState } from "../config/PlayerMovementState.js";
import { AnimationConfig } from "../config/AnimationConfig.js";
import { AnimationConfig2 } from "../config/AnimationConfig2.js";
let frameIndexIdle=0;
let frameIndexRun=0;
let frameIndexJump=0;
let frameIndexFall=0;
let frameIndexRespawning=0;
let animationconfig; 
export function DrawPlayer(player) {
      if (player.playerNo === 0){
         animationconfig = AnimationConfig; 
      }
      else{
         animationconfig = AnimationConfig2; 
      }

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
            const frames = animationconfig.IDLE;
            player.p.image( player.framesArr[frames[frameIndexIdle]], player.x, player.y);
            frameIndexIdle = (frameIndexIdle + 1) % frames.length;
         }
      
         if(player.movementState===PlayerMovementState.RUN){
            const frames = animationconfig.RUN;
            const img = player.framesArr[frames[frameIndexRun]];
            player.p.push();
            if(player.facingRight){
               //const frames = AnimationConfig.RUN;
               player.p.image( player.framesArr[frames[frameIndexRun]], player.x, player.y);
               //frameIndexRun = (frameIndexRun + 1) % frames.length;
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            frameIndexRun = (frameIndexRun + 1) % frames.length;
         }

         if(player.movementState===PlayerMovementState.JUMP){
            const frames = animationconfig.JUMP;
            const img = player.framesArr[frames[frameIndexJump]];
            player.p.push();
            if(player.facingRight){
               //const frames = AnimationConfig.RUN;
               player.p.image( player.framesArr[frames[frameIndexJump]], player.x, player.y);
               //frameIndexRun = (frameIndexRun + 1) % frames.length;
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            frameIndexJump = (frameIndexJump + 1) % frames.length;
         }

         if(player.movementState===PlayerMovementState.FALL){
            const frames = animationconfig.FALL;
            const img = player.framesArr[frames[frameIndexFall]];
            player.p.push();
            if(player.facingRight){
               //const frames = AnimationConfig.RUN;
               player.p.image( player.framesArr[frames[frameIndexFall]], player.x, player.y);
               //frameIndexRun = (frameIndexRun + 1) % frames.length;
            }
            else{
               player.p.translate(player.x + player.w, player.y);
               player.p.scale(-1, 1);
               player.p.image(img, 0, 0);
            }
            player.p.pop();
            frameIndexFall = (frameIndexFall + 1) % frames.length;
         }

         if(player.lifeState===PlayerState.RESPAWNING){
            const frames = animationconfig.RESPAWNING;
            const img = player.framesArr[frames[frameIndexRespawning]];
            //player.p.push();
            //if(player.facingRight){
               //const frames = AnimationConfig.RUN;
               player.p.image( player.framesArr[frames[frameIndexRespawning]], player.x, player.y);
               //frameIndexRun = (frameIndexRun + 1) % frames.length;
            //}
            // else{
            //    player.p.translate(player.x + player.w, player.y);
            //    player.p.scale(-1, 1);
            //    player.p.image(img, 0, 0);
            // }
            //player.p.pop();
            frameIndexRespawning = (frameIndexRespawning + 1) % frames.length;
         }

         



            
         //player.p.image(player.framesArr[0], player.x, player.y);
        //}
        //player.p.image(player.framesArr[0], player.x, player.y);
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
