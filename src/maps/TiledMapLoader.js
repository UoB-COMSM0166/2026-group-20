import { GameConfig } from '../config/GameConfig.js';
import { Coin } from '../entities/Coin.js';
import { TileType } from '../config/TileType.js';

/**
 * Loads and manages a Tiled JSON map.
 *
 * Responsibilities:
 *   - preloading the JSON + tileset image (call in p5 preload)
 *   - building the collision MAP from the Collision_Layer
 *   - parsing the Object_Layer_1 for startPoint / endPoint
 *   - rendering visible tile layers each frame
 */
export class TiledMapLoader {
    /**
     * @param {p5} p - The p5 instance
     * @param {string} jsonPath   - Path to the Tiled JSON file
     * @param {string} tilesetPath - Path to the tileset image
     */
    constructor(p, jsonPath, tilesetPath) {
        this.p = p;
        this.jsonPath = jsonPath;
        this.tilesetPath = tilesetPath;
        this.baseDir = this.jsonPath.slice(
            0,
            this.jsonPath.lastIndexOf('/') + 1,
        );

        this.mapData = null;
        this.tilesetImage = null;
        this.imageLayerAssets = new Map();

        /** @type {string[][]} Collision map: '#' solid, '.' empty, 'F' endpoint */
        this.MAP = [];

        /** Start position parsed from the object layer */
        this.startX = 0;
        this.startY = 0;

        this.gameWidth = 0;
        this.gameHeight = 0;

        // gid high bits used by Tiled to encode flip flags
        this.GID_FLIP_H = 0x80000000;
        this.GID_FLIP_V = 0x40000000;
        this.GID_FLIP_D = 0x20000000;

        this._tilesetsSorted = [];

        /** @type {p5.Image|null} coin sprite image */
        this.coinSprite = null;

        /** @type {p5.Image|null} endpoint sprite image */
        this.endPointSprite = null;
    }

    /**
     * Set the coin sprite image to use when creating Coin entities.
     * @param {p5.Image} img
     */
    setCoinSprite(img) {
        this.coinSprite = img;
    }

    /**
     * Set the endpoint sprite image to use when rendering the map endpoint.
     * @param {p5.Image} img
     */
    setEndpointSprite(img) {
        this.endPointSprite = img;
    }

    // preload JSON and tileset image
    preload() {
        this.mapData = this.p.loadJSON(this.jsonPath);
        this.tilesetImage = this.p.loadImage(this.tilesetPath);

        // Preload imagelayer assets referenced by this map JSON.
        // Keep multiple candidates to tolerate broken relative paths exported by Tiled.
        this.imageLayerAssets.clear();
        for (const layer of this.mapData.layers || []) {
            if (layer.type !== 'imagelayer' || !layer.image) continue;

            const candidatePaths = this._getImageLayerCandidatePaths(
                layer.image,
            );
            const candidates = candidatePaths.map((path) =>
                this.p.loadImage(path),
            );
            this.imageLayerAssets.set(layer.id, candidates);
        }
    }

    // setup collision map and parse object layer for start/end points
    setup() {
        const { mapData } = this;

        GameConfig.TILE = mapData.tilewidth;
        this.gameWidth = mapData.width * mapData.tilewidth;
        this.gameHeight = mapData.height * mapData.tileheight;

        // Keep firstgid ascending so gid -> tileset lookup is deterministic.
        this._tilesetsSorted = [...(mapData.tilesets || [])].sort(
            (a, b) => a.firstgid - b.firstgid,
        );

        this._generateCollisionMap();
        this._parseObjectLayer();
    }

    // render visible tile layers
    render() {
        const { p, mapData, tilesetImage } = this;
        if (!mapData || !tilesetImage) return;

        const tileW = mapData.tilewidth;
        const tileH = mapData.tileheight;
        const tilesetCols = tilesetImage.width / tileW;

        for (const layer of mapData.layers) {
            if (layer.type === 'imagelayer') {
                if (!layer.visible) continue;
                const img = this._pickLoadedImage(layer.id);
                if (!img) continue;

                const x = layer.x ?? 0;
                const y = layer.y ?? 0;
                p.image(img, x, y);
                continue;
            }

            if (
                layer.type === 'tilelayer' &&
                layer.name !== 'Collision_Layer' &&
                layer.visible !== false
            ) {
                const data = layer.data;
                const cols = layer.width;

                for (let i = 0; i < data.length; i++) {
                    const gidInfo = this._parseGid(data[i]);
                    if (!gidInfo.isEmpty) {
                        const col = i % cols;
                        const row = p.floor(i / cols);
                        const destX = col * tileW;
                        const destY = row * tileH;

                        // Render from tileset-local index (not global gid index).
                        const srcX = (gidInfo.localId % tilesetCols) * tileW;
                        const srcY =
                            p.floor(gidInfo.localId / tilesetCols) * tileH;

                        p.image(
                            tilesetImage,
                            destX,
                            destY,
                            tileW,
                            tileH,
                            srcX,
                            srcY,
                            tileW,
                            tileH,
                        );
                    }
                }
            }
        }

        if (
            this.endPointSprite &&
            this.endX !== undefined &&
            this.endY !== undefined
        ) {
            const fw = 64;
            const fh = 64;
            const frames = 10;
            const frameIdx = p.floor(p.frameCount / 5) % frames;

            // Adjust Y so the 64px tall flag sits on the same bottom edge as the tiled object box
            const drawX = this.endX;
            const drawY = this.endY - (fh - (this.endHeight || tileH));

            p.image(
                this.endPointSprite,
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
    }

    /**
     * Returns the tile character at grid position (tx, ty).
     * Out-of-bounds tiles are treated as solid walls.
     * @param {number} tx
     * @param {number} ty
     * @returns {string}
     */
    getTile(tx, ty) {
        if (
            ty < 0 ||
            ty >= this.MAP.length ||
            tx < 0 ||
            tx >= this.MAP[0].length
        ) {
            return TileType.SOLID;
        }
        return this.MAP[ty][tx];
    }

    /**
     * @param {number} tx
     * @param {number} ty
     * @returns {boolean}
     */
    isSolid(tx, ty) {
        return this.getTile(tx, ty) === TileType.SOLID;
    }

    /**
     * @param {number} tx
     * @param {number} ty
     * @returns {boolean}
     */
    isSpike(tx, ty) {
        return this.getTile(tx, ty) === TileType.SPIKE;
    }

    /**
     * Returns coin entities parsed from object layers.
     * Objects named 'coin' are treated as coin spawn points.
     * @returns {Coin[]}
     */
    /**
     * Returns coin entities from the map's object layer.
     * If a placed obstacle occupies a coin's tile, that coin is relocated
     * to a random free EMPTY tile so the total count never changes.
     *
     * @param {object[]} [placedObstacles=[]]
     * @returns {Coin[]}
     */
    getCoins(placedObstacles = []) {
        const T = GameConfig.TILE;
        const MAP = this.MAP;
        const cols = MAP[0]?.length ?? 0;
        const rows = MAP.length;

        // Build occupied set from placed obstacles
        const occupiedKeys = new Set(
            placedObstacles.map(
                (obs) => `${Math.round(obs.x / T)},${Math.round(obs.y / T)}`,
            ),
        );

        // Candidate relocation tiles: EMPTY with solid directly below
        const candidates = [];
        for (let ty = 0; ty < rows - 1; ty++) {
            for (let tx = 0; tx < cols; tx++) {
                if (
                    MAP[ty][tx] === TileType.EMPTY &&
                    MAP[ty + 1][tx] === TileType.SOLID &&
                    !occupiedKeys.has(`${tx},${ty}`)
                ) {
                    candidates.push({ tx, ty });
                }
            }
        }
        // Fisher-Yates shuffle
        for (let i = candidates.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
        }
        let relocIdx = 0;

        const coins = [];
        for (const layer of this.mapData.layers) {
            if (layer.type !== 'objectgroup') continue;

            for (const obj of layer.objects) {
                if (obj.name !== 'coin') continue;

                let cx = obj.x + obj.width * 0.25;
                let cy = obj.y + obj.height * 0.25;

                // Check if an obstacle is on this coin's tile
                const coinTx = Math.floor((cx + obj.width * 0.25) / T);
                const coinTy = Math.floor((cy + obj.height * 0.25) / T);
                if (occupiedKeys.has(`${coinTx},${coinTy}`)) {
                    if (relocIdx < candidates.length) {
                        const { tx, ty } = candidates[relocIdx++];
                        cx = tx * T + T * 0.25;
                        cy = ty * T + T * 0.25;
                    }
                    // else: stay in place — count always preserved
                }

                coins.push(
                    new Coin(
                        this.p,
                        cx,
                        cy,
                        GameConfig.COIN_VALUE,
                        this.coinSprite,
                    ),
                );
            }
        }

        return coins;
    }

    _generateCollisionMap() {
        const { p, mapData } = this;
        this.MAP = [];
        const cols = mapData.width;
        const rows = mapData.height;

        for (let y = 0; y < rows; y++) {
            const rowArray = [];
            for (let x = 0; x < cols; x++) {
                rowArray.push(TileType.EMPTY);
            }
            this.MAP.push(rowArray);
        }

        // Parse collision layer
        for (const layer of mapData.layers) {
            if (layer.name === 'Collision_Layer') {
                for (let i = 0; i < layer.data.length; i++) {
                    const gidInfo = this._parseGid(layer.data[i]);
                    if (gidInfo.isEmpty) continue;

                    const tileType = this._tileTypeFromGidInfo(gidInfo);
                    const x = i % cols;
                    const y = p.floor(i / cols);
                    this.MAP[y][x] = tileType;
                }
            }
        }
    }

    /**
     * Public helper for systems that want gid conversion info.
     * @param {number} gid
     * @returns {{
     *   rawGid:number,
     *   gid:number,
     *   isEmpty:boolean,
     *   localId:number,
     *   atlasLocalId:number,
     *   firstgid:number,
     *   tileset:object|null,
     *   flipH:boolean,
     *   flipV:boolean,
     *   flipD:boolean
     * }}
     */
    convertGid(gid) {
        return this._parseGid(gid);
    }

    /**
     * Convenience helper when only local id is needed.
     * @param {number} gid
     * @returns {number}
     */
    gidToLocalId(gid) {
        return this._parseGid(gid).localId;
    }

    _tileTypeFromGidInfo(gidInfo) {
        // localId is only unique inside a specific tileset.
        // Keep mappings scoped by tileset source/name to avoid collisions.
        const source = gidInfo.tileset?.source || gidInfo.tileset?.name || '';
        const localId = gidInfo.localId;

        // Current map's Collision_Layer uses gid 76 -> firstgid 62 -> localId 14.
        if (source.includes('tileset5_forest') && localId === 14) {
            return TileType.SOLID;
        }

        // Fallback for existing maps where all non-empty collision tiles are solid.
        return TileType.SOLID;
    }

    _parseGid(rawGid) {
        // Force unsigned 32-bit so bit flags work reliably in JS.
        const raw = rawGid >>> 0;

        const flipH = (raw & this.GID_FLIP_H) !== 0;
        const flipV = (raw & this.GID_FLIP_V) !== 0;
        const flipD = (raw & this.GID_FLIP_D) !== 0;

        // Remove flip bits to get the actual global tile id.
        const gid =
            raw & ~(this.GID_FLIP_H | this.GID_FLIP_V | this.GID_FLIP_D);

        if (gid === 0) {
            return {
                rawGid: raw,
                gid,
                isEmpty: true,
                localId: -1,
                atlasLocalId: -1,
                firstgid: 0,
                tileset: null,
                flipH,
                flipV,
                flipD,
            };
        }

        const tileset = this._findTilesetForGid(gid);
        const firstgid = tileset?.firstgid ?? 1;

        return {
            rawGid: raw,
            gid,
            isEmpty: false,
            localId: gid - firstgid,
            atlasLocalId: gid - 1,
            firstgid,
            tileset,
            flipH,
            flipV,
            flipD,
        };
    }

    _findTilesetForGid(gid) {
        let selected = null;
        for (const ts of this._tilesetsSorted) {
            if (gid >= ts.firstgid) selected = ts;
            else break;
        }
        return selected;
    }

    _resolveLayerImagePath(layerImagePath) {
        if (layerImagePath.startsWith('src/')) return layerImagePath;
        return `${this.baseDir}${layerImagePath}`;
    }

    _getImageLayerCandidatePaths(layerImagePath) {
        const fileName = this._extractFileName(layerImagePath);
        const candidates = [
            this._resolveLayerImagePath(layerImagePath),
            layerImagePath,
            `${this.baseDir}${fileName}`,
            `${this.baseDir}background.png`,
        ];

        // Remove empty/duplicate candidates while keeping order.
        return [...new Set(candidates.filter(Boolean))];
    }

    _extractFileName(path) {
        const normalized = String(path).replace(/\\/g, '/');
        const idx = normalized.lastIndexOf('/');
        return idx === -1 ? normalized : normalized.slice(idx + 1);
    }

    _pickLoadedImage(layerId) {
        const entry = this.imageLayerAssets.get(layerId);
        if (!entry) return null;

        const candidates = Array.isArray(entry) ? entry : [entry];
        for (const img of candidates) {
            if (!img) continue;

            // p5 leaves failed images at 1x1, while valid assets have real dimensions.
            if (img.width > 1 && img.height > 1) {
                return img;
            }
        }

        return null;
    }

    _parseObjectLayer() {
        const { p, mapData } = this;

        for (const layer of mapData.layers) {
            if (layer.name !== 'Object_Layer_1') continue;

            for (const obj of layer.objects) {
                if (obj.name === 'startPoint') {
                    this.startX = obj.x;
                    this.startY = obj.y;
                } else if (obj.name === 'endPoint') {
                    this.endX = obj.x;
                    this.endY = obj.y;
                    this.endWidth = obj.width;
                    this.endHeight = obj.height;

                    const startCol = p.floor(obj.x / mapData.tilewidth);
                    const startRow = p.floor(obj.y / mapData.tileheight);
                    const endCol = p.floor(
                        (obj.x + obj.width) / mapData.tilewidth,
                    );
                    const endRow = p.floor(
                        (obj.y + obj.height) / mapData.tileheight,
                    );

                    for (let r = startRow; r <= endRow; r++) {
                        for (let c = startCol; c <= endCol; c++) {
                            if (this.MAP[r] && this.MAP[r][c] !== undefined) {
                                this.MAP[r][c] = TileType.ENDPOINT;
                            }
                        }
                    }
                }
            }
        }
    }
}
