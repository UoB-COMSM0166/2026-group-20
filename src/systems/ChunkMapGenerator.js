import { TileType } from '../config/TileType.js';

/**
 * Procedural map generator that loads pre-authored map chunks and merges
 * them into a complete playable map.
 *
 * Chunk naming convention (from assets/maps/chunks/):
 *   {THEME}_{TYPE}_{DIFFICULTY}_{EDGE}_{INDEX}.json
 *
 *   THEME     — map theme, e.g. 'I' (ice)
 *   TYPE      — N (normal) | S (has startPoint) | E (has endPoint)
 *   DIFFICULTY — difficulty tier, e.g. 1
 *   EDGE      — bitmask: 1=top 2=right 4=bottom 8=left (passage connectivity)
 *   INDEX     — sequential number
 *
 *   e.g. I_N_1_9_15.json  →  ice theme, normal chunk, difficulty 1,
 *                            left+right passage (9), index 15
 *
 * The generator works in three phases:
 *   1. discover  — scan the chunk directory and group by {THEME}_{TYPE}_{DIFFICULTY}
 *   2. select    — pick S + N×10 + E chunks in horizontal-run order
 *   3. merge     — stitch chunks together, remap GIDs, and emit a Tiled-compatible object
 */
export class ChunkMapGenerator {
    /**
     * @param {p5} p — p5 instance (used for p5.loadJSON)
     */
    constructor(p) {
        this.p = p;
        /** @type {Map<string, object[]>} prefix → list of loaded chunk JSONs */
        this.chunkPool = new Map();
        /** @type {object[]} currently selected chunks in merge order */
        this.selectedChunks = [];
        /** Final merged map data (Tiled JSON compatible) */
        this.mergedMapData = null;
        this.gridCols = 4;
        this.gridRows = 3;
    }

    // ─── Phase 1: Discovery ──────────────────────────────────────────────────

    /**
     * Load all chunk JSONs from the given directory.
     * Call this inside p5.preload().
     * @param {string} chunkDir - e.g. 'assets/maps/chunks/'
     */
    preload(chunkDir = 'assets/maps/chunks/') {
        const names = this.p
            .loadStrings(chunkDir + 'index.json')
            .split('\n')
            .filter(Boolean);
        for (const name of names) {
            const json = this.p.loadJSON(chunkDir + name);
            this._registerChunk(json, name);
        }
    }

    /**
     * Alternative: scan a flat list of chunk file names.
     * Use this if there is no index file.
     * @param {string} chunkDir
     * @param {string[]} filenames
     */
    preloadFlat(chunkDir, filenames) {
        for (const filename of filenames) {
            const json = this.p.loadJSON(chunkDir + filename);
            this._registerChunk(json, filename);
        }
    }

    /**
     * @param json
     * @param filename
     * @internal
     */
    _registerChunk(json, filename) {
        const key = this._chunkPrefix(filename); // e.g. 'I_N_1_10'
        if (!this.chunkPool.has(key)) {
            this.chunkPool.set(key, []);
        }
        this.chunkPool.get(key).push(json);
    }

    /**
     * Extracts the pool key from a chunk filename.
     * e.g. 'I_N_1_9_15.json' → 'I_N_1'
     *       {THEME}_{TYPE}_{DIFFICULTY}_{EDGE}_{INDEX}.json
     * Keeps only the first three underscore-separated fields.
     * @param {string} filename
     * @returns {string}
     */
    _chunkPrefix(filename) {
        const base = filename.replace(/\.json$/, '');
        const parts = base.split('_');
        return parts.slice(0, 3).join('_'); // {THEME}_{TYPE}_{DIFFICULTY}
    }

    // ─── Phase 2: Selection ───────────────────────────────────────────────────

    /**
     * Select chunks for a horizontal run: 1 start (S) + N normal (N) + 1 end (E).
     * Pool key format: {THEME}_{TYPE}_{DIFFICULTY}  e.g. 'I_S_1', 'I_N_1', 'I_E_1'
     * @param {string} theme     - map theme, e.g. 'I'
     * @param {number} difficulty - difficulty tier, e.g. 1
     * @param {number} normalCount - how many normal chunks to insert between S and E (default 10)
     */
    selectHorizontalRun(theme, difficulty, normalCount = 10) {
        const sPrefix = `${theme}_S_${difficulty}`;
        const nPrefix = `${theme}_N_${difficulty}`;
        const ePrefix = `${theme}_E_${difficulty}`;

        const pick = (prefix, count) => {
            const pool = this.chunkPool.get(prefix);
            if (!pool || pool.length === 0) {
                throw new Error(
                    `ChunkMapGenerator: no chunks found for prefix "${prefix}"`,
                );
            }
            // Randomly pick 'count' unique chunks (no duplicates in the run).
            // If pool is smaller than count, just return all available.
            const indices = new Set();
            while (indices.size < Math.min(count, pool.length)) {
                indices.add(Math.floor(Math.random() * pool.length));
            }
            return [...indices].map((i) => pool[i]);
        };

        this.selectedChunks = [
            ...pick(sPrefix, 1),
            ...pick(nPrefix, normalCount),
            ...pick(ePrefix, 1),
        ];
    }

    /**
     * Select a 2-D grid of normal chunks. Useful for open-world / explorer modes.
     * Every cell uses the same {THEME}_N_{DIFFICULTY} pool.
     * Grid dimensions come from this.gridCols and this.gridRows.
     * @param {string} theme
     * @param {number} difficulty
     */
    selectGrid(theme, difficulty) {
        const nPrefix = `${theme}_N_${difficulty}`;
        const pool = this.chunkPool.get(nPrefix);
        if (!pool || pool.length === 0) {
            throw new Error(
                `ChunkMapGenerator: no chunks found for prefix "${nPrefix}"`,
            );
        }

        const total = this.gridCols * this.gridRows;
        // Pick 'total' unique random indices; pad with repeats if pool is too small.
        const indices = [];
        const seen = new Set();
        while (indices.length < total) {
            const r = Math.floor(Math.random() * pool.length);
            if (!seen.has(r)) seen.add(r);
            indices.push(r);
        }

        this.selectedChunks = indices.map((i) => pool[i]);
    }

    /**
     * Free-form selection — provide the exact chunk objects directly.
     * @param {object[]} chunks
     */
    selectChunks(chunks) {
        this.selectedChunks = chunks;
    }

    // ─── Phase 3: Merge ─────────────────────────────────────────────────────

    /**
     * Merge selected chunks into a single map data object.
     * After calling this, call buildCollisionMap() to get the MAP grid.
     * @param {'horizontal'|'vertical'} direction - how chunks are arranged
     * @returns {object} merged Tiled-compatible JSON (without Image_Layer)
     */
    merge(direction = 'horizontal') {
        if (this.selectedChunks.length === 0) {
            throw new Error(
                'ChunkMapGenerator: no chunks selected — call select* first',
            );
        }

        let cols, rows;

        if (direction === 'horizontal') {
            // For a horizontal run the caller already placed S + N + E in order.
            cols = this.selectedChunks.length;
            rows = 1;
        } else if (direction === 'vertical') {
            cols = 1;
            rows = this.selectedChunks.length;
        } else {
            throw new Error(`merge: unknown direction "${direction}"`);
        }

        // ── dimensions
        const tileW = this.selectedChunks[0].tilewidth;
        const tileH = this.selectedChunks[0].tileheight;
        const chunkW = this.selectedChunks[0].width;
        const chunkH = this.selectedChunks[0].height;

        const totalWidth = chunkW * cols;
        const totalHeight = chunkH * rows;

        // ── merged layer templates
        const mergedLayers = this._createMergedLayerTemplates(
            direction,
            cols,
            rows,
            chunkW,
            chunkH,
        );

        // ── GID remapping table
        // Key: original_gid (from chunk), Value: global_gid (in final map)
        // For now this is a pass-through identity map; extend in _remapGid()
        const gidTable = this._buildGidTable();

        // ── stamp each chunk into the merged layers
        let chunkIdx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const chunk = this.selectedChunks[chunkIdx++];
                const offsetX = c * chunkW;
                const offsetY = r * chunkH;
                this._stampChunk(
                    chunk,
                    mergedLayers,
                    gidTable,
                    offsetX,
                    offsetY,
                );
            }
        }

        this.mergedMapData = {
            width: totalWidth,
            height: totalHeight,
            tilewidth: tileW,
            tileheight: tileH,
            layers: mergedLayers.map((l) => ({
                name: l.name,
                type: l.type,
                width: l.width,
                height: l.height,
                data: l.data,
            })),
            tilesets: this._collectTilesets(),
        };

        return this.mergedMapData;
    }

    /**
     * Merge selected chunks into a 2-D grid layout.
     * Call after selectGrid().
     * Grid dimensions come from this.gridCols and this.gridRows.
     * @returns {object} merged Tiled-compatible JSON
     */
    mergeGrid() {
        if (this.selectedChunks.length === 0) {
            throw new Error(
                'ChunkMapGenerator: no chunks selected — call select* first',
            );
        }

        const cols = this.gridCols;
        const rows = this.gridRows;

        const tileW = this.selectedChunks[0].tilewidth;
        const tileH = this.selectedChunks[0].tileheight;
        const chunkW = this.selectedChunks[0].width;
        const chunkH = this.selectedChunks[0].height;

        const totalWidth = chunkW * cols;
        const totalHeight = chunkH * rows;

        const mergedLayers = this._createMergedLayerTemplates(
            'grid',
            cols,
            rows,
            chunkW,
            chunkH,
        );
        const gidTable = this._buildGidTable();

        // selectedChunks is in row-major order: row0 col0, row0 col1, ..., row1 col0, ...
        let chunkIdx = 0;
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const chunk = this.selectedChunks[chunkIdx++];
                this._stampChunk(
                    chunk,
                    mergedLayers,
                    gidTable,
                    c * chunkW,
                    r * chunkH,
                );
            }
        }

        this.mergedMapData = {
            width: totalWidth,
            height: totalHeight,
            tilewidth: tileW,
            tileheight: tileH,
            layers: mergedLayers.map((l) => ({
                name: l.name,
                type: l.type,
                width: l.width,
                height: l.height,
                data: l.data,
            })),
            tilesets: this._collectTilesets(),
        };

        return this.mergedMapData;
    }

    /**
     * @param _direction
     * @param cols
     * @param rows
     * @param chunkW
     * @param _chunkH
     * @internal
     */
    _createMergedLayerTemplates(_direction, cols, rows, chunkW, _chunkH) {
        const totalWidth = chunkW * cols;
        const totalHeight = _chunkH * rows;
        const totalTiles = totalWidth * totalHeight;

        // Match the layer structure of the source chunks
        return [
            {
                name: 'Tile_Layer_1',
                type: 'tilelayer',
                width: totalWidth,
                height: totalHeight,
                data: new Array(totalTiles).fill(0),
                output: null, // filled below
            },
            {
                name: 'Collision_Layer',
                type: 'tilelayer',
                width: totalWidth,
                height: totalHeight,
                data: new Array(totalTiles).fill(0),
                output: null,
            },
        ];
    }

    /** @internal */
    _buildGidTable() {
        // Returns a Map<number, number> identity remapping.
        // Override this in a subclass if chunks use different tilesets.
        return new Map();
    }

    /**
     * @param gid
     * @param gidTable
     * @internal
     */
    _remapGid(gid, gidTable) {
        if (gid === 0) return 0;
        return gidTable.has(gid) ? gidTable.get(gid) : gid;
    }

    /**
     * @param chunk
     * @param mergedLayers
     * @param gidTable
     * @param offsetX
     * @param offsetY
     * @internal
     */
    _stampChunk(chunk, mergedLayers, gidTable, offsetX, offsetY) {
        const chunkW = chunk.width;
        const chunkH = chunk.height;

        for (const layer of chunk.layers) {
            if (layer.type !== 'tilelayer') continue;

            const mergedLayer = mergedLayers.find((l) => l.name === layer.name);
            if (!mergedLayer) continue;

            const srcData = layer.data;
            for (let i = 0; i < srcData.length; i++) {
                const srcGid = srcData[i];
                const remapped = this._remapGid(srcGid, gidTable);
                const col = i % chunkW;
                const row = Math.floor(i / chunkW);
                const destIdx =
                    (offsetY + row) * mergedLayer.width + (offsetX + col);
                mergedLayer.data[destIdx] = remapped;
            }
        }
    }

    /** Collects unique tilesets from all selected chunks */
    _collectTilesets() {
        const seen = new Set();
        const tilesets = [];
        for (const chunk of this.selectedChunks) {
            for (const ts of chunk.tilesets || []) {
                const key = ts.firstgid;
                if (!seen.has(key)) {
                    seen.add(key);
                    tilesets.push(ts);
                }
            }
        }
        return tilesets.sort((a, b) => a.firstgid - b.firstgid);
    }

    // ─── Collision map output ───────────────────────────────────────────────

    /**
     * Build a string[][] collision grid from the merged Collision_Layer.
     * Values are TileType constants ('solid', 'empty', 'spike', 'endPoint', etc.)
     * @returns {string[][]}
     */
    buildCollisionMap() {
        if (!this.mergedMapData) {
            throw new Error(
                'ChunkMapGenerator: call merge() before buildCollisionMap()',
            );
        }

        const collisionLayer = this.mergedMapData.layers.find(
            (l) => l.name === 'Collision_Layer',
        );
        if (!collisionLayer) return [];

        const rows = this.mergedMapData.height;
        const cols = this.mergedMapData.width;
        const data = collisionLayer.data;
        const map = [];

        for (let r = 0; r < rows; r++) {
            const row = [];
            for (let c = 0; c < cols; c++) {
                const gid = data[r * cols + c];
                row.push(this._gidToTileType(gid));
            }
            map.push(row);
        }

        return map;
    }

    /**
     * @param gid
     * @internal
     */
    _gidToTileType(gid) {
        if (gid === 0) return TileType.EMPTY;
        // Chunk-specific: 15 → solid (ice tileset local-id 14 + firstgid 1 → 15)
        if (gid === 15) return TileType.SOLID;
        // Extend with more GID→TileType mappings as needed
        return TileType.EMPTY;
    }

    // ─── Helpers ────────────────────────────────────────────────────────────

    /** Returns startPoint {x, y} from the first chunk's object layer */
    getStartPoint() {
        return this._findObject('startPoint');
    }

    /** Returns endPoint {x, y} from the last chunk's object layer */
    getEndPoint() {
        return this._findObject('endPoint');
    }

    /**
     * @param name
     * @internal
     */
    _findObject(name) {
        for (const chunk of this.selectedChunks) {
            for (const layer of chunk.layers || []) {
                if (layer.type !== 'objectgroup') continue;
                for (const obj of layer.objects || []) {
                    if (obj.name === name) {
                        return { x: obj.x, y: obj.y };
                    }
                }
            }
        }
        return null;
    }
}
