import { Player } from './entities/Player.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { GameStage } from './config/GameStage.js';
import { GameConfig } from './config/GameConfig.js';
import { MAP } from './maps/MapLoader.js';
import { BootState }    from './states/BootState.js';
import { MenuState }    from './states/MenuState.js';
import { MapMenuState } from './states/MapMenuState.js';
import { BuildState }   from './states/BuildState.js';
import { RunState }     from './states/RunState.js';
import { ResultsState } from './states/ResultsState.js';
import { ShopState }    from './states/ShopState.js';
import { Map2State }    from './states/Map2State.js';
import { AnimationConfig } from "./config/AnimationConfig.js";
import { AnimationConfig2 } from "./config/AnimationConfig2.js";
// import images 
import chickenSprite from './assets/sprites/chicken_all_frames2.png';
import bunnySprite from './assets/sprites/bunny_all_frames.png';
import saw from './assets/obstacles/Saw/On (38x38).png';
import fire from './assets/obstacles/Fire/On (16x32).png';
import trampoline from './assets/obstacles/Trampoline/Jump (28x28).png';
import spikedBall from './assets/obstacles/Spiked Ball/Spiked Ball.png';
import cannon from './assets/obstacles/Cannon/cannon (30x18).png';
import fallingPlatform from './assets/obstacles/Falling Platforms/On (32x10).png'; 


/**
 * Root p5 sketch.
 *
 * Manages the canvas, viewport transform, shared session context,
 * and the active state machine. All game logic lives in src/states/.
 *
 * State flow:
 *   BOOT → MENU → MAPMENU → BUILD → RUN → RESULTS → SHOP → BUILD → …
 *                                                    ↑  ESC  ↓
 *                                                  MAPMENU
 */
export const sketch = (p) => {
    const gameWidth  = MAP[0].length * GameConfig.TILE;
    const gameHeight = MAP.length    * GameConfig.TILE;

    let activeState;
    let states;

    let scaleFactor = 1;
    let offsetX     = 0;
    let offsetY     = 0;

    let chickenAllFrames;
    let bunnyAllFrames;
    let sawFrames;
    let fireFrames;
    let trampolineBouncing;
    let spikedBallImg; 
    let cannonImg;
    let fallingPlatformFrames;

    p.preload = function(){
      chickenAllFrames= p.loadImage(chickenSprite);
      bunnyAllFrames = p.loadImage(bunnySprite); 
      sawFrames= p.loadImage(saw); 
      fireFrames = p.loadImage(fire);
      trampolineBouncing = p.loadImage(trampoline); 
      spikedBallImg = p.loadImage(spikedBall);
      cannonImg= p.loadImage(cannon);
      fallingPlatformFrames = p.loadImage(fallingPlatform);
    };

    // ── Setup ──

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        const players      = [
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 0, 
                chickenAllFrames, AnimationConfig),
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 1, 
                bunnyAllFrames, AnimationConfig2),
        ];
        const scoreManager = new ScoreManager(players);

        /**
         * Shared session context.
         * placedObstacles — written by BuildState, read by RunState.
         *                   Lives here so it survives the BUILD → RUN transition.
         * Obstacle tokens are now stored per-player in player.inventory (Map).
         */
        const ctx = {
            p,
            gameWidth,
            gameHeight,
            players,
            scoreManager,
            placedObstacles: [],
            shopHasRun: false, // true after first shop phase; gates strict build-phase token enforcement
        };

        const goTo = (stage) => {
            activeState?.exit();
            activeState = states[stage];
            activeState.enter();
        };

        states = {
            [GameStage.BOOT]:    new BootState(ctx, goTo),
            [GameStage.MENU]:    new MenuState(ctx, goTo),
            [GameStage.MAPMENU]: new MapMenuState(ctx, goTo),
            [GameStage.BUILD]:   new BuildState(ctx, goTo, sawFrames, fireFrames, 
               trampolineBouncing, spikedBallImg, cannonImg, fallingPlatformFrames),
            [GameStage.RUN]:     new RunState(ctx, goTo),
            [GameStage.RESULTS]: new ResultsState(ctx, goTo),
            [GameStage.SHOP]:    new ShopState(ctx, goTo),
            [GameStage.MAP2]:    new Map2State(ctx, goTo),
        };

        goTo(GameStage.BOOT);
    };

    // ── Draw ──

    p.draw = function () {
        p.background(0);

        scaleFactor = p.min(p.width / gameWidth, p.height / gameHeight);
        offsetX     = (p.width  - gameWidth  * scaleFactor) / 2;
        offsetY     = (p.height - gameHeight * scaleFactor) / 2;

        const mx = (p.mouseX - offsetX) / scaleFactor;
        const my = (p.mouseY - offsetY) / scaleFactor;

        p.cursor(p.ARROW);
        p.push();
        p.translate(offsetX, offsetY);
        p.scale(scaleFactor);

        activeState.update(p.deltaTime || 16.6);
        activeState.render(mx, my);

        p.pop();
    };


    // ── Input ──

    p.mousePressed = function () {
        const mx = (p.mouseX - offsetX) / scaleFactor;
        const my = (p.mouseY - offsetY) / scaleFactor;
        activeState.mousePressed(mx, my);
    };

    p.keyPressed = function () {
        activeState.keyPressed();
    };

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };
};
