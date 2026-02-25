import { Player } from "./entities/Player.js";
import { HandleInput } from "./systems/HandleInput.js";

export const sketch = (p) => {
  let playerInput;
  let player;

  p.setup = () =>{
    p.createCanvas(p.windowWidth, p.windowHeight);
    playerInput = new HandleInput(['w', 'a', 'd']);
    player = new Player(p, p.windowHeight/2, playerInput);
  }

  p.draw = () => {
    p.background(220);
    player.update(p); 
  }

  p.keyPressed = (event) => {
    playerInput.handleKeyPressed(event.key);
  }

  p.keyReleased = (event) => {
    playerInput.handleKeyReleased(event.key);
  }
}

