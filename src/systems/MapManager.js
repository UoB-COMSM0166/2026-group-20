import { Player } from '../entities/Player.js';
import { ScoreManager } from './ScoreManager.js';
import { TiledMapLoader } from '../maps/TiledMapLoader.js';
import { ChunkMapGenerator } from './ChunkMapGenerator.js';
import { TileType } from '../config/TileType.js';
import { GameConfig } from '../config/GameConfig.js';
import { Coin } from '../entities/Coin.js';

import { AnimationConfigChick } from '../config/AnimationConfigChick.js';
import { AnimationConfigBunny } from '../config/AnimationConfigBunny.js';

/**
 * MapManager centralizes map loading/switching and keeps shared ctx in sync.
 */
export class MapManager {
    constructor(p) {
        this.p = p;

        this.mapLoaders = {
            map1: new TiledMapLoader(
                p,
                'src/assets/maps/map1/map.JSON',
                'src/assets/maps/map1/Tileset.png',
            ),
            map2: new TiledMapLoader(
                p,
                'src/assets/maps/map2/map2.JSON',
                'src/assets/maps/map2/Tileset.png',
            ),
        };

        /** Chunk generators keyed by theme prefix, e.g. 'I' → ChunkMapGenerator */
        this.chunkGenerators = new Map();

        /** Pool of chunk filenames keyed by prefix — populated in preload. */
        this._chunkPool = new Map();

        /** Background images grouped by theme prefix — populated in preload. */
        this._backgroundImages = { F: [], I: [] };

        this.currentKey = 'map1';
        this.current = this.mapLoaders.map1;

        /** @type {p5.Image|null} coin sprite */
        this._coinSprite = null;

        /** @type {p5.Image|null} endpoint flag sprite */
        this._endPointSprite = null;
    }

    /** Background file names per theme */
    static BG_FILES = {
        F: [
            'forest_background_burn.png',
            'forest_background_daytime.png',
            'forest_background_human.png',
            'forest_background_human_and_elf.png',
            'forest_background_night.png',
            'forest_background_soldiers.png',
            'forest_background_spirit.png',
            'forest_night_spirit.png',
        ],
        I: [
            'ice_background_daytime.png',
            'ice_background_dragon.png',
            'ice_background_dragon_and_wizard_attack.png',
            'ice_background_dragon_and_wizard_idle.png',
            'ice_background_dragon_fly.png',
            'ice_background_hunter.png',
            'ice_background_night.png',
            'ice_background_storm.png',
        ],
    };

    preloadAll() {
        for (const loader of Object.values(this.mapLoaders)) {
            loader.preload();
        }
        // Load the chunk manifest so the pool is ready before any game logic runs.
        this._preloadChunkPool();
        // Preload background images for each theme.
        this._preloadBackgrounds();
        // Preload coin and endpoint sprites.
        this._coinSprite = this.p.loadImage(
            'src/assets/obstacles/Coin/coin.png',
        );
        this._endPointSprite = this.p.loadImage(
            'src/assets/obstacles/endpoint/Checkpoint(FlagIdle)(64x64).png',
        );

        // Pass sprites to all map loaders.
        for (const loader of Object.values(this.mapLoaders)) {
            loader.setCoinSprite(this._coinSprite);
            loader.setEndpointSprite(this._endPointSprite);
        }
    }

    /**
     * Load index.json and populate _chunkPool synchronously via p5.loadJSON
     * (call only inside p5.preload).
     * @internal
     */
    _preloadChunkPool() {
        // p5.loadJSON returns a proxy that is populated asynchronously;
        // use the callback form so we process data only after it arrives.
        this.p.loadJSON('src/assets/maps/chunks/index.json', (manifest) => {
            if (!manifest?.files) return;

            for (const filename of manifest.files) {
                // Pool key: 'I_N_1_10_01.json' → 'I_N_1'
                const base = filename.replace(/\.json$/, '');
                const key = base.split('_').slice(0, 3).join('_');

                if (!this._chunkPool.has(key)) {
                    this._chunkPool.set(key, []);
                }
                this._chunkPool.get(key).push({ _filename: filename });
            }

            console.log(
                'ChunkMapGenerator: chunk pool ready —',
                this._chunkPool.size,
                'prefixes',
            );
        });
    }

    /**
     * Preload all background images for each theme.
     * @internal
     */
    _preloadBackgrounds() {
        const basePath = 'src/assets/images/background/';
        for (const [theme, files] of Object.entries(MapManager.BG_FILES)) {
            this._backgroundImages[theme] = files.map((f) =>
                this.p.loadImage(basePath + f),
            );
        }
    }

    initialize(ctx) {
        this._applySelectedMap(ctx);
    }

    selectMap(mapKey, ctx) {
        const next = this.mapLoaders[mapKey];
        if (!next) return;

        this.currentKey = mapKey;
        this.current = next;
        this._applySelectedMap(ctx);
    }

    /**
     * Asynchronously load a chunk JSON using fetch.
     * @param {string} filename
     * @returns {Promise<object|null>}
     */
    async _loadChunk(filename) {
        try {
            const base = 'src/assets/maps/chunks/';
            const url = base + filename;
            const resp = await fetch(url);
            if (!resp.ok) {
                console.error(
                    `ChunkMapGenerator: failed to load ${url} (${resp.status})`,
                );
                return null;
            }
            return await resp.json();
        } catch (e) {
            console.error(`ChunkMapGenerator: error loading ${filename}:`, e);
            return null;
        }
    }

    /**
     * Generate a random map for the given mapKey and apply it to ctx.
     * Called at the start of each round after round 1.
     * @param {string} mapKey - e.g. 'map2'
     * @param {object} ctx - shared session context
     */
    /** Map key → chunk theme prefix */
    static THEME_MAP = { map1: 'F', map2: 'I' };

    async generateRandomMap(mapKey, ctx) {
        const theme = MapManager.THEME_MAP[mapKey];
        if (!theme) return; // No chunk theme defined for this map
        const difficulty = 1;
        const GRID_COLS = 4;
        const GRID_ROWS = 3;
        const MIN_DIST_SQ = 8; // (2√2)² = 8

        // Build a fresh ChunkMapGenerator and load its chunks.
        const gen = new ChunkMapGenerator(this.p);
        gen.gridCols = GRID_COLS;
        gen.gridRows = GRID_ROWS;

        for (const [key, entries] of this._chunkPool) {
            if (!key.startsWith(`${theme}_`)) continue;
            const filenames = entries.map((e) => e._filename);
            const jsons = await Promise.all(
                filenames.map((f) => this._loadChunk(f)),
            );
            for (let i = 0; i < jsons.length; i++) {
                if (jsons[i]) {
                    gen._registerChunk(jsons[i], filenames[i]);
                }
            }
        }

        const poolSize = [...gen.chunkPool.values()].reduce(
            (s, a) => s + a.length,
            0,
        );
        console.log(
            `ChunkMapGenerator: ${poolSize} chunks loaded for theme '${theme}'`,
        );

        // ── Pick S and E pools ──
        const sPrefix = `${theme}_S_${difficulty}`;
        const nPrefix = `${theme}_N_${difficulty}`;
        const ePrefix = `${theme}_E_${difficulty}`;

        const sPool = gen.chunkPool.get(sPrefix) || [];
        const nPool = gen.chunkPool.get(nPrefix) || [];
        const ePool = gen.chunkPool.get(ePrefix) || [];

        if (sPool.length === 0 || ePool.length === 0 || nPool.length === 0) {
            console.error(
                'ChunkMapGenerator: missing S/N/E chunks for grid generation.',
            );
            return;
        }

        // ── Pick random grid positions for S and E with distance >= 2√2 ──
        const total = GRID_COLS * GRID_ROWS;
        const allPositions = [];
        for (let r = 0; r < GRID_ROWS; r++) {
            for (let c = 0; c < GRID_COLS; c++) {
                allPositions.push({ col: c, row: r });
            }
        }

        // Find all valid (sPos, ePos) pairs
        const validPairs = [];
        for (const s of allPositions) {
            for (const e of allPositions) {
                if (s.col === e.col && s.row === e.row) continue;
                const dx = e.col - s.col;
                const dy = e.row - s.row;
                if (dx * dx + dy * dy >= MIN_DIST_SQ) {
                    validPairs.push({ s, e });
                }
            }
        }

        const pair = validPairs[Math.floor(Math.random() * validPairs.length)];
        const sPos = pair.s;
        const ePos = pair.e;
        const sIdx = sPos.row * GRID_COLS + sPos.col; // row-major index
        const eIdx = ePos.row * GRID_COLS + ePos.col;

        console.log(
            `Grid S at (${sPos.col},${sPos.row}), E at (${ePos.col},${ePos.row}), ` +
                `dist=${Math.sqrt((ePos.col - sPos.col) ** 2 + (ePos.row - sPos.row) ** 2).toFixed(2)}`,
        );

        // ── Build selectedChunks in row-major order (no duplicates) ──
        // Shuffle helper (Fisher-Yates)
        const shuffle = (arr) => {
            const a = [...arr];
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        };

        // Pre-shuffle N pool; draw sequentially to avoid repeats.
        // If we need more than nPool.length, reshuffle and continue.
        const shuffledN = shuffle(nPool);
        let nDrawIdx = 0;
        const drawN = () => {
            if (nDrawIdx >= shuffledN.length) {
                // Exhausted pool — reshuffle for any remaining cells
                const reshuffled = shuffle(nPool);
                shuffledN.splice(0, shuffledN.length, ...reshuffled);
                nDrawIdx = 0;
            }
            return shuffledN[nDrawIdx++];
        };

        const selectedChunks = [];
        for (let i = 0; i < total; i++) {
            if (i === sIdx) {
                selectedChunks.push(
                    sPool[Math.floor(Math.random() * sPool.length)],
                );
            } else if (i === eIdx) {
                selectedChunks.push(
                    ePool[Math.floor(Math.random() * ePool.length)],
                );
            } else {
                selectedChunks.push(drawN());
            }
        }
        gen.selectChunks(selectedChunks);

        // ── Merge as grid ──
        const mergedData = gen.mergeGrid();

        const firstChunk = gen.selectedChunks[0];
        console.log(
            `Grid chunk:`,
            firstChunk?.width,
            'x',
            firstChunk?.height,
            'layers:',
            firstChunk?.layers?.length,
        );

        // Build collision grid.
        const collisionMap = gen.buildCollisionMap();
        console.log(
            `Collision map: ${collisionMap[0]?.length ?? 0} x ${collisionMap.length}`,
        );

        if (collisionMap.length === 0 || !collisionMap[0]) {
            console.error(
                'ChunkMapGenerator: collision map is empty! Aborting map generation.',
            );
            return;
        }

        // ── Find start/end points accounting for 2D chunk offsets ──
        const chunkW = firstChunk.width; // tiles per chunk
        const chunkH = firstChunk.height;
        const tileW = mergedData.tilewidth;
        const tileH = mergedData.tileheight;

        const startPoint = this._findObjectInMergedGrid(
            gen.selectedChunks,
            'startPoint',
            chunkW,
            chunkH,
            tileW,
            tileH,
            GRID_COLS,
        );
        const endPoint = this._findObjectInMergedGrid(
            gen.selectedChunks,
            'endPoint',
            chunkW,
            chunkH,
            tileW,
            tileH,
            GRID_COLS,
        );

        // ── Mark endPoint region as ENDPOINT in the collision map ──
        if (endPoint) {
            const sc = Math.floor(endPoint.x / tileW);
            const sr = Math.floor(endPoint.y / tileH);
            const ec = Math.floor((endPoint.x + (endPoint.w || tileW)) / tileW);
            const er = Math.floor((endPoint.y + (endPoint.h || tileH)) / tileH);
            for (let r = sr; r <= er; r++) {
                for (let c = sc; c <= ec; c++) {
                    if (collisionMap[r] && collisionMap[r][c] !== undefined) {
                        collisionMap[r][c] = TileType.ENDPOINT;
                    }
                }
            }
        }

        // ── Build the render function using the matching tileset ──
        const loader = this.mapLoaders[mapKey];
        const tilesetImage = loader.tilesetImage;
        const p = this.p;
        const tileLayer = mergedData.layers.find(
            (l) => l.name === 'Tile_Layer_1',
        );
        const mapCols = mergedData.width;

        // ── Collect coins from all chunks' Object_Layer_1 ──
        const coinList = this._findAllCoinsInMergedGrid(
            gen.selectedChunks,
            chunkW,
            chunkH,
            tileW,
            tileH,
            GRID_COLS,
        );

        // ── Pick a random background for this theme (stored on ctx) ──
        const bgImage = this._pickBackground(theme);
        const epSprite = this._endPointSprite;

        const generatedMap = {
            MAP: collisionMap,
            startX: startPoint?.x ?? 0,
            startY: startPoint?.y ?? 0,
            tilewidth: tileW,
            tileheight: tileH,
            gameWidth: collisionMap[0].length * tileW,
            gameHeight: collisionMap.length * tileH,

            render() {
                if (!tileLayer || !tilesetImage) return;
                const tilesetCols = Math.floor(tilesetImage.width / tileW);
                const data = tileLayer.data;
                for (let i = 0; i < data.length; i++) {
                    const gid = data[i];
                    if (gid === 0) continue;
                    const localId = gid - 1; // firstgid is 1
                    const col = i % mapCols;
                    const row = Math.floor(i / mapCols);
                    const srcX = (localId % tilesetCols) * tileW;
                    const srcY = Math.floor(localId / tilesetCols) * tileH;
                    p.image(
                        tilesetImage,
                        col * tileW,
                        row * tileH,
                        tileW,
                        tileH,
                        srcX,
                        srcY,
                        tileW,
                        tileH,
                    );
                }

                if (endPoint && epSprite) {
                    const fw = 64;
                    const fh = 64;
                    const frames = 10;
                    const frameIdx = p.floor(p.frameCount / 5) % frames;

                    const drawX = endPoint.x;
                    const drawY = endPoint.y - (fh - (endPoint.h || tileH));

                    p.image(
                        epSprite,
                        drawX,
                        drawY,
                        fw,
                        fh,
                        frameIdx * fw,
                        0,
                        fw,
                        fh,
                    );
                }
            },

            getCoins() {
                return coinList;
            },
        };

        // Apply to ctx.
        ctx.gameWidth = generatedMap.gameWidth;
        ctx.gameHeight = generatedMap.gameHeight;
        ctx.tiledMap = generatedMap;
        ctx.mapKey = mapKey;
        ctx.backgroundImage = bgImage;

        // Reposition existing players to the new start point.
        for (const player of ctx.players) {
            player.x = generatedMap.startX;
            player.y = generatedMap.startY;
            player.spawnX = generatedMap.startX;
            player.spawnY = generatedMap.startY;
        }

        console.log(
            `Generated map applied: ${generatedMap.gameWidth}×${generatedMap.gameHeight}, ` +
                `start=(${generatedMap.startX}, ${generatedMap.startY})`,
        );
    }

    /**
     * Find a named object across merged grid chunks,
     * adjusting coordinates by each chunk's 2D grid offset.
     * @param {object[]} chunks  - row-major ordered list of selected chunks
     * @param {string}   name    - object name to find
     * @param {number}   chunkW  - chunk width in tiles
     * @param {number}   chunkH  - chunk height in tiles
     * @param {number}   tileW   - tile width in pixels
     * @param {number}   tileH   - tile height in pixels
     * @param {number}   gridCols - number of columns in the grid
     * @returns {{x:number, y:number, w:number, h:number}|null}
     */
    _findObjectInMergedGrid(
        chunks,
        name,
        chunkW,
        chunkH,
        tileW,
        tileH,
        gridCols,
    ) {
        for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];
            const gridCol = ci % gridCols;
            const gridRow = Math.floor(ci / gridCols);
            const offsetX = gridCol * chunkW * tileW;
            const offsetY = gridRow * chunkH * tileH;
            for (const layer of chunk.layers || []) {
                if (layer.type !== 'objectgroup') continue;
                for (const obj of layer.objects || []) {
                    if (obj.name === name) {
                        return {
                            x: obj.x + offsetX,
                            y: obj.y + offsetY,
                            w: obj.width || tileW,
                            h: obj.height || tileH,
                        };
                    }
                }
            }
        }
        return null;
    }

    /**
     * Collect all coin objects from Object_Layer_1 across all merged grid chunks,
     * applying grid offsets to each coin's position.
     * @param {object[]} chunks  - row-major ordered list of selected chunks
     * @param {number}   chunkW  - chunk width in tiles
     * @param {number}   chunkH  - chunk height in tiles
     * @param {number}   tileW   - tile width in pixels
     * @param {number}   tileH   - tile height in pixels
     * @param {number}   gridCols - number of columns in the grid
     * @returns {Coin[]}
     */
    _findAllCoinsInMergedGrid(chunks, chunkW, chunkH, tileW, tileH, gridCols) {
        const coins = [];
        for (let ci = 0; ci < chunks.length; ci++) {
            const chunk = chunks[ci];
            const gridCol = ci % gridCols;
            const gridRow = Math.floor(ci / gridCols);
            const offsetX = gridCol * chunkW * tileW;
            const offsetY = gridRow * chunkH * tileH;
            for (const layer of chunk.layers || []) {
                if (layer.type !== 'objectgroup') continue;
                for (const obj of layer.objects || []) {
                    if (obj.name !== 'coin') continue;
                    const x = obj.x + offsetX;
                    const y = obj.y + offsetY;
                    coins.push(
                        new Coin(
                            this.p,
                            x,
                            y,
                            GameConfig.COIN_VALUE,
                            this._coinSprite,
                        ),
                    );
                }
            }
        }
        return coins;
    }

    _applySelectedMap(ctx) {
        this.current.setup();

        const gameWidth = this.current.gameWidth;
        const gameHeight = this.current.gameHeight;
        const players = [
            new Player(
                this.p,
                this.current.startX,
                this.current.startY,
                0,
                ctx.sprites.chicken,
                AnimationConfigChick,
            ),
            new Player(
                this.p,
                this.current.startX,
                this.current.startY,
                1,
                ctx.sprites.bunny,
                AnimationConfigBunny,
            ),
        ];

        // Pick a themed background for this map
        const theme = MapManager.THEME_MAP[this.currentKey];
        ctx.backgroundImage = theme ? this._pickBackground(theme) : null;

        ctx.gameWidth = gameWidth;
        ctx.gameHeight = gameHeight;
        ctx.players = players;
        ctx.tiledMap = this.current;
        ctx.mapKey = this.currentKey;
        ctx.scoreManager = new ScoreManager(players);
    }

    /**
     * Pick a random background image for the given theme.
     * @param {string} theme - 'F' or 'I'
     * @returns {p5.Image|null}
     */
    _pickBackground(theme) {
        const pool = this._backgroundImages[theme] || [];
        if (pool.length === 0) return null;
        return pool[Math.floor(Math.random() * pool.length)];
    }
}
