import { GameConfig } from "../config/GameConfig.js";
import { HandleInput } from "../systems/HandleInput.js";
import { PlayerMovementState } from "../config/PlayerMovementState.js";
import { PlayerState } from "../config/PlayerState.js";
import { PlayerGameState } from '../config/PlayerGameState.js';
import { DeathReason } from "../config/DeathReason.js";

import { moveAndCollideX, moveAndCollideY, checkSpikeCollision } from "../systems/PhysicsSystem.js";

export class Player {
    constructor(p, x, y, playerNo) {
        this.p = p;
        this.playerNo = playerNo;
        this.spawnX = x;
        this.spawnY = y;
        this.x = x; 
        this.y = y;
        this.w = 28; 
        this.h = 34;

        this.vx = 0; 
        this.vy = 0;
        this.onGround = false;

        this.speed = GameConfig.PLAYERSPEED;
        this.jumpVel = GameConfig.JUMP_VELOCITY;
        this.gravity = GameConfig.GRAVITY;
        this.maxFall = GameConfig.MAX_FALL_SPEED;
        this.skin = GameConfig.SKIN_WIDTH;

        //Double jump 
        this.maxJumps=2;
        this.jumpsLeft=this.maxJumps;
        this.secondJump=false;
         //
        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        this.gameState = PlayerGameState.PLAYING;
        this.lastDeathReason = null;

        this.input = new HandleInput(p, playerNo);
        this.state = PlayerMovementState.IDLE;
        this.facingRight = true;

        this.respawnCountdown = 0;
    }

    horizontalMovement() {
        this.vx = 0;
        if (this.input.left) {
            this.vx -= this.speed;
        }
        if (this.input.right) {
            this.vx += this.speed;
        }
    }

    jumpUp(){
         if(this.onGround){
            this.jumpsLeft=this.maxJumps;
         }
         if (this.input.jump  && !this.secondJump
             && this.jumpsLeft>0) {
            this.vy = -this.jumpVel;
            this.jumpsLeft--;
            this.onGround = false;
        }
        this.secondJump=this.input.jump;
    }

    update(allPlayers, respawnManager, MAP) {
        if (this.lifeState !== PlayerState.ALIVE) {
            return;
        }

        this.horizontalMovement();
        this.jumpUp();
        this.comeDown();

        this.moveAndCollide(allPlayers, MAP);

        if (checkSpikeCollision(this, this.p, MAP)) {
            respawnManager.triggerDeath(this, DeathReason.TRAP);
        }

        this.updateMovementState();
    }

     comeDown(){
        this.vy += this.gravity;
        if (this.vy > this.maxFall) {
            this.vy = this.maxFall;
        }
     }

     moveAndCollide(allPlayers, MAP){
        moveAndCollideX(this, this.vx, allPlayers, this.p, MAP);
        moveAndCollideY(this, this.vy, allPlayers, this.p, MAP);
     }

    updateMovementState() {
        if (this.vx > 0) {
         this.facingRight = true;
        }
        if (this.vx < 0) {
         this.facingRight = false;
        }

        if (!this.onGround) {
            this.movementState = this.vy < 0 ? PlayerMovementState.JUMP : PlayerMovementState.FALL;
        } else {
            this.movementState = this.vx === 0 ? PlayerMovementState.IDLE : PlayerMovementState.RUN;
        }
    }

    die(reason) {
        if (this.lifeState === PlayerState.DEAD) {
            return;
        }
        this.lifeState = PlayerState.DEAD;
        this.lastDeathReason = reason;

        this.vx = 0;
        this.vy = 0;

        console.log(`Player ${this.playerNo} died due to: ${reason}`);
    }

    prepareRespawn() {
        this.lifeState = PlayerState.RESPAWNING;
        this.x = this.spawnX;
        this.y = this.spawnY;
        console.log(`Player ${this.playerNo} is preparing to respawn`);
    }

     finishRespawn() {
        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        console.log(`Player ${this.playerNo} has respawned completely`);
    }

    get isVisible() {
        return this.lifeState === PlayerState.ALIVE || this.lifeState === PlayerState.RESPAWNING;
    }

    setGameState(newState) {
        this.gameState = newState;
    }
}