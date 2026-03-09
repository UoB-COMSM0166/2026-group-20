import { Player } from "./entities/Player.js";
import { RespawnManager } from "./systems/RespawnManager.js";
import { GameStage } from "./config/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";
import { TimeManager } from "./systems/TimeManager.js"; 
import { PlayerGameState } from "./config/PlayerGameState.js"; 
import { GameConfig } from './config/GameConfig.js';
import { DrawPlayer } from "./utils/DrawPlayer.js";

export const sketch = (p) => {
    let players = [];
    let respawnManager;
    let timeManager;
    
    let gameWidth;
    let gameHeight;

    let stage;
    let splashScreen;
    let mapMenu;

    let scaleFactor = 1;
    let offsetX = 0;
    let offsetY = 0;

    let mapData;
    let tilesetImage;
    let MAP = [];

    p.preload = function () {
        mapData = p.loadJSON("src/assets/maps/map.JSON");
        tilesetImage = p.loadImage("src/assets/images/tiles/Tileset.png");
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        GameConfig.TILE = mapData.tilewidth;
        gameWidth = mapData.width * mapData.tilewidth;
        gameHeight = mapData.height * mapData.tileheight;

        generateCollisionMap();

        // Parsing the object layer
        for (let layer of mapData.layers) {
            if (layer.name === 'Object_Layer_1') {
                for (let obj of layer.objects) {
                    if (obj.name === 'startPoint') {
                        players = [
                            new Player(p, obj.x, obj.y, 0),
                            new Player(p, obj.x, obj.y, 1)
                        ]
                    } else if (obj.name === 'endPoint') {
                        // calulate tile coordinates for the end point if needed
                        let startCol = p.floor(obj.x / mapData.tilewidth);
                        let startRow = p.floor(obj.y / mapData.tileheight);
                        let endCol = p.floor((obj.x + obj.width) / mapData.tilewidth);
                        let endRow = p.floor((obj.y + obj.height) / mapData.tileheight);

                        for (let r = startRow; r <= endRow; r++) {
                            for (let c = startCol; c <= endCol; c++) {
                                if (MAP[r] && MAP[r][c] !== undefined) {
                                    MAP[r][c] = "F"; 
                                }
                            }
                        }
                    }
                }
            }
        }

        respawnManager = new RespawnManager();
        timeManager = new TimeManager(players);

        timeManager.reset(); 

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
        
        renderTiledMap(p);

        let deltaTime = p.deltaTime || 16.6;
        respawnManager.update(deltaTime);

        timeManager.update(deltaTime);

        if (!timeManager.isGameOver) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.SUCCESS) {
                    player.update(players, respawnManager, MAP);

                    let tx = p.floor((player.x + player.w / 2) / GameConfig.TILE);
                    let ty = p.floor((player.y + player.h / 2) / GameConfig.TILE);

                    if (MAP[ty] && MAP[ty][tx] === "F") {
                        timeManager.onPlayerReachFinish(player);
                    }
                }
            }
        }

        for (const player of players) {
            DrawPlayer(player);
        }

        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(timeManager.timeLeft)}s`, gameWidth / 2, 20);

        if (timeManager.isGameOver) {
            p.fill(0, 0, 0, 150); 
            p.rect(0, 0, gameWidth, gameHeight);
            
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(48);
            p.text("GAME OVER", gameWidth / 2, gameHeight / 2 - 50);

            p.textSize(24);
            if (timeManager.rankings.length > 0) {
                let winner = timeManager.rankings[0];
                p.text(`Winner: Player ${winner.playerNo + 1} !`, gameWidth / 2, gameHeight / 2 + 10);
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
        
        if (timeManager) {
            timeManager.reset();
        }

        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            player.setGameState(PlayerGameState.PLAYING); 
        }
    }

    function renderTiledMap(p) {
        if (!mapData || !tilesetImage) return;

        let tileW = mapData.tilewidth;
        let tileH = mapData.tileheight;

        let tilesetCols = tilesetImage.width / tileW;

        for (let layer of mapData.layers) {
            // We only render tile layers that are not the collision layer
            if (layer.type === 'tilelayer' && layer.name !== 'Collision_Layer') {
                let data = layer.data;
                let cols = layer.width; 

                for (let i = 0; i < data.length; i++) {
                    let gid = data[i];

                    if (gid !== 0) { 

                        let col = i % cols;
                        let row = p.floor(i / cols);
                        let destX = col * tileW;
                        let destY = row * tileH;

                        let localId = gid - 1; 
                        let srcX = (localId % tilesetCols) * tileW;
                        let srcY = p.floor(localId / tilesetCols) * tileH;

                        p.image(
                            tilesetImage, 
                            destX, destY, tileW, tileH, 
                            srcX, srcY, tileW, tileH
                        );
                    }
                }
            }
        }
    }

    function generateCollisionMap() {
        MAP = []; 
        let cols = mapData.width;
        let rows = mapData.height;

        for (let y = 0; y < rows; y++) {
            let rowArray = [];
            for (let x = 0; x < cols; x++) {
                rowArray.push("."); 
            }
            MAP.push(rowArray);
        }

        for (let layer of mapData.layers) {
            if (layer.name === 'Collision_Layer') {
                for (let i = 0; i < layer.data.length; i++) {
                    let gid = layer.data[i];

                    if (gid !== 0) {
                        let x = i % cols;
                        let y = p.floor(i / cols);
                        MAP[y][x] = "#";
                    }
                }
            }
        }
    }
};