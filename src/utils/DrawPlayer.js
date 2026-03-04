import { PlayerState } from "../config/PlayerState.js";
export function DrawPlayer(player) {
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

        let playerColor;
        if (player.playerNo === 0) {
            playerColor = p.color(90, 170, 255, alpha);
        } 
        else {
            playerColor = p.color(255, 200, 80, alpha);
        }
        p.fill(playerColor);
        p.rect(player.x, player.y, player.w, player.h, 6);
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
