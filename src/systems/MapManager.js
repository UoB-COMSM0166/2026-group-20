import { Player } from '../entities/Player.js';
import { ScoreManager } from './ScoreManager.js';
import { TiledMapLoader } from '../maps/TiledMapLoader.js';
import { GameConfig } from '../config/GameConfig.js';

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
    }
}
