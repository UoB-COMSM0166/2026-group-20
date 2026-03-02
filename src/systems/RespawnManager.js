import { GameConfig } from "../config/GameConfig.js";
import { PlayerState } from "../config/PlayerState.js";

export class RespawnManager {
    constructor() {
        this.queue = []; 
    }

    triggerDeath(player, reason) {
        if (player.lifeState !== PlayerState.ALIVE) return;
        
        player.die(reason);

        this.queue.push({
            player: player,
            timer: GameConfig.RESPAWN_TIME, 
            phase: 'dead'                 
        });
    }

    update(deltaTime) {
        for (let i = this.queue.length - 1; i >= 0; i--) {
            let record = this.queue[i];
            
            record.timer -= deltaTime;

            if (record.timer <= 0) {
                if (record.phase === 'dead') {
                    record.player.prepareRespawn();
                    
                    record.phase = 'respawning';
                    record.timer = GameConfig.RESPAWN_TIME / 2; 
                } 
                else if (record.phase === 'respawning') {
                    record.player.finishRespawn();
                    this.queue.splice(i, 1);
                }
            } else {
                let totalRemainingMs = record.timer;
                if (record.phase === 'dead') {
                    totalRemainingMs += (GameConfig.RESPAWN_TIME / 2);
                }
            
                record.player.respawnCountdown = totalRemainingMs / 1000;
            }
        }
    }
    
    clear() {
        this.queue = [];
    }
}