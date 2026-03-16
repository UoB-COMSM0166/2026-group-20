import { GameStage } from './config/GameStage.js';
import { MapManager } from './systems/MapManager.js';

import { BootState } from './states/BootState.js';
import { MenuState } from './states/MenuState.js';
import { MapMenuState } from './states/MapMenuState.js';
import { BuildState } from './states/BuildState.js';
import { RunState } from './states/RunState.js';
import { ResultsState } from './states/ResultsState.js';

/**
 * Root p5 sketch.
 *
 * Manages the canvas, viewport transform, shared session context,
 * and the active state machine. All game logic lives in src/states/.
 *
 * State flow:
 *   BOOT → MENU → MAPMENU → BUILD → RUN → RESULTS
 *                                  ↑____________| (ENTER plays again)
 */
export const sketch = (p) => {
    let activeState;
    let states;

    let scaleFactor = 1;
    let offsetX = 0;
    let offsetY = 0;
    let gameWidth;
    let gameHeight;

    const mapManager = new MapManager(p);

    let ctx;

    p.preload = function () {
        mapManager.preloadAll();
    }

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        /**
         * Shared session context.
         * placedObstacles — written by BuildState, read by RunState.
         *                   Lives here so it survives the BUILD → RUN transition.
         */
        ctx = {
            p,
            gameWidth,
            gameHeight,
            players: [],
            tiledMap: null,
            scoreManager: null,
            mapKey: 'map1',
            selectMap: (mapKey) => mapManager.selectMap(mapKey, ctx),
            placedObstacles: [],
        };

        mapManager.initialize(ctx);
        gameWidth = ctx.gameWidth;
        gameHeight = ctx.gameHeight;

        const goTo = (stage) => {
            activeState?.exit();
            activeState = states[stage];
            activeState.enter();
        };

        states = {
            [GameStage.BOOT]: new BootState(ctx, goTo),
            [GameStage.MENU]: new MenuState(ctx, goTo),
            [GameStage.MAPMENU]: new MapMenuState(ctx, goTo),
            [GameStage.BUILD]: new BuildState(ctx, goTo),
            [GameStage.RUN]: new RunState(ctx, goTo),
            [GameStage.RESULTS]: new ResultsState(ctx, goTo),
        };

        goTo(GameStage.BOOT);
    };

    // ── Draw ───────────────────────────────────────────────────────────────

    p.draw = function () {
        if (ctx) {
            gameWidth = ctx.gameWidth;
            gameHeight = ctx.gameHeight;
        }

        p.background(0);

        scaleFactor = p.min(p.width / gameWidth, p.height / gameHeight);
        offsetX = (p.width - gameWidth * scaleFactor) / 2;
        offsetY = (p.height - gameHeight * scaleFactor) / 2;

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


