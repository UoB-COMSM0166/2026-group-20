import { GameStage } from "./states/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";


export const sketch = (p) => {
  let stage;
  let splashScreen; 
  let mapMenu; 

  p.setup = function(){
    p.createCanvas(p.windowWidth, p.windowHeight);
    stage = GameStage.MENU; 
    splashScreen = new SplashScreen(p);
  }

  p.draw= function(){
    p.background(220);

    if (stage == GameStage.MENU){
      splashScreen.render(p); 
    }

    if (stage == GameStage.MAPMENU){
      mapMenu.render(p); 
    }
  }

  p.mousePressed= function(){
    // if (splashScreen.button1.isHovered(p)) {
    //   stage = GameStage.OPTION1; 
    //   console.log("option 1 clicked");
    // }

    // if (splashScreen.button2.isHovered(p)) {
    //   stage = GameStage.OPTION2; 
    //   console.log("option 2 clicked");
    // }

     if (mapMenu.buttonReturn.isHovered(p)) {
      stage = GameStage.MENU; 
      console.log("Return clicked");
    }
  }


  p.keyPressed = function(){
    // press space to start 
    if (p.key === " "){
      stage = GameStage.MAPMENU; 
      mapMenu = new MapMenu(p); 
      console.log("space pressed"); 
    } 
  }
}
