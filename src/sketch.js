import { Player } from "./entities/Player.js";
import { Door } from "./entities/Door.js";
import { InteractZone } from "./entities/InteractZone.js";

const GRAVITY = 0.65;

export const sketch = (p) => {
  let p1, p2;
  let groundY;
  let buttonObj, doorObj;

  p.setup = () => {
    p.createCanvas(900, 450);
    groundY = p.height - 70;

    p1 = new Player(p, 180, groundY - 40, {
      left: 65, right: 68, up: 87, down: 83, interact: 69
    }, p.color(255, 120, 120), "P1");

    p2 = new Player(p, 620, groundY - 40, {
      left: p.LEFT_ARROW, right: p.RIGHT_ARROW,
      up: p.UP_ARROW, down: p.DOWN_ARROW, interact: 16
    }, p.color(120, 160, 255), "P2");

    buttonObj = new InteractZone(p, 430, groundY - 18, 90, 18, "BUTTON");
    doorObj   = new Door(p, 440, groundY - 120, 40, 120);
  };

  p.draw = () => {
    p.background(20);
    drawGround();

    p1.update(groundY, GRAVITY);
    p2.update(groundY, GRAVITY);

    doorObj.collideWith(p1);
    doorObj.collideWith(p2);

    buttonObj.display();
    doorObj.display();
    p1.display();
    p2.display();

    drawHUD();
  };

  p.keyPressed = () => {
    if (p.keyCode === p1.controls.interact) tryInteract(p1);
    if (p.keyCode === p2.controls.interact) tryInteract(p2);
  };

  function tryInteract(player) {
    if (buttonObj.isPlayerInside(player)) {
      doorObj.isOpen = !doorObj.isOpen;
    }
  }

  function drawGround() {
    p.noStroke();
    p.fill(70);
    p.rect(0, groundY, p.width, p.height - groundY);
  }

  function drawHUD() {
    p.fill(230);
    p.textSize(14);
    p.textAlign(p.LEFT, p.TOP);
    p.text("Controls:", 12, 10);
    p.text("P1: W/A/S/D + E (interact)", 12, 28);
    p.text("P2: Arrows + Shift (interact)", 12, 46);
    p.text("Stand near BUTTON and press interact to toggle the DOOR.", 12, 70);
  }
};
