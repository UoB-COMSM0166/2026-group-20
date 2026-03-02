import { Player } from "./entities/Player.js";
import { MAP, TILE } from "./utils/tiles.js";
import { RespawnManager } from "./systems/RespawnManager.js";
import { GameStage } from "./config/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";

import { GameManager } from "./systems/GameManager.js"; 
import { PlayerGameState } from "./config/PlayerGameState.js"; 

export const sketch = (p) => {
    let players = [];
    let respawnManager;
    let gameManager;
    
    let gameWidth;
    let gameHeight;

    let stage;
    let splashScreen;
    let mapMenu;

    let scaleFactor = 1;
    let offsetX = 0;
    let offsetY = 0;

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        gameWidth = MAP[0].length * TILE;
        gameHeight = MAP.length * TILE;

        respawnManager = new RespawnManager();
        players = [
            new Player(p, 11 * TILE, 7 * TILE - 40, 0),
            new Player(p, 13 * TILE, 7 * TILE - 40, 1),
        ];

        gameManager = new GameManager(players);

        gameManager.reset(); 

        stage = GameStage.MENU;
        splashScreen = new SplashScreen(p, gameWidth, gameHeight);
    };

    p.draw = function () {
        p.background(0);

        scaleFactor = p.min(p.width / gameWidth, p.height / gameHeight);
        offsetX = (p.width - gameWidth * scaleFactor) / 2;
        offsetY = (p.height - gameHeight * scaleFactor) / 2;

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
            if (!mapMenu) mapMenu = new MapMenu(p, gameWidth, gameHeight);
            mapMenu.render(p, realMouseX, realMouseY);
        }
        else if (stage === GameStage.MAP1) {
            playMap1Loop(p);
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

    function playMap1Loop(p) {
        p.background(25);
        drawMap();

        let deltaTime = p.deltaTime || 16.6;
        respawnManager.update(deltaTime);

        gameManager.update(deltaTime);

        if (!gameManager.isGameOver) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.SUCCESS) {
                    player.update(players, respawnManager);

                    let tx = p.floor((player.x + player.w / 2) / TILE);
                    let ty = p.floor((player.y + player.h / 2) / TILE);

                    if (MAP[ty] && MAP[ty][tx] === "F") {
                        gameManager.onPlayerReachFinish(player);
                    }
                }
            }
        }

        for (const player of players) {
            player.display();
        }

        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(gameManager.timeLeft)}s`, gameWidth / 2, 20);

        if (gameManager.isGameOver) {
            p.fill(0, 0, 0, 150); 
            p.rect(0, 0, gameWidth, gameHeight);
            
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(48);
            p.text("GAME OVER", gameWidth / 2, gameHeight / 2 - 50);

            p.textSize(24);
            if (gameManager.rankings.length > 0) {
                let winner = gameManager.rankings[0];
                p.text(`Winner: Player ${winner.idx + 1} !`, gameWidth / 2, gameHeight / 2 + 10);
            } else {
                p.text("Time's Up! Everyone Failed.", gameWidth / 2, gameHeight / 2 + 10);
            }
        }

        p.fill(255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text("P1: A/D + W   P2: ←/→ + ↑   (Press ESC to Return)", 10, gameHeight - 10);
    }

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
            mapMenu = new MapMenu(p, gameWidth, gameHeight); 
        }
        else if ((stage === GameStage.MAP1 || stage === GameStage.MAP2) && p.keyCode === p.ESCAPE) {
            stage = GameStage.MAPMENU;
        }
    };

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    function resetGame() {
        respawnManager.clear();
        
        if (gameManager) {
            gameManager.reset();
        }

        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING); 
        }
    }

    function drawMap() {
        p.noStroke();
        for (let y = 0; y < MAP.length; y++) {
            for (let x = 0; x < MAP[0].length; x++) {
                const c = MAP[y][x];
                if (c === "#") {
                    p.fill(80);
                    p.rect(x * TILE, y * TILE, TILE, TILE);
                } else if (c === "S") {
                    p.fill(220, 80, 80);
                    const px = x * TILE, py = y * TILE;
                    p.triangle(px, py + TILE, px + TILE / 2, py + 6, px + TILE, py + TILE);
                } else if (c === "F") {
                    p.fill(100, 220, 100);
                    p.rect(x * TILE, y * TILE, TILE, TILE);
                    p.fill(255);
                    p.textAlign(p.CENTER, p.CENTER);
                    p.textSize(12);
                    p.text("GOAL", x * TILE + TILE/2, y * TILE + TILE/2);
                }
            }
        }
    }
};