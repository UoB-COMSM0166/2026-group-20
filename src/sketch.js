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
<<<<<<< HEAD
=======
import { ShopState }    from './states/ShopState.js';
>>>>>>> origin/feature/shop
import { Map2State }    from './states/Map2State.js';

/**
 * Root p5 sketch.
 *
 * Manages the canvas, viewport transform, shared session context,
 * and the active state machine. All game logic lives in src/states/.
 *
 * State flow:
<<<<<<< HEAD
 *   BOOT → MENU → MAPMENU → BUILD → RUN → RESULTS
 *                                  ↑____________| (ENTER plays again)
=======
 *   BOOT → MENU → MAPMENU → BUILD → RUN → RESULTS → SHOP → BUILD → …
 *                                                    ↑  ESC  ↓
 *                                                  MAPMENU
>>>>>>> origin/feature/shop
 */
export const sketch = (p) => {
    const gameWidth  = MAP[0].length * GameConfig.TILE;
    const gameHeight = MAP.length    * GameConfig.TILE;

    let activeState;
    let states;

    let scaleFactor = 1;
    let offsetX     = 0;
    let offsetY     = 0;

    // ── Setup ──────────────────────────────────────────────────────────────

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        const players      = [
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 0),
            new Player(p, 12 * GameConfig.TILE, 8 * GameConfig.TILE - GameConfig.TILE, 1),
        ];
        const scoreManager = new ScoreManager(players);

        /**
         * Shared session context.
         * placedObstacles — written by BuildState, read by RunState.
         *                   Lives here so it survives the BUILD → RUN transition.
<<<<<<< HEAD
=======
         * Obstacle tokens are now stored per-player in player.inventory (Map).
>>>>>>> origin/feature/shop
         */
        const ctx = {
            p,
            gameWidth,
            gameHeight,
            players,
            scoreManager,
            placedObstacles: [],
<<<<<<< HEAD
=======
            shopHasRun: false, // true after first shop phase; gates strict build-phase token enforcement
>>>>>>> origin/feature/shop
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
            [GameStage.BUILD]:   new BuildState(ctx, goTo),
            [GameStage.RUN]:     new RunState(ctx, goTo),
            [GameStage.RESULTS]: new ResultsState(ctx, goTo),
<<<<<<< HEAD
=======
            [GameStage.SHOP]:    new ShopState(ctx, goTo),
>>>>>>> origin/feature/shop
            [GameStage.MAP2]:    new Map2State(ctx, goTo),
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
