import { Player } from "./entities/Player.js";
import { HandleInput } from "./systems/HandleInput.js";

export const sketch = (p) => {
  let playerInput;
  let player;

  p.setup = () =>{
    p.createCanvas(400, 400);
    playerInput = new HandleInput(['w', 'a', 'd']);
    player = new Player(p, p.height / 2, playerInput);

    //window.addEventListener("blur", ()=>playerInput.pressedKeys=[]);
    //player=new Player();
  }

  p.draw = () => {
    p.background(220);
  
    player.movePlayer(p);
    player.jumpUp(p);
    player.comeDown(p);
    player.drawPlayer(p);
  }

  p.keyPressed = (event) => {
    playerInput.handleKeyPressed(event.key);
  }

  p.keyReleased = (event) => {
    playerInput.handleKeyReleased(event.key);
  }

}

