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
         * shopPurchases   — null on round 1 (free placement).
         *                   Set to [] by ShopState.enter() each subsequent round.
         *                   Array of ObstacleType strings — one token per purchase.
         *                   BuildState consumes tokens on placement, refunds on removal.
         */
        const ctx = {
            p,
            gameWidth,
            gameHeight,
            players,
            scoreManager,
            placedObstacles: [],
            shopPurchases:   null, // null = free placement (round 1)
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
            [GameStage.SHOP]:    new ShopState(ctx, goTo),
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
