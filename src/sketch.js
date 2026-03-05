import { Player } from "./entities/Player.js";
import { RespawnManager } from "./systems/RespawnManager.js";
import { GameStage } from "./config/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";

import { TimeManager } from "./systems/TimeManager.js"; 
import { PlayerGameState } from "./config/PlayerGameState.js"; 
import { GameConfig, TILE } from './config/GameConfig.js';
import { playMap1Loop } from "./systems/playMap1Loop.js";

export const sketch = (p) => {
    let players = [];
    let respawnManager;
    let timeManager;

    let stage;
    let splashScreen;
    let mapMenu;

    let scaleFactor = 1;
    let offsetX = 0;
    let offsetY = 0;

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        respawnManager = new RespawnManager();
        players = [
            new Player(p, 11 * TILE,( 7 * TILE) - 40, 0),
            new Player(p, 13 * TILE, (7 * TILE) - 40, 1),
        ];

        timeManager = new TimeManager(players);

        timeManager.reset(); 

        stage = GameStage.MENU;
        splashScreen = new SplashScreen(p, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);
    };

    p.draw = function () {
        p.background(0);

        scaleFactor = p.min(p.width / GameConfig.GAME_WIDTH, p.height / GameConfig.GAME_HEIGHT);
        offsetX = (p.width - GameConfig.GAME_WIDTH * scaleFactor) / 2;
        offsetY = (p.height - GameConfig.GAME_HEIGHT * scaleFactor) / 2;

        p.cursor(p.ARROW);

        let realMouseX = (p.mouseX - offsetX) / scaleFactor;
        let realMouseY = (p.mouseY - offsetY) / scaleFactor;

        p.push();
        p.translate(offsetX, offsetY);
        p.scale(scaleFactor);

        if (stage === GameStage.MENU) {
            p.background(30);
            splashScreen.render(p, realMouseX, realMouseY);
        }
        else if (stage === GameStage.MAPMENU) {
            p.background(40);
            if (!mapMenu) mapMenu = new MapMenu(p, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);
            mapMenu.render(p, realMouseX, realMouseY);
        }
        else if (stage === GameStage.MAP1) {
            playMap1Loop(p, respawnManager, timeManager, players, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);
        }
        else if (stage === GameStage.MAP2) {
            p.background(50);
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(24);
            p.text("Map 2 is coming soon...", gameWidth / 2, gameHeight / 2);
            p.textSize(14);
            p.text("Press ESC to return to Map Menu", gameWidth / 2, gameHeight / 2 + 40);
        }

        p.pop();
    };

    p.mousePressed = function () {
        let realMouseX = (p.mouseX - offsetX) / scaleFactor;
        let realMouseY = (p.mouseY - offsetY) / scaleFactor;

        if (stage === GameStage.MENU) {
            if (splashScreen.button1 && splashScreen.button1.isHovered(realMouseX, realMouseY)) {
                console.log("Splash Button 1 Clicked");
            }
        }
        else if (stage === GameStage.MAPMENU) {
            if (mapMenu.buttonReturn.isHovered(realMouseX, realMouseY)) {
                stage = GameStage.MENU;
            }
            else if (mapMenu.buttonMap1.isHovered(realMouseX, realMouseY)) {
                resetGame(); 
                stage = GameStage.MAP1;
            }
            else if (mapMenu.buttonMap2.isHovered(realMouseX, realMouseY)) {
                stage = GameStage.MAP2;
            }
        }
    };

    p.keyPressed = function () {
        if (stage === GameStage.MENU && p.key === " ") {
            stage = GameStage.MAPMENU;
            mapMenu = new MapMenu(p, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT); 
        }
        // else if ((stage === GameStage.MAP1 || stage === GameStage.MAP2) && p.keyCode === p.ESCAPE) {
        //     stage = GameStage.MAPMENU;
        // }
    };

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    function resetGame() {
        respawnManager.clear();
        
        if (timeManager) {
            timeManager.reset();
        }

        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING); 
        }
    }

};