//is this correct?
import {HandleInput} from "../systems/HandleInput.js";

export class Player{
  
  constructor(ground, input){
      //Placeholder player object 
      this.input=input; 
      this.side=50;
      this.colour=color(255, 192,203);
      //
      this.posX=0;
      this.posY=ground-this.side;
      this.speedX=10; //width%speedX needs to be 0
      this.speedY=0;
      this.gravity=0.8;
      this.ground=ground;
      this.defaultJumpSpeed=12;
   }
  
  //also provisional
  drawPlayer(){
      fill(this.colour);
      noStroke();
      square(this.posX, this.posY, this.side);
   }
  
  //move 
   movePlayer(){ 
      let keys=this.input.getLast2Pressed();
      for(let k of keys){
         if (k==='a'){
            if(this.posX<=0){
               this.posX-=0;
            }
            else {this.posX-=this.speedX;
            }
         }
         else if(k==='d'){
            if (this.posX>=width-this.side){
               this.posX+=0;
            }
            else{this.posX+=this.speedX;
            }
         }
         else{
            this.posX+=0;
            this.posY+=0;
         }
         
      }

   }
  
   jumpUp(){
      let keys=this.input.getLast2Pressed();
      for(let k of keys){
         if (k==='w' && this.posY>=this.ground){
         if(this.posY<=0){
            this.posY-=0;
         }
         else{
            this.speedY=-this.defaultJumpSpeed;
            this.speedY-=this.gravity;
            this.posY+=this.speedY;
            
            }
         }
      }
   }
  
   comeDown(){
      this.speedY += this.gravity;  
      this.posY += this.speedY;    

      if(this.posY >= this.ground){
         this.posY = this.ground;
         this.speedY = 0;
      }
   }
}
