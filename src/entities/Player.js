/**
 * A player entity in the game.
 * Handles movement, animation frames and life state.
 */

import { GameConfig } from '../config/GameConfig.js';
import { HandleInput } from '../systems/HandleInput.js';
import { PlayerMovementState } from '../config/PlayerMovementState.js';
import { PlayerState } from '../config/PlayerState.js';
import { PlayerGameState } from '../config/PlayerGameState.js';
import { DeathReason } from '../config/DeathReason.js';

import {
    moveAndCollideX,
    moveAndCollideY,
    checkSpikeCollision,
    checkFallDeath,
} from '../systems/PhysicsSystem.js';

export class Player {
    constructor(p, x, y, playerNo, spriteSheet, animationconfig) {
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

        // Double jump
        this.maxJumps = 2;
        this.jumpsLeft = this.maxJumps;
        this.secondJump = false;

        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        this.gameState = PlayerGameState.PLAYING;
        this.lastDeathReason = null;

        /**
         * Set to true by IcePlatform / IceBlock each frame the player is in contact.
         * When true, horizontal momentum is preserved (multiplied) instead of zeroed.
         * Reset to false at the start of every horizontalMovement() call.
         */
        this.slideMode = false;

        /**
         * Speed multiplier applied this frame by IceBlock.
         * 1.0 = normal. IceBlock sets it to > 1 while player is inside.
         * Reset to 1.0 at the start of every horizontalMovement() call.
         */
        this.speedMultiplier = 1.0;

        /**
         * Persistent obstacle inventory — survives across rounds.
         * Map of ObstacleType string → count.
         * Populated by ShopState, consumed by BuildState.
         * @type {Map<string, number>}
         */
        this.inventory = new Map();

        this.input = new HandleInput(p, playerNo);
        //this.state = PlayerMovementState.IDLE;
        this.facingRight = true;

        /**
         * Speed multiplier applied this frame by IceBlock.
         * 1.0 = normal. IceBlock sets it to > 1 while player is inside.
         * Reset to 1.0 at the start of every horizontalMovement() call.
         */
        this.speedMultiplier = 1.0;

        /**
         * Persistent obstacle inventory — survives across rounds.
         * Map of ObstacleType string → count.
         * Populated by ShopState, consumed by BuildState.
         * @type {Map<string, number>}
         */
        this.inventory = new Map();

        this.input = new HandleInput(p, playerNo);
        this.facingRight = true;
        this.respawnCountdown = 0;

        // ── Sprite animation ─
        this.spriteSheet = spriteSheet ?? null;
        this.framesArr = [];
        this.frameIndexIdle = 0;
        this.frameIndexRun = 0;
        this.frameIndexJump = 0;
        this.frameIndexFall = 0;
        this.frameIndexRespawning = 0;
        /** Animation frame-index map set by setSprite() or DrawPlayer. */
        this.animConfig = null;

        if (this.spriteSheet) {
            this._splitAnimation();
        }
    }

    /**
     * Assign a new sprite sheet and animation config at runtime.
     * Called by CharSelectState after the player picks a character.
     * @param {p5.Image} sheet
     * @param {object}   animConfig
     */
    setSprite(sheet, animConfig) {
        this.spriteSheet = sheet;
        this.animConfig = animConfig;
        this.framesArr = [];
        this.frameIndexIdle = 0;
        this.frameIndexRun = 0;
        this.frameIndexJump = 0;
        this.frameIndexFall = 0;
        this.frameIndexRespawning = 0;
        this._splitAnimation();
    }

    /**
     * Slice the horizontal sprite sheet into individual 28×34 frames.
     * @private
     */
    _splitAnimation() {
        const fw = this.w;
        const fh = this.h;
        for (let x = 0; x < this.spriteSheet.width; x += fw) {
            this.framesArr.push(this.spriteSheet.get(x, 0, fw, fh));
        }
    }

    /**
     * Handles horizontal player movement based on input.
     */
    horizontalMovement() {
        const prevSlide = this.slideMode;
        const speedMult = this.speedMultiplier;
        this.slideMode = false; // reset; ice obstacles re-set before this call
        this.speedMultiplier = 1.0; // reset; IceBlock re-sets before this call

        const noInput = !this.input.left && !this.input.right;
        if (noInput && prevSlide) {
            // Sliding: preserve momentum with light friction instead of zeroing
            this.vx *= 0.97;
        } else {
            this.vx = 0;
            if (this.input.left) this.vx -= this.speed * speedMult;
            if (this.input.right) this.vx += this.speed * speedMult;
        }
    }
    /**
     * Handles vertical player movement based on input.
     */
    jumpUp() {
        if (this.onGround) {
            this.jumpsLeft = this.maxJumps;
        }
        if (this.input.jump && !this.secondJump && this.jumpsLeft > 0) {
            this.vy = -this.jumpVel;
            this.jumpsLeft--;
            this.onGround = false;
        }
        this.secondJump = this.input.jump;
    }

    /**
     *
     *
     * @param {Player[]} allPlayers - List of players
     * @param {*} respawnManager
     * @param {Array} obstacles - List of obstacles
     */

    //move
    update(allPlayers, respawnManager, obstacles = [], MAP) {
        if (this.lifeState !== PlayerState.ALIVE) {
            return;
        }

        this.horizontalMovement();
        this.jumpUp();
        this.comeDown();
        this.moveAndCollide(allPlayers, obstacles, MAP);

        if (checkSpikeCollision(this, this.p, obstacles, MAP)) {
            respawnManager.triggerDeath(this, DeathReason.TRAP);
            return;
        }

        if (checkFallDeath(this, GameConfig.GAME_HEIGHT)) {
            respawnManager.triggerDeath(this, DeathReason.FALL);
            return;
        }

        this.updateMovementState();
    }
    /**
     * Applies gravity to the player.
     */
    comeDown() {
        this.vy += this.gravity;
        if (this.vy > this.maxFall) {
            this.vy = this.maxFall;
        }
    }

    /**
     * Moves the player and resolves collisions.
     * @param {Player[]} allPlayers - List of players.
     * @param {Array} obstacles - List of obstacles
     */

    //change name this is horrible
    //move to sparate file; handle collisions and the world
    //move
    moveAndCollide(allPlayers, obstacles = [], MAP) {
        moveAndCollideX(this, this.vx, allPlayers, this.p, obstacles, MAP);
        moveAndCollideY(this, this.vy, allPlayers, this.p, obstacles, MAP);
    }

    /**
     * Updates the movement state (idle, run, jump, fall).
     */
    updateMovementState() {
        if (this.vx > 0) {
            this.facingRight = true;
        }
        if (this.vx < 0) {
            this.facingRight = false;
        }

        if (!this.onGround) {
            this.movementState =
                this.vy < 0
                    ? PlayerMovementState.JUMP
                    : PlayerMovementState.FALL;
        } else {
            this.movementState =
                this.vx === 0
                    ? PlayerMovementState.IDLE
                    : PlayerMovementState.RUN;
        }
    }

    /**
     * Kills the player and output the reason.
     * @param {DeathReason} reason - the reason a player dies
     */
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

    /**
     * Moves the player to spawn position and prepares respawn animation.
     */
    prepareRespawn() {
        this.lifeState = PlayerState.RESPAWNING;
        this.x = this.spawnX;
        this.y = this.spawnY;
        console.log(`Player ${this.playerNo} is preparing to respawn`);
    }

    /**
     * Finishes the respawn process and returns the player to gameplay.
     */
    //Needs to be moved to a separate class
    finishRespawn() {
        this.lifeState = PlayerState.ALIVE;
        this.movementState = PlayerMovementState.IDLE;
        console.log(`Player ${this.playerNo} has respawned completely`);
    }

    /**
     * Returns whether the player should currently be visible or not.
     * @returns {boolean}
     */

    get isVisible() {
        return (
            this.lifeState === PlayerState.ALIVE ||
            this.lifeState === PlayerState.RESPAWNING
        );
    }

    /**
     * Changes the current game state for the player.
     * @param {PlayerGameState} newState
     */
    setGameState(newState) {
        this.gameState = newState;
    }
}
