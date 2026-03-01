import { Player } from "./entities/Player.js";
import { MAP, TILE } from "./utils/tiles.js";
import { RespawnManager } from "./systems/RespawnManager.js";
import { GameStage } from "./config/GameStage.js";
import { MapMenu } from "./systems/MapMenu.js";
import { SplashScreen } from "./systems/SplashScreen.js";

// 【新增 1】引入 GameManager 和 玩家游戏状态
// 请确保路径与你实际的文件结构一致
import { GameManager } from "./systems/GameManager.js"; 
import { PlayerGameState } from "./config/PlayerGameState.js"; 

export const sketch = (p) => {
    let players = [];
    let respawnManager;
    let gameManager; // 【新增 2】声明全局 gameManager
    
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

        // 【新增 3】实例化 GameManager 并传入玩家数组
        gameManager = new GameManager(players);

        // 如果 GameManager 初始化依赖某些默认配置，你可以在 setup 里执行一次 reset
        gameManager.reset(); 

        stage = GameStage.MENU;
        splashScreen = new SplashScreen(p, gameWidth, gameHeight); // 顺便修复了上一步的居中传参
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

        // 【新增 4】更新 GameManager 时间
        gameManager.update(deltaTime);

        // 【修改 5】只有游戏没结束时，才允许玩家移动和更新
        if (!gameManager.isGameOver) {
            for (const player of players) {
                // 如果玩家已经到达终点，也不再更新移动
                if (player.gameState !== PlayerGameState.SUCCESS) {
                    player.update(players, respawnManager);
                    
                    // 【终点检测逻辑】获取玩家中心点所在的格子
                    let tx = p.floor((player.x + player.w / 2) / TILE);
                    let ty = p.floor((player.y + player.h / 2) / TILE);
                    
                    // 假设你在 MAP 数组里用 "F" 代表终点线 (Finish Line)
                    if (MAP[ty] && MAP[ty][tx] === "F") {
                        gameManager.onPlayerReachFinish(player);
                    }
                }
            }
        }

        // 无论游戏是否结束，都渲染玩家
        for (const player of players) {
            player.display();
        }

        // ==========================================
        // 【新增 6】渲染游戏内 UI (倒计时与结算)
        // ==========================================
        
        // 绘制顶部倒计时
        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        // 使用 Math.ceil 让时间向上取整，显示效果更好
        p.text(`Time: ${Math.ceil(gameManager.timeLeft)}s`, gameWidth / 2, 20);

        // 如果游戏结束，绘制结算半透明遮罩
        if (gameManager.isGameOver) {
            p.fill(0, 0, 0, 150); // 半透明黑底
            p.rect(0, 0, gameWidth, gameHeight);
            
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(48);
            p.text("GAME OVER", gameWidth / 2, gameHeight / 2 - 50);

            p.textSize(24);
            if (gameManager.rankings.length > 0) {
                // 有人到达终点
                let winner = gameManager.rankings[0];
                p.text(`Winner: Player ${winner.idx + 1} !`, gameWidth / 2, gameHeight / 2 + 10);
            } else {
                // 时间耗尽，没人过关
                p.text("Time's Up! Everyone Failed.", gameWidth / 2, gameHeight / 2 + 10);
            }
        }

        // 底部提示文字 (位置改到底部防止与计时器重叠)
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
                resetGame(); // 进入地图前重置
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
            mapMenu = new MapMenu(p, gameWidth, gameHeight); // 修复了居中参数
        }
        else if ((stage === GameStage.MAP1 || stage === GameStage.MAP2) && p.keyCode === p.ESCAPE) {
            stage = GameStage.MAPMENU;
        }
    };

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    function resetGame() {
        // 重置复活管理器
        respawnManager.clear();
        
        // 【新增 7】重置 GameManager 时间和排行榜
        if (gameManager) {
            gameManager.reset();
        }

        // 重置所有玩家的状态
        for (const player of players) {
            player.prepareRespawn();
            player.finishRespawn();
            // 重置 GameManager 标记的状态
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
                    // 【新增】绘制终点方块 (例如显示为绿色方块或旗帜)
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