/**
 * Player class 
 * @class
 * @description create an instance of a player 
 */
import { PlayerMovementState } from "../states/PlayerMovementState";

export class Player{
  /** 
  * @param {*} p - The p5.js instance 
  * @param {number} ground - The platform where the player stands on 
  * @param {string[]} input - A list of valid keypresses (e.g. ['w', 'a', 'd'])
  */
  constructor(p, ground, input){
      //Placeholder player object 
      this.input = input;
      this.side=50;
      this.colour=p.color(255, 192,203);
      //
      this.posX=0;
      this.posY=ground-this.side;
      this.speedX=10; //width%speedX needs to be 0
      this.speedY=0;
      this.gravity=0.8;
      this.ground=ground;
      this.defaultJumpSpeed=12;
      this.state=PlayerMovementState.STATIC;
   }
  
  //also provisional
  /**
   * Draws the player character to the canvas
   * @param {*} p - The p5.js instance   
   */
  drawPlayer(p){
      p.fill(this.colour);
      p.noStroke();
      p.square(this.posX, this.posY, this.side);
   }
   
   /**
    * Move right if the 'a' key is pressed 
    * Move left if the 'd' key is pressed 
    * 
    * @param {*} p  - The p5.js instance 
    * @param {*} keys - A list of currently pressed keys
    */
   movePlayer(p, keys){ 
      if (keys.includes("a") && this.posX>0){
         this.posX-=this.speedX;
         this.state=PlayerMovementState.MOVE;
         console.log(this.state);
      }
      if (keys.includes("d") && this.posX<p.width-this.side){
         this.posX+=this.speedX;
         this.state=PlayerMovementState.MOVE;
         console.log(this.state);
      }
   }
   /**
    * Jump if the 'w' key is pressed and the player is grounded
    * @param {string[]} keys - A list of currently pressed keys
    */
   jumpUp(keys){
      if (keys.includes("w") && this.posY>=this.ground){
         this.speedY= -this.defaultJumpSpeed;
         this.speedY-=this.gravity;
         this.posY+=this.speedY;
         this.state = PlayerMovementState.JUMP;
         console.log(this.state);
      }
   }
   /**
    * Apply gravity for the player to come down 
    */
   comeDown(){
      this.speedY += this.gravity;  
      this.posY += this.speedY;    

      if(this.posY >= this.ground){
         this.posY = this.ground;
         this.speedY = 0;
         if(this.state !== PlayerMovementState.MOVE){
            this.state = PlayerMovementState.STATIC; 
            //console.log(this.state);
         }
      }
   }
   /**
    * Update player's physics, input state and renders them to the canvas
    * Runs once per frame within the main draw loop
    * 
    * @param {*} p  - The p5.js instance 
    */
   update(p){
      const keys=this.input.getLast2Pressed();
      this.movePlayer(p,keys);
      this.jumpUp(keys);
      this.comeDown(); 
      this.drawPlayer(p); 
   }
}
