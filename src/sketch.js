import { Player } from './entities/Player.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { GameStage } from './config/GameStage.js';
import { GameConfig } from './config/GameConfig.js';
import { MAP } from './maps/MapLoader.js';

import { BootState }       from './states/BootState.js';
import { MenuState }       from './states/MenuState.js';
import { CharSelectState } from './states/CharSelectState.js';
import { MapMenuState }    from './states/MapMenuState.js';
import { BuildState }      from './states/BuildState.js';
import { RunState }        from './states/RunState.js';
import { ResultsState }    from './states/ResultsState.js';
import { ShopState }       from './states/ShopState.js';
import { Map2State }       from './states/Map2State.js';

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

    // Character sprite sheets
    let chickenSheet;
    let bunnySheet;
    let duckSheet;
    let polarSheet;

    // Obstacle sprite sheets — all 13
    let obsSaw;
    let obsFire;
    let obsTrampoline;
    let obsSpikedBall;
    let obsCannon;
    let obsFallingPlatform;
    let obsPlatform;
    let obsMovingPlatform;
    let obsIcePlatform;
    let obsIceBlock;
    let obsSpikePlatform;
    let obsTeleporter;
    let obsWindZone;

    // ── Preload ────────────────────────────────────────────────────────────

    p.preload = function () {
        chickenSheet = p.loadImage('src/assets/sprites/chicken_all_frames2.png');
        bunnySheet   = p.loadImage('src/assets/sprites/bunny_all_frames.png');
        duckSheet    = p.loadImage('src/assets/sprites/duck_all_frames.png');
        polarSheet   = p.loadImage('src/assets/sprites/polar_all_frames.png');

        obsSaw             = p.loadImage('src/assets/obstacles/Saw/On (38x38).png');
        obsFire            = p.loadImage('src/assets/obstacles/Fire/On (16x32).png');
        obsTrampoline      = p.loadImage('src/assets/obstacles/Trampoline/Jump (28x28).png');
        obsSpikedBall      = p.loadImage('src/assets/obstacles/Spiked Ball/Spiked Ball.png');
        obsCannon          = p.loadImage('src/assets/obstacles/Cannon/cannon (30x18).png');
        obsFallingPlatform = p.loadImage('src/assets/obstacles/Falling Platforms/On (32x10).png');
        obsPlatform        = p.loadImage('src/assets/obstacles/Platforms/platform (40x40).png');
        obsMovingPlatform  = p.loadImage('src/assets/obstacles/Moving Platforms/Brown On (32x8).png');
        obsIcePlatform     = p.loadImage('src/assets/obstacles/Ice Platforms/ice platform (40x40).png');
        obsIceBlock        = p.loadImage('src/assets/obstacles/Ice Block/ice block (40x40).png');
        obsSpikePlatform   = p.loadImage('src/assets/obstacles/Spike Platforms/spike platform (40x40).png');
        obsTeleporter      = p.loadImage('src/assets/obstacles/Teleporter/teleporter (40x40).png');
        obsWindZone        = p.loadImage('src/assets/obstacles/Wind Zone/wind zone (32x32).png');
    };

    // ── Setup ──────────────────────────────────────────────────────────────

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        // Players created without a sprite sheet — CharSelectState assigns one
        const players = [
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 0),
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 1),
        ];
        const scoreManager = new ScoreManager(players);

        /**
         * Shared session context.
         * sprites        — all loaded sprite sheets; CharSelectState reads these.
         * placedObstacles — written by BuildState, read by RunState.
         * shopHasRun     — true after first shop phase.
         */
        const ctx = {
            p,
            gameWidth,
            gameHeight,
            players,
            scoreManager,
            sprites: {
                chicken: chickenSheet,
                bunny:   bunnySheet,
                duck:    duckSheet,
                polar:   polarSheet,
            },
            obstacleSprites: {
                saw:             obsSaw,
                fire:            obsFire,
                trampoline:      obsTrampoline,
                spikedBall:      obsSpikedBall,
                cannon:          obsCannon,
                fallingPlatform: obsFallingPlatform,
                platform:        obsPlatform,
                movingPlatform:  obsMovingPlatform,
                icePlatform:     obsIcePlatform,
                iceBlock:        obsIceBlock,
                spikePlatform:   obsSpikePlatform,
                teleporter:      obsTeleporter,
                windZone:        obsWindZone,
            },
            placedObstacles: [],
            shopHasRun: false,
        };

        const goTo = (stage) => {
            activeState?.exit();
            activeState = states[stage];
            activeState.enter();
        };

        states = {
            [GameStage.BOOT]:        new BootState(ctx, goTo),
            [GameStage.MENU]:        new MenuState(ctx, goTo),
            [GameStage.CHAR_SELECT]: new CharSelectState(ctx, goTo),
            [GameStage.MAPMENU]:     new MapMenuState(ctx, goTo),
            [GameStage.BUILD]:       new BuildState(ctx, goTo),
            [GameStage.RUN]:         new RunState(ctx, goTo),
            [GameStage.RESULTS]:     new ResultsState(ctx, goTo),
            [GameStage.SHOP]:        new ShopState(ctx, goTo),
            [GameStage.MAP2]:        new Map2State(ctx, goTo),
        };

        goTo(GameStage.BOOT);
    };

    // ── Draw ───────────────────────────────────────────────────────────────

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

    // ── Input ──────────────────────────────────────────────────────────────

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
