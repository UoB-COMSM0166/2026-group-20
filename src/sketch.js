import { Player } from './entities/Player.js';
import { ScoreManager } from './systems/ScoreManager.js';
import { GameStage } from './config/GameStage.js';
import { MapManager } from './systems/MapManager.js';

import { AudioManager } from './systems/AudioManager.js';
import { BootState } from './states/BootState.js';
import { MenuState } from './states/MenuState.js';
import { CharSelectState } from './states/CharSelectState.js';

import { MapMenuState } from './states/MapMenuState.js';
import { BuildState } from './states/BuildState.js';
import { RunState } from './states/RunState.js';
import { ResultsState } from './states/ResultsState.js';
import { ShopState } from './states/ShopState.js';
import { TutorialState } from './states/TutorialState.js';
import { WalkMapState }  from './states/WalkMapState.js';
// import { Map2State } from './states/Map2State.js';
import { GameConfig } from './config/GameConfig.js';
import { AnimationConfigChick } from './config/AnimationConfigChick.js';
import { AnimationConfigBunny } from './config/AnimationConfigBunny.js';
import { AIMapGenerator } from './systems/AIMapGenerator.js'

// import images
import chickenSprite from './assets/sprites/chicken_all_frames.png';
import bunnySprite from './assets/sprites/bunny_all_frames.png';
import duckSprite from './assets/sprites/duck_all_frames.png';
import polarSprite from './assets/sprites/polar_all_frames.png';

import saw from './assets/obstacles/Saw/On (38x38).png';
import fire from './assets/obstacles/Fire/On (16x32).png';
import trampoline from './assets/obstacles/Trampoline/Jump (28x28).png';
import spikedBall from './assets/obstacles/Spiked Ball/Spiked Ball.png';
import cannon from './assets/obstacles/Cannon/cannon (30x18).png';
import fallingPlatform from './assets/obstacles/Falling Platforms/On (32x10).png';
import platform from './assets/obstacles/Platforms/platform (40x40).png';
import movingPlatform from './assets/obstacles/Moving Platforms/Brown On (32x8).png';
import icePlatform from './assets/obstacles/Ice Platforms/ice platform (40x40).png';
import spikePlatform from './assets/obstacles/Spike Platforms/spike platform (40x40).png';
import teleporter from './assets/obstacles/Teleporter/teleporter (40x40).png';
import windZone from './assets/obstacles/Wind Zone/wind zone (32x32).png';
import iceBlock from './assets/obstacles/Ice Block/ice block (40x40).png';
import endpointFlag from './assets/obstacles/endpoint/Checkpoint(FlagIdle)(64x64).png';
import shadowIcon from './assets/obstacles/Shadow/shadow-icon.svg';
import map1Preview from './assets/maps/map1/background.png';
import map2Preview from './assets/maps/map2/background.png';
import startScreen from './assets/images/background/startscreen-bg.png';
import mapBackground from './assets/images/background/map-selection-bg.png';
import panasChillFont from './assets/fonts/PanasChill.ttf';

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
    let activeState;
    let states;

    let gameWidth = GameConfig.GAME_WIDTH;
    let gameHeight = GameConfig.GAME_HEIGHT;

    let aiMapFlag = 1; // 0 for AI map generator, 1 for procedural
    let apiKey = '';
    const mapManager   = new MapManager(p, aiMapFlag, apiKey);
    const audioManager = new AudioManager();

    let sawFrames;
    let fireFrames;
    let trampolineBouncing;
    let spikedBallImg;
    let cannonImg;
    let fallingPlatformFrames;
    let platformImg;
    let movingPlatformImg;
    let icePlatformImg;
    let spikePlatformImg;
    let teleporterImg;
    let windZoneImg;
    let iceBlockImg;
    let endpointFlagImg;
    let shadowIconImg;
    let map1PreviewImg;
    let map2PreviewImg;
    let startScreenBackground;
    let mapMenuBackgroundImg;
    let menuFont;

    let chickenSheet;
    let bunnySheet;
    let duckSheet;
    let polarSheet;

    let ctx;

    p.preload = function () {
        chickenSheet = p.loadImage(chickenSprite);
        bunnySheet = p.loadImage(bunnySprite);
        duckSheet = p.loadImage(duckSprite);
        polarSheet = p.loadImage(polarSprite);
        sawFrames = p.loadImage(saw);
        fireFrames = p.loadImage(fire);
        trampolineBouncing = p.loadImage(trampoline);
        spikedBallImg = p.loadImage(spikedBall);
        cannonImg = p.loadImage(cannon);
        fallingPlatformFrames = p.loadImage(fallingPlatform);
        platformImg = p.loadImage(platform);
        movingPlatformImg = p.loadImage(movingPlatform);
        icePlatformImg = p.loadImage(icePlatform);
        spikePlatformImg = p.loadImage(spikePlatform);
        teleporterImg = p.loadImage(teleporter);
        windZoneImg = p.loadImage(windZone);
        iceBlockImg = p.loadImage(iceBlock);
        endpointFlagImg = p.loadImage(endpointFlag);
        shadowIconImg = p.loadImage(shadowIcon);
        map1PreviewImg = p.loadImage(map1Preview);
        map2PreviewImg = p.loadImage(map2Preview);
        startScreenBackground = p.loadImage(startScreen);
        mapMenuBackgroundImg = p.loadImage(mapBackground);
        menuFont = p.loadFont(panasChillFont);
        mapManager.preloadAll();
    };

    // ── Setup ──

    p.setup = function () {
        p.createCanvas(p.windowWidth, p.windowHeight);

        window.ai = new AIMapGenerator(apiKey)

        /**
         * Shared session context.
         * placedObstacles — written by BuildState, read by RunState.
         *                   Lives here so it survives the BUILD → RUN transition.
         * Obstacle tokens are now stored per-player in player.inventory (Map).
         */
        ctx = {
            p,
            gameWidth: GameConfig.GAME_WIDTH,
            gameHeight: GameConfig.GAME_HEIGHT,
            walkMapBg: mapMenuBackgroundImg,
            players: [],
            tiledMap: null,
            scoreManager: null,
            mapKey: 'map1',
            selectMap: (mapKey) => mapManager.selectMap(mapKey, ctx),
            sprites: {
                chicken: chickenSheet,
                bunny: bunnySheet,
                duck: duckSheet,
                polar: polarSheet,
            },
            mapPreviews: {
                map1: map1PreviewImg,
                map2: map2PreviewImg,
            },
            shopIcons: {
                PLATFORM: platformImg,
                MOVING_PLATFORM: movingPlatformImg,
                FALLING_PLATFORM: fallingPlatformFrames,
                ICE_PLATFORM: icePlatformImg,
                BOUNCE_PAD: trampolineBouncing,
                SPIKE: spikePlatformImg,
                CANNON: cannonImg,
                SAW: sawFrames,
                FLAME: fireFrames,
                SPIKED_BALL: spikedBallImg,
                ICE_BLOCK: iceBlockImg,
                WIND_ZONE: windZoneImg,
                TELEPORTER: teleporterImg,
                BOMB: null,
                SHADOW: shadowIconImg,
            },
            endpointFlag: endpointFlagImg,
            placedObstacles: [],
            shopHasRun: false,
            audioManager,
            devMode: false,
            resumeRunState: false,
            displayMode: 'fit',
            fontMode: 'panas_chill',
            aiMapFlag,
            apiKey,
            mapManager,
        };

        document.body.style.fontFamily = "'PanasChill', monospace";

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
            [GameStage.MENU]: new MenuState(ctx, goTo, startScreenBackground, menuFont),
            [GameStage.CHAR_SELECT]: new CharSelectState(ctx, goTo),
            [GameStage.MAPMENU]: new MapMenuState(ctx, goTo),
            [GameStage.BUILD]: new BuildState(
                ctx,
                goTo,
                sawFrames,
                fireFrames,
                trampolineBouncing,
                spikedBallImg,
                cannonImg,
                fallingPlatformFrames,
            ),
            [GameStage.RUN]: new RunState(ctx, goTo),
            [GameStage.RESULTS]: new ResultsState(ctx, goTo),
            [GameStage.SHOP]: new ShopState(ctx, goTo),
            [GameStage.TUTORIAL]: new TutorialState(ctx, goTo),
            [GameStage.WALK_MAP]:  new WalkMapState(ctx, goTo),
            //            [GameStage.MAP2]: new Map2State(ctx, goTo),
        };

        goTo(GameStage.BOOT);
    };

    // ── Draw ──

    p.draw = function () {
        if (ctx) {
            gameWidth = ctx.gameWidth;
            gameHeight = ctx.gameHeight;
        }

        p.background(0);
        const viewport = _getViewport();
        const mx = (p.mouseX - viewport.offsetX) / viewport.scaleX;
        const my = (p.mouseY - viewport.offsetY) / viewport.scaleY;

        p.cursor(p.ARROW);
        p.push();
        p.translate(viewport.offsetX, viewport.offsetY);
        p.scale(viewport.scaleX, viewport.scaleY);
        p.textFont(GameConfig.FONT);

        activeState.update(p.deltaTime || 16.6);
        const fontScale = _getFontSizeScale();
        _withFontScale(fontScale, () => activeState.render(mx, my));

        p.pop();
    };

    // ── Input ──

    p.mousePressed = function () {
        const viewport = _getViewport();
        const mx = (p.mouseX - viewport.offsetX) / viewport.scaleX;
        const my = (p.mouseY - viewport.offsetY) / viewport.scaleY;
        activeState.mousePressed(mx, my);
    };

    p.keyPressed = function () {
        activeState.keyPressed();
    };

    p.windowResized = function () {
        p.resizeCanvas(p.windowWidth, p.windowHeight);
    };

    p.doubleClicked = function () {
        p.fullscreen(!p.fullscreen());
    };

    function _getViewport() {
        if (ctx?.displayMode === 'stretch') {
            return {
                scaleX: p.width / gameWidth,
                scaleY: p.height / gameHeight,
                offsetX: 0,
                offsetY: 0,
            };
        }

        const scale = p.min(p.width / gameWidth, p.height / gameHeight);
        return {
            scaleX: scale,
            scaleY: scale,
            offsetX: (p.width - gameWidth * scale) / 2,
            offsetY: (p.height - gameHeight * scale) / 2,
        };
    }

    function _getFontSizeScale() {
        if (activeState === states?.[GameStage.MENU]) return 1;
        return ctx?.fontMode === 'press_start_2p' ? 1.5 : 3;
    }

    function _withFontScale(multiplier, drawFn) {
        if (multiplier === 1) {
            drawFn();
            return;
        }

        const originalTextSize = p.textSize.bind(p);
        const originalTextFont = p.textFont.bind(p);

        p.textSize = function (size) {
            if (typeof size === 'number') {
                return originalTextSize(size * multiplier);
            }
            return originalTextSize(size);
        };

        p.textFont = function (font, size) {
            if (typeof size === 'number') {
                return originalTextFont(font, size * multiplier);
            }
            return originalTextFont(font);
        };

        try {
            drawFn();
        } finally {
            p.textSize = originalTextSize;
            p.textFont = originalTextFont;
        }
    }
};
