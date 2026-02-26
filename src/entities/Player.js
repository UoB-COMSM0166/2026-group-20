import { PlayerState } from "../config/PlayerState.js";
import { PlayerGameState } from '../config/PlayerGameState.js';
import { DeathReason } from "./config/DeathReason.js";

export class Player {
    constructor(startX, startY) {
        this.startPosition = { x: startX, y: startY };
        this.x = startX;
        this.y = startY;
        this.state = PlayerState.ALIVE;
        this.gameState = PlayerGameState.PLAYING;
        this.lastDeathReason = null;
    }

    die(reason) {
        if (this.state === PlayerState.DEAD) return;
        this.state = PlayerState.DEAD;
        this.lastDeathReason = reason;

        if (reason === DeathReason.FALL) {
            console.log("Player fell to death");
        } else if (reason === DeathReason.TRAP) {
            console.log("Player was killed by a trap");
        }
        
        console.log("Player died");
    }

    prepareRespawn() {
        this.state = PlayerState.RESPAWNING;
        this.x = this.startPosition.x;
        this.y = this.startPosition.y;
        console.log("Player is respawning");
    }

    finishRespawn() {
        this.state = PlayerState.ALIVE;
        console.log("Player has respawned");
    }

    get isVisible() {
        // Player is visible only when alive
        return this.state === PlayerState.ALIVE;
        // Player is invisible when dead 
        // but could be transparent when respawning
    }

    setGameState(newState) {
        this.gameState = newState;
    }
}