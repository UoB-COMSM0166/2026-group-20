import { Player } from '../entities/Player.js';
import { ScoreManager } from './ScoreManager.js';
import { TiledMapLoader } from '../maps/TiledMapLoader.js';
import { GameConfig } from '../config/GameConfig.js';
import { ChunkMapGenerator } from './ChunkMapGenerator.js';
import { Coin } from '../entities/Coin.js';
import { TileType } from '../config/TileType.js';
import { AIMapGenerator } from './AIMapGenerator.js';

import { AnimationConfigChick } from '../config/AnimationConfigChick.js';
import { AnimationConfigBunny } from '../config/AnimationConfigBunny.js';

/**
 * MapManager centralizes map loading/switching and keeps shared ctx in sync.
 */
export class MapManager {
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

    static THEME_MAP = {
        map1: 'F',
        map2: 'I',
    };

    constructor(p, aiMapFlag = 1, apiKey = null) {
        this.p = p;
        this.aiMapFlag = aiMapFlag;
        this.aiGenerator = new AIMapGenerator(apiKey);
        this.preloadedAIMap = null;
        this._preloadPromise = null;

        const baseUrl = import.meta.env.BASE_URL;
        this.mapLoaders = {
            map1: new TiledMapLoader(
                p,
                `${baseUrl}assets/maps/map1/map.JSON`,
                `${baseUrl}assets/maps/map1/Tileset.png`,
            ),
            map2: new TiledMapLoader(
                p,
                `${baseUrl}assets/maps/map2/map2.JSON`,
                `${baseUrl}assets/maps/map2/Tileset.png`,
            ),
        };

        this.chunkGenerators = new Map();
        this._chunkPool = new Map();
        this._backgroundImages = { F: [], I: [] };
        this.currentKey = 'map1';
        this.current = this.mapLoaders.map1;
        this._coinSprite = null;
        this._endPointSprite = null;
        this._lastGeneratedSignature = new Map();
    }

    preloadAll() {
        for (const loader of Object.values(this.mapLoaders)) {
            loader.preload();
        }
        this._preloadChunkPool();
        this._preloadBackgrounds();

        const baseUrl = import.meta.env.BASE_URL;
        this._coinSprite = this.p.loadImage(
            `${baseUrl}assets/obstacles/Coin/coin.png`,
        );
        this._endPointSprite = this.p.loadImage(
            `${baseUrl}assets/obstacles/endpoint/Checkpoint(FlagIdle)(64x64).png`,
        );

        for (const loader of Object.values(this.mapLoaders)) {
            loader.setCoinSprite(this._coinSprite);
            loader.setEndpointSprite(this._endPointSprite);
        }
    }

    _preloadChunkPool() {
        const baseUrl = import.meta.env.BASE_URL;
        this.p.loadJSON(
            `${baseUrl}assets/maps/chunks/index.json`,
            (manifest) => {
                if (!manifest?.files) return;
                for (const filename of manifest.files) {
                    const base = filename.replace(/\.json$/, '');
                    const key = base.split('_').slice(0, 3).join('_');
                    if (!this._chunkPool.has(key)) {
                        this._chunkPool.set(key, []);
                    }
                    this._chunkPool.get(key).push({ _filename: filename });
                }
            },
        );
    }

    _preloadBackgrounds() {
        const baseUrl = import.meta.env.BASE_URL;
        const basePath = `${baseUrl}assets/images/background/`;
        for (const [theme, files] of Object.entries(MapManager.BG_FILES)) {
            this._backgroundImages[theme] = files.map((file) =>
                this.p.loadImage(basePath + file),
            );
        }
    }

    initialize(ctx) {
        ctx.mapManager = this;
        this._applySelectedMap(ctx);
        if (this.aiMapFlag === 0) {
            this.preloadNextAIMap(ctx.apiKey);
        }
    }

    preloadNextAIMap(apiKey = null) {
        if (this.aiMapFlag !== 0) return null;
        if (this._preloadPromise) return this._preloadPromise;

        this._preloadPromise = (async () => {
            try {
                this.preloadedAIMap =
                    await this.aiGenerator.generateMap(apiKey);
            } catch (e) {
                console.error('AI Map Preload failed:', e);
            } finally {
                this._preloadPromise = null;
            }
        })();
        return this._preloadPromise;
    }

    selectMap(mapKey, ctx) {
        const next = this.mapLoaders[mapKey];
        if (!next) return;

        this.currentKey = mapKey;
        this.current = next;
        this._applySelectedMap(ctx);
    }

    refreshBackground(ctx) {
        ctx.backgroundImage = this._pickBackgroundFor(this.currentKey);
    }

    async _loadChunk(filename) {
        try {
            const baseUrl = import.meta.env.BASE_URL;
            const url = `${baseUrl}assets/maps/chunks/${filename}`;
            const resp = await fetch(url);
            if (!resp.ok) return null;
            return await resp.json();
        } catch (_e) {
            return null;
        }
    }

    async generateRandomMap(mapKey, ctx) {
        if (this.aiMapFlag === 0) {
            if (this._preloadPromise) {
                this._preloadPromise;
            }

            let aiResult = this.preloadedAIMap;
            // if (!aiResult) {
            //     aiResult = await this.aiGenerator.generateMap();
            // }

            this.preloadedAIMap = null;
            this.preloadNextAIMap(ctx.apiKey);

            if (aiResult) {
                this._applyAIMapResult(aiResult, mapKey, ctx);
                return;
            }
        }
        const theme = MapManager.THEME_MAP[mapKey];
        if (!theme) return;

        const gen = new ChunkMapGenerator(this.p);
        gen.gridCols = 4;
        gen.gridRows = 3;

        const difficulty = 1;
        for (const [key, entries] of this._chunkPool) {
            if (!key.startsWith(`${theme}_`)) continue;
            const filenames = entries.map((entry) => entry._filename);
            const jsons = await Promise.all(
                filenames.map((filename) => this._loadChunk(filename)),
            );
            for (let i = 0; i < jsons.length; i++) {
                if (jsons[i]) {
                    jsons[i]._filename = filenames[i];
                    gen._registerChunk(jsons[i], filenames[i]);
                }
            }
        }

        const sPrefix = `${theme}_S_${difficulty}`;
        const nPrefix = `${theme}_N_${difficulty}`;
        const ePrefix = `${theme}_E_${difficulty}`;
        const sPool = gen.chunkPool.get(sPrefix) ?? [];
        const nPool = gen.chunkPool.get(nPrefix) ?? [];
        const ePool = gen.chunkPool.get(ePrefix) ?? [];
        if (sPool.length === 0 || nPool.length === 0 || ePool.length === 0) {
            return;
        }

        const total = gen.gridCols * gen.gridRows;
        const allPositions = [];
        for (let row = 0; row < gen.gridRows; row++) {
            for (let col = 0; col < gen.gridCols; col++) {
                allPositions.push({ col, row });
            }
        }

        const validPairs = [];
        for (const s of allPositions) {
            for (const e of allPositions) {
                if (s.col === e.col && s.row === e.row) continue;
                const dx = e.col - s.col;
                const dy = e.row - s.row;
                if (dx * dx + dy * dy >= 8) {
                    validPairs.push({ s, e });
                }
            }
        }
        const pair =
            validPairs[Math.floor(Math.random() * validPairs.length)] ??
            validPairs[0];
        if (!pair) return;

        const shuffle = (arr) => {
            const copy = [...arr];
            for (let i = copy.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [copy[i], copy[j]] = [copy[j], copy[i]];
            }
            return copy;
        };

        const sIdx = pair.s.row * gen.gridCols + pair.s.col;
        const eIdx = pair.e.row * gen.gridCols + pair.e.col;
        const shuffledN = shuffle(nPool);
        let nDrawIdx = 0;
        const drawN = () => {
            if (nDrawIdx >= shuffledN.length) {
                const reshuffled = shuffle(nPool);
                shuffledN.splice(0, shuffledN.length, ...reshuffled);
                nDrawIdx = 0;
            }
            return shuffledN[nDrawIdx++];
        };

        let selectedChunks = [];
        let signature = '';
        const previousSignature =
            this._lastGeneratedSignature.get(mapKey) ?? null;
        for (let attempt = 0; attempt < 6; attempt++) {
            const candidate = [];
            for (let i = 0; i < total; i++) {
                if (i === sIdx) {
                    candidate.push(
                        sPool[Math.floor(Math.random() * sPool.length)],
                    );
                } else if (i === eIdx) {
                    candidate.push(
                        ePool[Math.floor(Math.random() * ePool.length)],
                    );
                } else {
                    candidate.push(drawN());
                }
            }
            const candidateSignature = candidate
                .map((chunk) => chunk?._filename ?? 'chunk')
                .join('|');
            selectedChunks = candidate;
            signature = candidateSignature;
            if (
                !previousSignature ||
                candidateSignature !== previousSignature
            ) {
                break;
            }
        }
        gen.selectChunks(selectedChunks);
        this._lastGeneratedSignature.set(mapKey, signature);

        const mergedData = gen.mergeGrid();
        const collisionMap = gen.buildCollisionMap();
        const firstChunk = gen.selectedChunks[0];
        if (!firstChunk || collisionMap.length === 0 || !collisionMap[0])
            return;

        const chunkW = firstChunk.width;
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
            gen.gridCols,
        );
        const endPoint = this._findObjectInMergedGrid(
            gen.selectedChunks,
            'endPoint',
            chunkW,
            chunkH,
            tileW,
            tileH,
            gen.gridCols,
        );

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

        const loader = this.mapLoaders[mapKey];
        const tilesetImage = loader.tilesetImage;
        const tileLayer = mergedData.layers.find(
            (layer) => layer.name === 'Tile_Layer_1',
        );
        const mapCols = mergedData.width;
        const p = this.p;
        const coinDefs = this._findAllCoinsInMergedGrid(
            gen.selectedChunks,
            chunkW,
            chunkH,
            tileW,
            tileH,
            gen.gridCols,
        );

        const coinSprite = this._coinSprite;
        const endpointSprite = this._endPointSprite;
        const visualBlockMap = Array.from({ length: mergedData.height }, () =>
            Array(mergedData.width).fill(false),
        );
        if (tileLayer?.data) {
            for (let i = 0; i < tileLayer.data.length; i++) {
                if (!tileLayer.data[i]) continue;
                const col = i % mergedData.width;
                const row = Math.floor(i / mergedData.width);
                visualBlockMap[row][col] = true;
            }
        }
        const coinHorizontalOffset = (tx, ty) => {
            const width = visualBlockMap[0]?.length ?? 0;
            const height = visualBlockMap.length;
            const leftBlocked =
                ty < 0 ||
                ty >= height ||
                tx - 1 < 0 ||
                visualBlockMap[ty][tx - 1];
            const rightBlocked =
                ty < 0 ||
                ty >= height ||
                tx + 1 >= width ||
                visualBlockMap[ty][tx + 1];
            if (leftBlocked && !rightBlocked) return tileW * 0.28;
            if (rightBlocked && !leftBlocked) return -tileW * 0.28;
            return 0;
        };
        const generatedMap = {
            MAP: collisionMap,
            visualBlockMap,
            startX: startPoint?.x ?? 0,
            startY: startPoint?.y ?? 0,
            endX: endPoint?.x ?? 0,
            endY: endPoint?.y ?? 0,
            endW: endPoint?.w ?? tileW,
            endH: endPoint?.h ?? tileH,
            tilewidth: tileW,
            tileheight: tileH,
            gameWidth: collisionMap[0].length * tileW,
            gameHeight: collisionMap.length * tileH,
            hasVisibleTerrain(tx, ty) {
                if (
                    ty < 0 ||
                    ty >= visualBlockMap.length ||
                    tx < 0 ||
                    tx >= (visualBlockMap[0]?.length ?? 0)
                ) {
                    return true;
                }
                return visualBlockMap[ty][tx];
            },
            render() {
                if (!tileLayer || !tilesetImage) return;
                const tilesetCols = Math.floor(tilesetImage.width / tileW);
                for (let i = 0; i < tileLayer.data.length; i++) {
                    const gid = tileLayer.data[i];
                    if (gid === 0) continue;
                    const localId = gid - 1;
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
            },
            renderEndpoint(flagSprite = endpointSprite) {
                if (!endPoint || !flagSprite) return;
                const frameW = 64;
                const frameH = 64;
                const frames = Math.max(
                    1,
                    Math.floor(flagSprite.width / frameW),
                );
                const frameIdx = Math.floor(p.frameCount / 8) % frames;
                const endW = endPoint.w || tileW;
                const endH = endPoint.h || tileH;
                const drawX = endPoint.x + endW / 2 - frameW / 2;
                const drawY = endPoint.y + endH - frameH;
                const pulse = 0.72 + 0.28 * Math.sin(p.frameCount * 0.08);
                const glowCx = drawX + frameW / 2;
                const glowCy = drawY + frameH * 0.56;
                const baseY = drawY + frameH - 6;
                const markerY =
                    drawY - 16 + Math.sin(p.frameCount * 0.14) * 2.5;

                p.push();
                p.noStroke();
                p.fill(120, 220, 255, 24 * pulse);
                p.rect(glowCx - 7, drawY - 46, 14, frameH + 56, 5);
                p.fill(120, 220, 255, 14 * pulse);
                p.rect(glowCx - 14, drawY - 34, 28, frameH + 36, 8);
                p.fill(255, 230, 110, 72 * pulse);
                p.ellipse(glowCx, glowCy, frameW * 0.95, frameH * 0.95);
                p.fill(120, 220, 255, 44 * pulse);
                p.ellipse(glowCx, glowCy, frameW * 1.3, frameH * 1.18);
                p.fill(120, 220, 255, 34 * pulse);
                p.ellipse(glowCx, baseY + 1, frameW * 2.0, 24);
                p.fill(120, 220, 255, 40 * pulse);
                p.ellipse(glowCx, baseY, frameW * 1.55, 18);
                p.fill(255, 230, 110, 65 * pulse);
                p.ellipse(glowCx, baseY, frameW * 1.1, 10);
                p.stroke(255, 245, 160, 230);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(drawX - 5, drawY - 5, frameW + 10, frameH + 10, 6);
                p.fill(255, 240, 170, 230);
                p.noStroke();
                p.triangle(
                    glowCx,
                    markerY,
                    glowCx - 9,
                    markerY + 13,
                    glowCx + 9,
                    markerY + 13,
                );
                p.fill(18, 24, 38, 235);
                p.stroke(255, 245, 160, 220);
                p.strokeWeight(1.7);
                p.rect(glowCx - 30, drawY - 35, 60, 18, 4);
                p.noStroke();
                p.fill(255, 245, 170);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(5.2);
                p.text('GOAL', glowCx, drawY - 25.5);
                p.pop();
                p.image(
                    flagSprite,
                    drawX,
                    drawY,
                    frameW,
                    frameH,
                    frameIdx * frameW,
                    0,
                    frameW,
                    frameH,
                );
            },
            renderStartpoint() {
                if (!startPoint) return;
                const T = tileW;
                const cx = startPoint.x + T / 2;
                const cy = startPoint.y + T / 2;
                const pulse = 0.72 + 0.28 * Math.sin(p.frameCount * 0.08);
                const markerY =
                    startPoint.y - 10 + Math.sin(p.frameCount * 0.14) * 2.5;

                p.push();
                p.noStroke();
                p.fill(90, 255, 190, 22 * pulse);
                p.rect(cx - 7, startPoint.y - 34, 14, T + 44, 5);
                p.fill(90, 255, 190, 64 * pulse);
                p.ellipse(cx, cy, T * 0.92, T * 0.92);
                p.fill(80, 200, 255, 40 * pulse);
                p.ellipse(cx, cy, T * 1.28, T * 1.12);
                p.fill(80, 200, 255, 34 * pulse);
                p.ellipse(cx, startPoint.y + T - 4, T * 1.75, 18);
                p.fill(120, 255, 210, 70 * pulse);
                p.ellipse(cx, startPoint.y + T - 4, T * 1.16, 10);

                p.stroke(120, 255, 210, 230);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(startPoint.x - 4, startPoint.y - 4, T + 8, T + 8, 6);

                p.noStroke();
                p.fill(130, 255, 220, 235);
                p.triangle(
                    cx,
                    markerY,
                    cx - 9,
                    markerY + 13,
                    cx + 9,
                    markerY + 13,
                );

                p.fill(18, 24, 38, 235);
                p.stroke(120, 255, 210, 220);
                p.strokeWeight(1.7);
                p.rect(cx - 34, startPoint.y - 24, 68, 18, 4);
                p.noStroke();
                p.fill(180, 255, 230);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(5.2);
                p.text('START', cx, startPoint.y - 14.5);

                p.noStroke();
                p.fill(180, 255, 230, 210);
                p.circle(cx, cy, T * 0.22);
                p.fill(120, 255, 210, 120);
                p.circle(cx, cy, T * 0.44);
                p.pop();
            },
            getCoins() {
                return coinDefs.map((coin) => {
                    const tx = Math.floor((coin.x + tileW * 0.25) / tileW);
                    const ty = Math.floor((coin.y + tileH * 0.25) / tileH);
                    return new Coin(
                        p,
                        coin.x,
                        coin.y,
                        GameConfig.COIN_VALUE,
                        coinSprite,
                        coinHorizontalOffset(tx, ty),
                    );
                });
            },
        };

        ctx.mapPixelWidth = generatedMap.gameWidth;
        ctx.mapPixelHeight = generatedMap.gameHeight;
        ctx.tiledMap = generatedMap;
        ctx.mapKey = mapKey;
        ctx.backgroundImage = this._pickBackgroundFor(mapKey);

        for (const player of ctx.players) {
            player.x = generatedMap.startX;
            player.y = generatedMap.startY;
            player.spawnX = generatedMap.startX;
            player.spawnY = generatedMap.startY;
        }
    }

    _applyAIMapResult(aiResult, mapKey, ctx) {
        const loader = this.mapLoaders[mapKey];
        const tilesetImage = loader.tilesetImage;
        const tileW = GameConfig.TILE;
        const tileH = GameConfig.TILE;
        const p = this.p;

        const cols = 60;
        const rows = 34;

        const collisionMap = [];
        for (let r = 0; r < rows; r++) {
            const rowArray = [];
            for (let c = 0; c < cols; c++) {
                const val = aiResult.map[r * cols + c];
                if (val === 2 || val === 12) {
                    rowArray.push(TileType.SOLID);
                } else {
                    rowArray.push(TileType.EMPTY);
                }
            }
            collisionMap.push(rowArray);
        }

        const startX = (aiResult.startPoint % cols) * tileW;
        const startY = Math.floor(aiResult.startPoint / cols) * tileH;
        const endX = (aiResult.endPoint % cols) * tileW;
        const endY = Math.floor(aiResult.endPoint / cols) * tileH;

        const sr = Math.floor(endY / tileH);
        const sc = Math.floor(endX / tileW);
        if (collisionMap[sr] && collisionMap[sr][sc] !== undefined) {
            collisionMap[sr][sc] = TileType.ENDPOINT;
        }

        const visualBlockMap = Array.from({ length: rows }, (_, r) =>
            Array.from({ length: cols }, (_, c) => {
                const val = aiResult.map[r * cols + c];
                return val === 2 || val === 12;
            }),
        );

        const coinSprite = this._coinSprite;
        const endpointSprite = this._endPointSprite;

        const coinHorizontalOffset = (tx, ty) => {
            const width = visualBlockMap[0]?.length ?? 0;
            const height = visualBlockMap.length;
            const leftBlocked =
                ty < 0 ||
                ty >= height ||
                tx - 1 < 0 ||
                visualBlockMap[ty][tx - 1];
            const rightBlocked =
                ty < 0 ||
                ty >= height ||
                tx + 1 >= width ||
                visualBlockMap[ty][tx + 1];
            if (leftBlocked && !rightBlocked) return tileW * 0.28;
            if (rightBlocked && !leftBlocked) return -tileW * 0.28;
            return 0;
        };

        const coinDefs = [];
        const spawnProbability = 0.3;
        for (let i = 0; i < aiResult.map.length; i++) {
            if (aiResult.map[i] === 2) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                if (row > 0) {
                    const cx = col * tileW;
                    const cy = (row - 1) * tileH;
                    if (
                        !(
                            (cx === startX && cy === startY) ||
                            (cx === endX && cy === endY)
                        )
                    ) {
                        if (Math.random() < spawnProbability) {
                            coinDefs.push({ x: cx, y: cy });
                        }
                    }
                }
            }
        }

        const generatedMap = {
            MAP: collisionMap,
            visualBlockMap,
            startX,
            startY,
            endX,
            endY,
            endW: tileW,
            endH: tileH,
            tilewidth: tileW,
            tileheight: tileH,
            gameWidth: cols * tileW,
            gameHeight: rows * tileH,
            hasVisibleTerrain(tx, ty) {
                if (
                    ty < 0 ||
                    ty >= visualBlockMap.length ||
                    tx < 0 ||
                    tx >= (visualBlockMap[0]?.length ?? 0)
                ) {
                    return true;
                }
                return visualBlockMap[ty][tx];
            },
            render() {
                if (!tilesetImage) return;
                const tilesetCols = Math.floor(tilesetImage.width / tileW);
                for (let i = 0; i < aiResult.map.length; i++) {
                    const gid = aiResult.map[i];
                    if (gid === 0) continue;
                    const localId = gid - 1;
                    const col = i % cols;
                    const row = Math.floor(i / cols);
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
            },
            renderEndpoint(flagSprite = endpointSprite) {
                if (!flagSprite) return;
                const frameW = 64;
                const frameH = 64;
                const frames = Math.max(
                    1,
                    Math.floor(flagSprite.width / frameW),
                );
                const frameIdx = Math.floor(p.frameCount / 8) % frames;
                const drawX = endX + tileW / 2 - frameW / 2;
                const drawY = endY + tileH - frameH;
                const pulse = 0.72 + 0.28 * Math.sin(p.frameCount * 0.08);
                const glowCx = drawX + frameW / 2;
                const glowCy = drawY + frameH * 0.56;
                const baseY = drawY + frameH - 6;
                const markerY =
                    drawY - 16 + Math.sin(p.frameCount * 0.14) * 2.5;

                p.push();
                p.noStroke();
                p.fill(120, 220, 255, 24 * pulse);
                p.rect(glowCx - 7, drawY - 46, 14, frameH + 56, 5);
                p.fill(120, 220, 255, 14 * pulse);
                p.rect(glowCx - 14, drawY - 34, 28, frameH + 36, 8);
                p.fill(255, 230, 110, 72 * pulse);
                p.ellipse(glowCx, glowCy, frameW * 0.95, frameH * 0.95);
                p.fill(120, 220, 255, 44 * pulse);
                p.ellipse(glowCx, glowCy, frameW * 1.3, frameH * 1.18);
                p.fill(120, 220, 255, 34 * pulse);
                p.ellipse(glowCx, baseY + 1, frameW * 2.0, 24);
                p.fill(120, 220, 255, 40 * pulse);
                p.ellipse(glowCx, baseY, frameW * 1.55, 18);
                p.fill(255, 230, 110, 65 * pulse);
                p.ellipse(glowCx, baseY, frameW * 1.1, 10);
                p.stroke(255, 245, 160, 230);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(drawX - 5, drawY - 5, frameW + 10, frameH + 10, 6);
                p.fill(255, 240, 170, 230);
                p.noStroke();
                p.triangle(
                    glowCx,
                    markerY,
                    glowCx - 9,
                    markerY + 13,
                    glowCx + 9,
                    markerY + 13,
                );
                p.fill(18, 24, 38, 235);
                p.stroke(255, 245, 160, 220);
                p.strokeWeight(1.7);
                p.rect(glowCx - 30, drawY - 35, 60, 18, 4);
                p.noStroke();
                p.fill(255, 245, 170);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(5.2);
                p.text('GOAL', glowCx, drawY - 25.5);
                p.pop();
                p.image(
                    flagSprite,
                    drawX,
                    drawY,
                    frameW,
                    frameH,
                    frameIdx * frameW,
                    0,
                    frameW,
                    frameH,
                );
            },
            renderStartpoint() {
                const T = tileW;
                const cx = startX + T / 2;
                const cy = startY + T / 2;
                const pulse = 0.72 + 0.28 * Math.sin(p.frameCount * 0.08);
                const markerY =
                    startY - 10 + Math.sin(p.frameCount * 0.14) * 2.5;

                p.push();
                p.noStroke();
                p.fill(90, 255, 190, 22 * pulse);
                p.rect(cx - 7, startY - 34, 14, T + 44, 5);
                p.fill(90, 255, 190, 64 * pulse);
                p.ellipse(cx, cy, T * 0.92, T * 0.92);
                p.fill(80, 200, 255, 40 * pulse);
                p.ellipse(cx, cy, T * 1.28, T * 1.12);
                p.fill(80, 200, 255, 34 * pulse);
                p.ellipse(cx, startY + T - 4, T * 1.75, 18);
                p.fill(120, 255, 210, 70 * pulse);
                p.ellipse(cx, startY + T - 4, T * 1.16, 10);
                p.stroke(120, 255, 210, 230);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(startX - 4, startY - 4, T + 8, T + 8, 6);
                p.noStroke();
                p.fill(130, 255, 220, 235);
                p.triangle(
                    cx,
                    markerY,
                    cx - 9,
                    markerY + 13,
                    cx + 9,
                    markerY + 13,
                );
                p.fill(18, 24, 38, 235);
                p.stroke(120, 255, 210, 220);
                p.strokeWeight(1.7);
                p.rect(cx - 34, startY - 24, 68, 18, 4);
                p.noStroke();
                p.fill(180, 255, 230);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(5.2);
                p.text('START', cx, startY - 14.5);
                p.noStroke();
                p.fill(180, 255, 230, 210);
                p.circle(cx, cy, T * 0.22);
                p.fill(120, 255, 210, 120);
                p.circle(cx, cy, T * 0.44);
                p.pop();
            },
            getCoins() {
                return coinDefs.map((coin) => {
                    const tx = Math.floor((coin.x + tileW * 0.25) / tileW);
                    const ty = Math.floor((coin.y + tileH * 0.25) / tileH);
                    return new Coin(
                        p,
                        coin.x,
                        coin.y,
                        GameConfig.COIN_VALUE,
                        coinSprite,
                        coinHorizontalOffset(tx, ty),
                    );
                });
            },
        };

        ctx.mapPixelWidth = generatedMap.gameWidth;
        ctx.mapPixelHeight = generatedMap.gameHeight;
        ctx.tiledMap = generatedMap;
        ctx.mapKey = mapKey;
        ctx.backgroundImage = this._pickBackgroundFor(mapKey);

        for (const player of ctx.players) {
            player.x = generatedMap.startX;
            player.y = generatedMap.startY;
            player.spawnX = generatedMap.startX;
            player.spawnY = generatedMap.startY;
        }
    }

    _applySelectedMap(ctx) {
        this.current.setup();

        const mapPixelWidth = this.current.gameWidth;
        const mapPixelHeight = this.current.gameHeight;
        const previousPlayers = Array.isArray(ctx.players) ? ctx.players : [];
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

        players.forEach((player, index) => {
            const prev = previousPlayers[index];
            if (!prev) return;

            player.nickname = prev.nickname ?? player.nickname;

            if (prev.character) {
                const char = prev.character;
                player.character = char;

                const sheet = ctx.sprites[char.spriteKey];
                if (sheet) player.setSprite(sheet, char.animConfig);

                if (char.speed !== undefined) player.speed = char.speed;
                if (char.jumpVel !== undefined) player.jumpVel = char.jumpVel;
                if (char.maxJumps !== undefined) {
                    player.maxJumps = char.maxJumps;
                    player.jumpsLeft = char.maxJumps;
                }
                if (char.gravity !== undefined) player.gravity = char.gravity;
            }
        });

        // Keep a fixed logical viewport across every state so switching maps
        // never changes the game's apparent resolution or zoom level.
        ctx.gameWidth = GameConfig.GAME_WIDTH;
        ctx.gameHeight = GameConfig.GAME_HEIGHT;
        ctx.mapPixelWidth = mapPixelWidth;
        ctx.mapPixelHeight = mapPixelHeight;
        ctx.players = players;
        ctx.tiledMap = this.current;
        ctx.mapKey = this.currentKey;
        ctx.scoreManager = new ScoreManager(players);
        ctx.backgroundImage = this._pickBackgroundFor(this.currentKey);
    }

    _pickBackgroundFor(mapKey) {
        const theme = MapManager.THEME_MAP[mapKey] ?? 'F';
        const pool = this._backgroundImages[theme] ?? [];
        if (pool.length === 0) return null;
        const idx = Math.floor(Math.random() * pool.length);
        return pool[idx] ?? null;
    }

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
                    coins.push({
                        x: obj.x + offsetX,
                        y: obj.y + offsetY,
                    });
                }
            }
        }
        return coins;
    }
}
