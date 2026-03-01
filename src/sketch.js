import { Player } from './entities/Player.js';
import { RespawnManager } from './systems/RespawnManager.js';
import { PlayerState } from './config/PlayerState.js';
import { GameConfig } from './config/GameConfig.js';
import { GameManager } from './systems/GameManager.js';

let gameManager;
let allPlayers = [];

window.setup = function () {
    createCanvas(windowWidth, windowHeight);
    gameManager = new GameManager(allPlayers);

    // Create players
    const p1Controls = { left: 65, right: 68, jump: 87 };
    let player1 = new Player(1, 50, 500, p1Controls);
    const p2Controls = { left: 37, right: 39, jump: 38 };
    let player2 = new Player(2, 100, 500, p2Controls);
    allPlayers.push(player1, player2);
}

window.draw = function () {
    background(0);
    gameManager.update(deltaTime);

    // calculate scale factor
    let scaleFactor = min(windowWidth / GameConfig.GAME_WIDTH, windowHeight / GameConfig.GAME_HEIGHT);
    // calculate offset to center the game
    let scaledWidth = GameConfig.GAME_WIDTH * scaleFactor;
    let scaledHeight = GameConfig.GAME_HEIGHT * scaleFactor;
    let offsetX = (windowWidth - scaledWidth) / 2;
    let offsetY = (windowHeight - scaledHeight) / 2;

    push();
    fill(50, 50, 80); 
    noStroke();
    rect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    fill(255, 0, 0);
    rect(100, 100, 100, 100);
    pop();
}

window.windowResized = function () {
    // rescale to fill the screen on window resize
    resizeCanvas(windowWidth, windowHeight);
}

