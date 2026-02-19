import { Player } from './entities/Player.js';
import { RespawnController } from './systems/RespawnController.js';
import { PlayerState } from './config/playerState.js';
import { GameConfig } from './config/gameConfig.js';

window.setup = function () {
    createCanvas(windowWidth, windowHeight);
}

window.draw = function () {
    background(0);

    // calculate scale factor
    let scaleFactor = min(windowWidth / GameConfig.GAME_WIDTH, windowHeight / GameConfig.GAME_HEIGHT);
    // calculate offset to center the game
    let scaledWidth = GameConfig.GAME_WIDTH * scaleFactor;
    let scaledHeight = GameConfig.GAME_HEIGHT * scaleFactor;
    let offsetX = (windowWidth - scaledWidth) / 2;
    let offsetY = (windowHeight - scaledHeight) / 2;

    push();
    fill(50, 50, 80); // 深蓝色
    noStroke();
    rect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);

    // 测试画一个红色方块
    fill(255, 0, 0);
    rect(100, 100, 100, 100);
    pop();
}

window.windowResized = function () {
    // rescale to fill the screen on window resize
    resizeCanvas(windowWidth, windowHeight);
}

