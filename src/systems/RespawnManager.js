import { GameConfig } from "../config/GameConfig.js";
import { PlayerState } from "../config/PlayerState.js";

export class RespawnController {
    constructor() {
        
    }

    // Make player die and respawn after a delay
    triggerDeath(player, reason) {
        if (player.state !== PlayerState.ALIVE) return
        
        player.die(reason);

        setTimeout(() => {
            player.prepareRespawn();

            setTimeout(() => {
                player.finishRespawn();
            }, GameConfig.RESPAWN_TIME);
        }, GameConfig.RESPAWN_TIME);
    }

    
}