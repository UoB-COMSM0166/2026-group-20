import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';
import { PlayerGameState } from '../../config/PlayerGameState.js';

/**
 * BouncePad — a solid springboard that launches players upward.
 *
 * When a player's feet touch the top surface, applyEffect() overrides their
 * vy with BOUNCE_PAD_FORCE and clears onGround so the launch takes effect
 * next physics step. The pad animates a compression/extension cycle.
 *
 * @extends Obstacle
 */
export class BouncePad extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this.obstacleSheet = obstacleSheet;
        this.frameIndex=0;
        
        this.sawWidth=28;
        this.sawHeight=28;
        this.splitAnimation(this.sawWidth, this.sawHeight); 
        this._isActivated = false;
        this._compressTimer = 0; 
        this.idleFrames    = this.framesArr.slice(0,1);   
        this.activeFrames  = this.framesArr;   
        this._currentFrames = this.idleFrames;
    }

    get isSolid()  { return true; }
    get isHazard() { return false; }

    update(deltaTime) {
        if (this._compressTimer > 0) {
            this._compressTimer -= deltaTime;
            if (this._compressTimer <= 0) {
               this._isActivated   = false;
               this._currentFrames = this.idleFrames;
               this.frameIndex     = 0;
            }
        }
    }

    applyEffect(player) {
        // Same feet-based check as IcePlatform — aabbIntersects returns false
        // because physics resolves player feet to obs.y - skin (0.01px above top).
        const feetY = player.y + player.h;
        const onTop = player.onGround &&
                      feetY >= this.y - 2 && feetY <= this.y + 4 &&
                      player.x + player.w > this.x + 2 &&
                      player.x < this.x + this.w - 2;
        if (!onTop) return;

        player.vy       = GameConfig.BOUNCE_PAD_FORCE;
        player.onGround = false;
        player.jumpsLeft = player.maxJumps;
        this._compressTimer  = 400;  
        this._isActivated    = true;
        this._currentFrames  = this.activeFrames;
        this.frameIndex      = 0;  
    }

    draw() {
         const p    = this.p;
         const T    = GameConfig.TILE;
         const cx = this.x + T / 2;
         const cy = this.y;
         const frames = this._currentFrames;

         if (!frames||frames.length === 0) return;

         const frame = frames[Math.floor(this.frameIndex) % frames.length];

         p.push();
         p.translate(cx, cy);
         if (frame) {
            p.image(frame, -frame.width / 2, 0);
         }
         this.frameIndex = (this.frameIndex + 0.8) % frames.length;
         p.pop();
    }

    static drawGhost(p, x, y, sheet) {
        const T = GameConfig.TILE;
        if (!sheet) return;

        const frameW = 28;
        const frameH = 28;

        const cx = x + T / 2;
        const cy = y;

        p.push();
        p.translate(cx, cy);
        p.tint(255, 127);
        p.image(sheet, -frameW/2, 0, frameW, frameH, 0, 0, frameW, frameH);
        p.pop();
    }
}
