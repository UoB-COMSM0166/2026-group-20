import { PlayerMovementState } from "../states/PlayerMovementState";

export class Player{
  
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
  drawPlayer(p){
      p.fill(this.colour);
      p.noStroke();
      p.square(this.posX, this.posY, this.side);
   }
   
   //move 
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

   jumpUp(keys){
      if (keys.includes("w") && this.posY>=this.ground){
         this.speedY= -this.defaultJumpSpeed;
         this.speedY-=this.gravity;
         this.posY+=this.speedY;
         this.state = PlayerMovementState.JUMP;
         console.log(this.state);
      }
   }
  
   comeDown(){
      this.speedY += this.gravity;  
      this.posY += this.speedY;    

      if(this.posY >= this.ground){
         this.posY = this.ground;
         this.speedY = 0;
         if(this.state !== PlayerMovementState.Move){
            this.state = PlayerMovementState.STATIC; 
            //console.log(this.state);
         }
      }
   }
   update(p){
      const keys=this.input.getLast2Pressed();
      this.movePlayer(p,keys);
      this.jumpUp(keys);
      this.comeDown(); 
      this.drawPlayer(p); 
   }
}
