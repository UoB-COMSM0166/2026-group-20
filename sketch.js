import {Player} from "./src/entities/Player.js";
import {HandleInput} from "./src/systems/HandleInput.js";

function setup() {
  createCanvas(400, 400);
  playerInput=new HandleInput(['w', 'a', 'd']);  
  player=new Player();
  //window.addEventListener("blur", ()=>playerInput.pressedKeys=[]);
  //player=new Player();
}

function draw() {
  background(220);
  player.movePlayer();
  player.jumpUp();
  player.comeDown();
  player.drawPlayer();
}