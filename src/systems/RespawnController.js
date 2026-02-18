import { GAME_CONFIG } from "../config/constant";
import { PlayerState } from "../config/playerState";

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
            }, GAME_CONFIG.RESPAWN_TIME);
        }, GAME_CONFIG.RESPAWN_TIME);
    }

    
}