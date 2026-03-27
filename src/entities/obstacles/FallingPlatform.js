import { Obstacle } from '../Obstacle.js';
import { GameConfig } from '../../config/GameConfig.js';
import { aabbIntersects } from '../../systems/PhysicsSystem.js';

/**
 * FallingPlatform — solid until a player stands on it.
 *
 * After FALLING_PLATFORM_TRIGGER_MS ms of contact, the platform drops with
 * gravity and becomes non-solid. It resets to its starting position once it
 * falls off-screen.
 *
 * @extends Obstacle
 */
export class FallingPlatform extends Obstacle {

    constructor(p, x, y, obstacleSheet) {
        super(p, x, y, obstacleSheet);
        this._startY       = y;
        this._falling      = false;
        this._gone         = false;  // true once fallen off-screen; never resets
        this._vy           = 0;
        this._standTimer   = 0;
        this._playerOnTop  = false;
        this._shakeOffset  = 0;
        this.obstacleSheet = obstacleSheet;
        this.frameIndex = 0; 
        this.fallingPlatformWidth = 32;
        this.fallingPlatformHeight = 10;
        this.splitAnimation(this.fallingPlatformWidth, this.fallingPlatformHeight); 
        this._isActivated = false;
        this.idleFrames    =  this.framesArr;
        this.activeFrames  = this.framesArr.slice(0,1);    
        this._currentFrames = this.idleFrames;
    }

    get isSolid()  { return !this._falling; }
    get isHazard() { return false; }

    // update(deltaTime, _gameWidth, gameHeight) {
    //     if (this._gone) return;

    //     if (this._falling) {
    //         this._vy  += GameConfig.FALLING_PLATFORM_GRAVITY;
    //         this.y    += this._vy;
    //         this._shakeOffset = 0;

    //         // Once off-screen, mark permanently gone — no respawn
    //         if (this.y > (gameHeight ?? 800) + 60) {
    //             this._gone = true;
    //         }
    //         this._playerOnTop = false;
    //         return;
    //     }

    //     // Accumulate stand time while player is on top
    //     if (this._playerOnTop) {
    //         if(this._currentFrames!==this.idleFrames){
    //             this._currentFrames=this.idleFrames;
    //             this.frameIndex=0;
    //         }
    //         if (this.p.frameCount % 5 === 0) {
    //             this.frameIndex = (this.frameIndex + 1) % this._currentFrames.length;
    //         }
        
    //     } 
    //     else {
    //         this._currentFrames = this.activeFrames;
    //         this.frameIndex = 0;
        
    //         this._standTimer += deltaTime;
    //         // Visual shake in the last quarter of the trigger window
    //         const ratio = this._standTimer / GameConfig.FALLING_PLATFORM_TRIGGER_MS;
    //         if (ratio > 0.6) {
    //             this._shakeOffset = (Math.random() - 0.5) * 3 * ratio;
    //         }
    //         if (this._standTimer >= GameConfig.FALLING_PLATFORM_TRIGGER_MS) {
    //             this._falling = true;
    //         }
    //     // } else {
    //     //     this._standTimer  = 0;
    //     //     this._shakeOffset = 0;
    //     }

    //     this._playerOnTop = false; // reset; applyEffect will re-set if player is on it
    // }
    update(deltaTime, _gameWidth, gameHeight) {
        if (this._gone) return;

        if (this._falling) {
            this._vy += GameConfig.FALLING_PLATFORM_GRAVITY;
            this.y += this._vy;
            if (this.y > (gameHeight ?? 800) + 60) this._gone = true;
            return;
        }

        if (this._playerOnTop) {
            this._currentFrames = this.activeFrames;
            this.frameIndex = 0; 

            this._standTimer += deltaTime*2;
            
            const ratio = this._standTimer / GameConfig.FALLING_PLATFORM_TRIGGER_MS;
            if (ratio > 0.6) {
                this._shakeOffset = (Math.random() - 0.5) * 3 * ratio;
            }
            if (this._standTimer >= GameConfig.FALLING_PLATFORM_TRIGGER_MS) {
                this._falling = true;
            }
        } 
        else {
            this._currentFrames = this.idleFrames;
            
            if (this.p.frameCount % 5 === 0) {
                this.frameIndex = (this.frameIndex + 1) % this._currentFrames.length;
            }
            this._standTimer = 0;
            this._shakeOffset = 0;
        }
        this._playerOnTop = false; 
    }

    applyEffect(player) {
        if (this._falling || this._gone) return;
        // Feet-based check — aabbIntersects fails due to skin offset (player lands
        // at obs.y - skin, so no overlap). Match the fix used in IcePlatform/BouncePad.
        const feetY = player.y + player.h;
        const onTop = player.onGround &&
                      feetY >= this.y - 2 && feetY <= this.y + 4 &&
                      player.x + player.w > this.x + 2 &&
                      player.x < this.x + this.w - 2;
        if (onTop) {
            // this._playerOnTop = true;
            // if(this._currentFrames!==this.idleFrames){
            //     this._currentFrames=this.idleFrames;
            //     this.frameIndex=0;
            // }
            //this.frameIndex=0;
            this._playerOnTop = true;
            //this._currentFrames = this.activeFrames;
            //this.frameIndex = 0;
        }
        // else{
        //     if(this._currentFrames!==this.activeFrames){
        //         this._currentFrames=this.activeFrames;
        //         this.frameInde=0;
        //     }
        // }
        //if(this._playerOnTop!==true){
        

        //this._isActivated    = true;
        //this._currentFrames  = this.activeFrames;

        
        //this.frameIndex      = 0; 
        //this._currentFrames= this.activeFrames;
        
        //}
    }

    draw() {
        if (this._gone) return;
        //const p  = this.p;
        // const ox = this._shakeOffset;
        // p.noStroke();

        // // Crack lines (more visible as timer progresses)
        // const crackAlpha = Math.min(255, (this._standTimer / GameConfig.FALLING_PLATFORM_TRIGGER_MS) * 300);

        // // Body — dark brown
        // p.fill(90, 65, 40);
        // p.rect(this.x + ox, this.y, this.w, this.h, 3);

        // // Top highlight
        // p.fill(130, 95, 60);
        // p.rect(this.x + ox, this.y, this.w, this.h * 0.18, 3);

        // // Crack overlay
        // if (crackAlpha > 0) {
        //     p.stroke(50, 30, 15, crackAlpha);
        //     p.strokeWeight(1);
        //     p.line(this.x + ox + this.w * 0.3, this.y + 4, this.x + ox + this.w * 0.4, this.y + this.h - 4);
        //     p.line(this.x + ox + this.w * 0.65, this.y + 4, this.x + ox + this.w * 0.55, this.y + this.h - 4);
        //     p.noStroke();
        // }

        // p.stroke(60, 40, 20);
        // p.strokeWeight(1.5);
        // p.noFill();
        // p.rect(this.x + ox, this.y, this.w, this.h, 3);
        // p.noStroke();

         const p    = this.p;
         const T    = GameConfig.TILE;
         const cx = this.x + T / 2;
         const cy = this.y +T;
         const frames = this._currentFrames;

         if (!frames||frames.length === 0) return;

         const frame = frames[this.frameIndex];
         //const frame = this.framesArr[this.frameIndex];

         p.push();
         p.translate(cx, cy);
         if (frame) {
            p.image(frame, -frame.width/2, -frame.height/2-30);
         }

         this.frameIndex = (this.frameIndex + 1) % frames.length;
         p.pop();
    }

    static drawGhost(p, x, y, sheet) {
        // const T = GameConfig.TILE;
        // p.noStroke();
        // p.fill(90, 65, 40, 130);
        // p.rect(x, y, T, T, 3);
        // p.stroke(130, 95, 60, 160);
        // p.strokeWeight(1.5);
        // p.noFill();
        // p.rect(x, y, T, T, 3);
        // p.noStroke();

        const T = GameConfig.TILE;
        if (!sheet) return;
        const frameW = 32;
        const frameH = 10;
        const cx = x + T / 2;
        const cy = y + T ;

        p.push();
        
        p.translate(cx, cy);
        
        //p.imageMode(p.CENTER);

        //p.image(sheet, x, y, -frameW/2, -frameH/2, 0, 0, frameW, frameH);
        p.image(sheet, -frameW/2, -frameH/2-30, frameW, frameH, 0, 0, frameW, frameH);
        p.pop();

    }
}
