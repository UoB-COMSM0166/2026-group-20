import { GameConfig } from "../config/GameConfig.js";
import { HandleInput } from "../systems/HandleInput.js";
import { PlayerMovementState } from "../config/PlayerMovementState.js";
import { PlayerState } from "../config/PlayerState.js";
import { PlayerGameState } from '../config/PlayerGameState.js';
import { DeathReason } from "../config/DeathReason.js";


import { moveAndCollideX, moveAndCollideY, checkSpikeCollision } from "../systems/PhysicsSystem.js";


export class Player {
    constructor(p, x, y, idx) {
        this.p = p;
        this.idx = idx;
        this.spawnX = x;
        this.spawnY = y;
        this.x = x; this.y = y;
        this.w = 28; this.h = 34;
        this.vx = 0; this.vy = 0;
        this.onGround = false;

        this.speed = GameConfig.PLAYERSPEED;
        this.jumpVel = GameConfig.JUMP_VELOCITY;
        this.gravity = GameConfig.GRAVITY;
        this.maxFall = GameConfig.MAX_FALL_SPEED;
        this.skin = GameConfig.SKIN_WIDTH;

        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        this.gameState = PlayerGameState.PLAYING;
        this.lastDeathReason = null;

        this.input = new HandleInput(p, idx);
        this.state = PlayerMovementState.IDLE;
        this.facingRight = true;

        this.respawnCountdown = 0;
    }

    /**
     *
     *
     * @memberof Player
     */
    handleInput() {
        this.vx = 0;
        if (this.input.left) this.vx -= this.speed;
        if (this.input.right) this.vx += this.speed;

        if (this.input.jump && this.onGround) {
            this.vy = -this.jumpVel;
            this.onGround = false;
        }
    }

    /**
     *
     *
     * @param {*} allPlayers
     * @param {*} respawnManager
     * @return {*} 
     * @memberof Player
     */
    update(allPlayers, respawnManager) {
        if (this.lifeState !== PlayerState.ALIVE) {
            return;
        }

        this.handleInput();

        this.vy += this.gravity;
        if (this.vy > this.maxFall) this.vy = this.maxFall;

        moveAndCollideX(this, this.vx, allPlayers, this.p);
        moveAndCollideY(this, this.vy, allPlayers, this.p);

        if (checkSpikeCollision(this, this.p)) {
            respawnManager.triggerDeath(this, DeathReason.TRAP);
        }

        this.updateMovementState();
    }

    /**
     *
     *
     * @memberof Player
     */
    updateMovementState() {
        if (this.vx > 0) this.facingRight = true;
        if (this.vx < 0) this.facingRight = false;

        if (!this.onGround) {
            this.movementState = this.vy < 0 ? PlayerMovementState.JUMP : PlayerMovementState.FALL;
        } else {
            this.movementState = this.vx === 0 ? PlayerMovementState.IDLE : PlayerMovementState.RUN;
        }
    }

    /**
     *
     *
     * @return {*} 
     * @memberof Player
     */
    display() {
        if (!this.isVisible) return;

        const p = this.p;
        p.noStroke();

        let alpha = this.lifeState === PlayerState.RESPAWNING ? 120 : 255;

        let playerColor;
        if (this.idx === 0) {
            playerColor = p.color(90, 170, 255, alpha);
        } else {
            playerColor = p.color(255, 200, 80, alpha);
        }
        p.fill(playerColor);

        p.rect(this.x, this.y, this.w, this.h, 6);

        if (this.onGround) {
            p.fill(255, 255, 255, Math.min(alpha, 120));
            p.rect(this.x + 4, this.y + this.h - 6, this.w - 8, 3, 2);
        }

        p.fill(255);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(16);
        p.textFont('Arial');

        if (this.lifeState === PlayerState.RESPAWNING) {
            p.fill(255, 100, 100);
            p.text(Math.ceil(this.respawnCountdown) + "s", this.x + this.w / 2, this.y - 5);
        } else {
            p.text(this.movementState, this.x + this.w / 2, this.y - 5);
        }
    }

    /**
     *
     *
     * @param {*} reason
     * @return {*} 
     * @memberof Player
     */
    die(reason) {
        if (this.lifeState === PlayerState.DEAD) return;
        this.lifeState = PlayerState.DEAD;
        this.lastDeathReason = reason;

        this.vx = 0;
        this.vy = 0;

        console.log(`Player ${this.idx} died due to: ${reason}`);
    }

    /**
     *
     *
     * @memberof Player
     */
    prepareRespawn() {
        this.lifeState = PlayerState.RESPAWNING;
        this.x = this.spawnX;
        this.y = this.spawnY;
        console.log(`Player ${this.idx} is preparing to respawn`);
    }

    /**
     *
     *
     * @memberof Player
     */
    finishRespawn() {
        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        console.log(`Player ${this.idx} has respawned completely`);
    }

    /**
     *
     *
     * @readonly
     * @memberof Player
     */
    get isVisible() {
        // Player is visible only when alive
        return this.lifeState === PlayerState.ALIVE || this.lifeState === PlayerState.RESPAWNING;
        // Player is invisible when dead 
        // but could be transparent when respawning
    }

    /**
     *
     *
     * @param {*} newState
     * @memberof Player
     */
    setGameState(newState) {
        this.gameState = newState;
    }
}