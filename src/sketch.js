import { GameStage } from "./states/GameStage.js";
import { SplashScreen } from "./systems/SplashScreen.js";

export const sketch = (p) => {
  let stage;
  let splashScreen; 

  p.setup = function(){
    p.createCanvas(400, 400);
    stage = GameStage.MENU; 
    splashScreen = new SplashScreen(p, stage);
  }

  p.draw= function(){
    p.background(220);
    if (stage == GameStage.MENU){
      splashScreen.render(p); 
    }
  }

  p.mousePressed= function(){
    if (splashScreen.button1.isHovered(p)) {
      stage = GameStage.OPTION1; 
      console.log("option 1 clicked");
    }

    if (splashScreen.button2.isHovered(p)) {
      stage = GameStage.OPTION2; 
      console.log("option 2 clicked");
    }
  }


  p.keyPressed = function(){
    // press space to start 
    if (p.key === " "){
      stage = GameStage.MAP; 
      console.log("space pressed"); 
    } 
  }

}
