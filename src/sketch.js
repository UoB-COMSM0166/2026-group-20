import { GameStage } from "./states/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";
import { Player } from "./entities/Player.js";
import { HandleInput } from "./systems/HandleInput.js";

export const sketch = (p) => {
  // === Variable Declarations ===
  let stage;
  let splashScreen; 
  let mapMenu; 
  let playerInput;
  let player;

  p.setup = () => {
    // Setup responsive canvas size
    p.createCanvas(p.windowWidth, p.windowHeight);
    
    // Initialize UI and State Machine
    stage = GameStage.MENU; 
    splashScreen = new SplashScreen(p);

    // Initialize Player and Input Control
    playerInput = new HandleInput(['w', 'a', 'd']);
    player = new Player(p, p.height / 2, playerInput);
  };

  p.draw = () => {
    p.background(220);

    // === State Machine: Render specific views based on current stage ===
    if (stage === GameStage.MENU) {
      splashScreen.render(p); 
    } 
    else if (stage === GameStage.MAPMENU) {
      // Ensure mapMenu is initialized before rendering
      if (mapMenu) {
        mapMenu.render(p); 
      }
      
      // Update and render the player 
      // NOTE: Consider moving these to a GameStage.PLAYING state in the future
      player.movePlayer(p);
      player.jumpUp(p);
      player.comeDown(p);
      player.drawPlayer(p);
    }
  };

  p.mousePressed = () => {
    // Only detect 'Return' button if we are currently in MAPMENU 
    // and mapMenu object has been fully initialized
    if (stage === GameStage.MAPMENU && mapMenu && mapMenu.buttonReturn.isHovered(p)) {
      stage = GameStage.MENU; 
      console.log("Return clicked");
    }
  };

  p.keyPressed = (event) => {
    // Menu state transition (Press SPACE to start)
    if (p.key === " " && stage === GameStage.MENU) {
      stage = GameStage.MAPMENU; 
      mapMenu = new MapMenu(p); 
      console.log("space pressed"); 
    } 

    // Handle player movement inputs
    // We pass the native event.key to match your HandleInput logic
    if (playerInput) {
      playerInput.handleKeyPressed(event.key);
    }
  };

  p.keyReleased = (event) => {
    // Handle player input release
    if (playerInput) {
      playerInput.handleKeyReleased(event.key);
    }
  };
};