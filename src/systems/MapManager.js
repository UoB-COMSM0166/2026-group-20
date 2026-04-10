import { Player } from '../entities/Player.js';
import { ScoreManager } from './ScoreManager.js';
import { TiledMapLoader } from '../maps/TiledMapLoader.js';

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

        this.currentKey = 'map1';
        this.current = this.mapLoaders.map1;
    }

    preloadAll() {
        for (const loader of Object.values(this.mapLoaders)) {
            loader.preload();
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

        ctx.gameWidth = gameWidth;
        ctx.gameHeight = gameHeight;
        ctx.players = players;
        ctx.tiledMap = this.current;
        ctx.mapKey = this.currentKey;
        ctx.scoreManager = new ScoreManager(players);
    }
}
