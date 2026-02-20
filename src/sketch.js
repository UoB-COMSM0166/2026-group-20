

import {Player} from "./entities/Player.js";
import {HandleInput} from "./systems/HandleInput.js";

let playerInput; 
let player; 

window.setup = function () {
  createCanvas(400, 400);
  playerInput=new HandleInput(['w', 'a', 'd']);  
  player=new Player(width/2, playerInput);
}

window.draw = function () {
  background(220);
  player.movePlayer();
  player.drawPlayer();
  player.jumpUp();
  player.comeDown();
}

window.keyPressed = function(event) {
  playerInput.handleKeyPressed(event.key);
}

window.keyReleased = function(event) {
  playerInput.handleKeyReleased(event.key);
}