import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { HandleInput } from '../systems/HandleInput.js';
import { getPixelatedSprite } from '../utils/PixelSprite.js';

/**
 * WalkMapState — walk-to-select map selection screen.
 *
 * Both players share the screen. Two portal doors are rendered at fixed
 * positions. A player walks their character into a portal to select that map.
 * The first player to enter a portal selects the map for everyone.
 *
 * Whichever portal is entered calls ctx.selectMap(key) and goTo(TUTORIAL).
 *
 * Controls: same as in-game (A/D + W for P1, ←/→ + ↑ for P2)
 * ESC — go back to MENU
 */
export class WalkMapState extends State {

    enter() {
        const { p, players, mapPreviews } = this.ctx;

        const gW  = this.ctx.gameWidth  || 960;
        const gH  = this.ctx.gameHeight || 400;
        const T   = GameConfig.TILE || 32;

        // Place walkers at bottom-centre of the selection arena
        // Each player controls their selected character
        this._walkers = players.map((pl, i) => ({
            x:   gW / 2 + (i === 0 ? -60 : 60),
            y:   gH - T * 3,
            vx:  0,
            vy:  0,
            w:   28,
            h:   34,
            onG: false,
            jumpsLeft: 2,
            jumpHeld: false,
            idx: i,
            col: i === 0 ? [90, 170, 255] : [255, 200, 80],
            inp: new HandleInput(p, i),
            player: pl, // 保存玩家引用
        }));

        // Portals: left = map1, right = map2
        this._portals = [
            {
                key: 'map1',
                label: 'Forest Map',
                subtitle: 'lush woodland run',
                x: 96,
                y: 128,
                w: 300,
                h: 220,
                col: [88, 170, 120],
                img: mapPreviews?.map1 ?? null,
            },
            {
                key: 'map2',
                label: 'Ice Map',
                subtitle: 'slippery frozen climb',
                x: gW - 96 - 300,
                y: 128,
                w: 300,
                h: 220,
                col: [120, 190, 255],
                img: mapPreviews?.map2 ?? null,
            },
        ];

        this._age      = 0;
        this._selectedMap = {}; // 记录每个玩家选择的地图
        this._selectTimer = 0; // brief delay before transitioning
        this._previewCache = new Map();
    }

    update(deltaTime) {
        const dt  = deltaTime / 16.67;
        const gW  = this.ctx.gameWidth  || 960;
        const gH  = this.ctx.gameHeight || 400;
        const T   = GameConfig.TILE || 32;
        const GR  = 0.7; // gravity
        const SPD = 3.2;
        const JMP = 12;
        const FLOOR = gH - T;

        this._age += deltaTime;

        // Check if both players have selected same map - if so, wait and transition
        const p1MapSelected = this._selectedMap[0];
        const p2MapSelected = this._selectedMap[1];
        
        if (p1MapSelected && p2MapSelected && p1MapSelected === p2MapSelected) {
            this._selectTimer += deltaTime;
            if (this._selectTimer >= 600) {
                this.ctx.selectMap(p1MapSelected);
                this.goTo(GameStage.TUTORIAL);
            }
            return;
        }

        for (const w of this._walkers) {
            // Horizontal input
            const left  = w.inp.left;
            const right = w.inp.right;
            w.vx = left ? -SPD : right ? SPD : w.vx * 0.85;

            // Gravity
            w.vy += GR * dt;

            // Move
            w.x += w.vx * dt;
            w.y += w.vy * dt;

            // Floor collision
            if (w.y + w.h >= FLOOR) {
                w.y = FLOOR - w.h;
                w.vy = 0;
                w.onG = true;
                w.jumpsLeft = 2;
            }

            // Clamp horizontal
            w.x = Math.max(0, Math.min(gW - w.w, w.x));

            // Double jump
            if (w.onG) {
                w.jumpsLeft = 2;
            }
            if (w.inp.jump && !w.jumpHeld && w.jumpsLeft > 0) {
                w.vy = -JMP;
                w.onG = false;
                w.jumpsLeft -= 1;

                if (!this._selectedMap[w.idx]) {
                    this.ctx.audioManager?.playSound('jump');
                }
            }
            w.jumpHeld = w.inp.jump;

            // Check portal entry
            for (const portal of this._portals) {
                const ox = w.x + w.w / 2;
                const oy = w.y + w.h / 2;
                if (ox > portal.x && ox < portal.x + portal.w &&
                    oy > portal.y && oy < portal.y + portal.h) {
                    if (this._selectedMap[w.idx] !== portal.key) {
                        this._selectedMap[w.idx] = portal.key;
                        this.ctx.audioManager?.playSound('finish');
                    }
                }
            }
        }
    }

    render(mx, my) {
        const { p, players } = this.ctx;
        const gW = this.ctx.gameWidth  || 960;
        const gH = this.ctx.gameHeight || 400;
        const T  = GameConfig.TILE || 32;

        // Background
        if (this.ctx.walkMapBg) {
            const bg = this.ctx.walkMapBg;
            const scale = Math.min(gW / bg.width, gH / bg.height);
            const drawW = bg.width * scale;
            const drawH = bg.height * scale;
            const drawX = (gW - drawW) / 2;
            const drawY = (gH - drawH) / 2;
            p.image(bg, drawX, drawY, drawW, drawH);
        } else {
            p.background(12, 16, 28);
        }

        // Floor
        p.noStroke();
        p.fill(40, 44, 68);
        p.rect(0, gH - T, gW, T);
        p.fill(60, 65, 95);
        p.rect(0, gH - T, gW, 4);

        // Title
        p.fill(255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(9);
        p.text('SELECT YOUR MAP', gW / 2, 10);

        if (p.frameCount % 120 < 80) {
            p.fill(255);
            p.textSize(5);
            p.text('Double jump over your choice to lock in the match', gW / 2, 45);
        }

        p.fill(255, 150);
        p.textSize(5);
        p.text('ESC TO GO BACK', gW / 2, 70);
        
        const p1Char = players[0]?.character?.displayName || 'Character';
        const p2Char = players[1]?.character?.displayName || 'Character';
        p.textAlign(p.LEFT, p.TOP);
        p.text(`P1: ${p1Char}`, 20, 72);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`${p2Char} :P2`, gW - 20, 72);

        // Map cards
        for (const portal of this._portals) {
            const pulse = 0.85 + 0.15 * Math.sin(this._age * 0.004);
            const p1Selected = this._selectedMap[0] === portal.key;
            const p2Selected = this._selectedMap[1] === portal.key;
            const bothSelected = p1Selected && p2Selected;
            const alpha = bothSelected ? 255 : (p1Selected || p2Selected) ? 200 : 180 * pulse;
            const hovered =
                mx > portal.x && mx < portal.x + portal.w &&
                my > portal.y && my < portal.y + portal.h;

            // Card glow
            p.noStroke();
            p.fill(...portal.col, bothSelected ? 60 : hovered ? 48 : 28);
            p.rect(portal.x - 10, portal.y - 10, portal.w + 20, portal.h + 20, 10);

            // Preview frame
            p.fill(18, 24, 40, alpha);
            p.rect(portal.x, portal.y, portal.w, portal.h, 10);

            if (portal.img) {
                this._drawPixelPreview(
                    p,
                    portal.key,
                    portal.img,
                    portal.x + 8,
                    portal.y + 8,
                    portal.w - 16,
                    portal.h - 58,
                );
            } else {
                p.fill(...portal.col, 120);
                p.rect(portal.x + 8, portal.y + 8, portal.w - 16, portal.h - 58, 6);
            }

            // Bottom info plate
            p.fill(8, 12, 22, 220);
            p.rect(portal.x + 8, portal.y + portal.h - 48, portal.w - 16, 40, 6);

            // Frame stroke
            p.stroke(...portal.col, bothSelected ? 255 : hovered ? 220 : 170);
            p.strokeWeight(bothSelected ? 3 : 2);
            p.noFill();
            p.rect(portal.x, portal.y, portal.w, portal.h, 10);
            p.noStroke();

            // Label above portal
            const col2 = bothSelected ? [255, 255, 100] : (p1Selected || p2Selected) ? [255, 200, 100] : [230, 236, 255];
            p.fill(...col2);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(6);
            p.text(portal.label, portal.x + portal.w / 2, portal.y + portal.h - 42);
            p.fill(120, 140, 175);
            p.textSize(4.6);
            p.text(portal.subtitle, portal.x + portal.w / 2, portal.y + portal.h - 24);

            // Selection indicator
            if (p1Selected || p2Selected) {
                p.fill(255, 255, 100);
                p.textSize(5);
                const indicators = [];
                if (p1Selected) indicators.push('P1');
                if (p2Selected) indicators.push('P2');
                if (bothSelected) {
                    p.text('READY!', portal.x + portal.w / 2, portal.y - 14);
                } else {
                    p.text(indicators.join('+'), portal.x + portal.w / 2, portal.y - 14);
                }
            }
        }

        // Draw walkers
        for (const w of this._walkers) {
            const pl = this.ctx.players[w.idx];
            p.noStroke();

            // Draw sprite if available, else coloured rect
            if (pl && pl.framesArr && pl.framesArr.length > 0 && pl.animConfig) {
                const frames = pl.animConfig.IDLE;
                const fi     = frames[Math.floor(this._age / 200) % frames.length];
                const img    = getPixelatedSprite(p, pl.framesArr[fi], pl.character?.pixelScale ?? 1);
                if (img) {
                    const scale = 2.5;
                    const dw = pl.w * scale;
                    const dh = pl.h * scale;
                    p.push();
                    p.noSmooth();
                    if (w.vx < 0) {
                        p.translate(w.x + dw / 2, w.y + dh / 2 - (dh - w.h) / 2);
                        p.scale(-1, 1);
                        p.image(img, -dw / 2, -dh / 2, dw, dh);
                    } else {
                        p.image(img, w.x - (dw - w.w) / 2, w.y - (dh - w.h) / 2, dw, dh);
                    }
                    p.pop();
                } else {
                    p.fill(...w.col);
                    p.rect(w.x, w.y, w.w, w.h, 4);
                }
            } else {
                p.fill(...w.col);
                p.rect(w.x, w.y, w.w, w.h, 4);
            }

            // Player label
            p.fill(...w.col);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(5.5);
            p.text(`P${w.idx + 1}`, w.x + w.w / 2, w.y - 4);

            this._drawControlHint(p, w);
        }

    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.CHAR_SELECT);
        }
    }

    _drawPixelPreview(p, key, img, x, y, w, h) {
        const cacheKey = `${key}:${Math.round(w)}x${Math.round(h)}`;
        let preview = this._previewCache.get(cacheKey);

        if (!preview) {
            const sampleScale = 0.24;
            const sampleW = Math.max(24, Math.round(w * sampleScale));
            const sampleH = Math.max(18, Math.round(h * sampleScale));
            const lowRes = p.createGraphics(sampleW, sampleH);
            lowRes.noSmooth();
            lowRes.image(img, 0, 0, sampleW, sampleH);

            preview = p.createGraphics(Math.round(w), Math.round(h));
            preview.noSmooth();
            preview.image(lowRes, 0, 0, w, h);
            this._previewCache.set(cacheKey, preview);
        }

        p.push();
        p.noSmooth();
        p.image(preview, x, y, w, h);
        p.pop();
    }

    _drawControlHint(p, walker) {
        const centerX = walker.x + walker.w / 2;
        const topY = walker.y - 78;
        const keyW = 18;
        const keyH = 18;
        const gap = 5;
        const baseCol = walker.idx === 0 ? [90, 170, 255] : [255, 200, 80];
        const keys = walker.idx === 0
            ? { up: 'W', left: 'A', down: 'S', right: 'D' }
            : { up: '↑', left: '←', down: '↓', right: '→' };
        const rowY = topY + keyH + gap;
        const crossX = centerX - (keyW * 1.5 + gap) - 6;
        const crossY = topY - 6;
        const crossW = keyW * 3 + gap * 2 + 12;
        const crossH = keyH * 2 + gap + 12;

        p.push();
        p.textFont(GameConfig.FONT);
        p.textSize(4.8);
        p.textAlign(p.CENTER, p.CENTER);

        p.noStroke();
        p.fill(8, 12, 22, 82);
        p.rect(crossX + keyW + gap, crossY, keyW + 12, crossH, 7);
        p.rect(crossX, crossY + keyH + gap, crossW, keyH + 12, 7);
        p.fill(255, 255, 255, 10);
        p.rect(crossX + keyW + gap + 2, crossY + 2, keyW + 8, crossH * 0.32, 6);
        p.rect(crossX + 2, crossY + keyH + gap + 2, crossW - 4, (keyH + 12) * 0.28, 6);
        p.stroke(baseCol[0], baseCol[1], baseCol[2], 85);
        p.strokeWeight(1);
        p.noFill();
        p.rect(crossX + keyW + gap, crossY, keyW + 12, crossH, 7);
        p.rect(crossX, crossY + keyH + gap, crossW, keyH + 12, 7);

        const drawKey = (label, x, y, alpha = 120, highlighted = false) => {
            p.noStroke();
            p.fill(
                highlighted
                    ? [22, 28, 44, Math.min(220, alpha + 55)]
                    : [10, 14, 26, alpha],
            );
            p.rect(x, y, keyW, keyH, 5);
            p.fill(
                highlighted
                    ? [255, 255, 255, 42]
                    : [255, 255, 255, 18],
            );
            p.rect(x + 1, y + 1, keyW - 2, keyH * 0.42, 4);
            if (highlighted) {
                p.noStroke();
                p.fill(baseCol[0], baseCol[1], baseCol[2], 45);
                p.rect(x - 3, y - 3, keyW + 6, keyH + 6, 6);
            }
            p.stroke(
                baseCol[0],
                baseCol[1],
                baseCol[2],
                highlighted ? 255 : 180,
            );
            p.strokeWeight(highlighted ? 1.8 : 1.2);
            p.noFill();
            p.rect(x, y, keyW, keyH, 5);
            p.noStroke();
            p.fill(240, 244, 255, highlighted ? 255 : 205);
            p.text(label, x + keyW / 2, y + keyH / 2 + 0.5);
        };

        drawKey(keys.up, centerX - keyW / 2, topY, 170, true);
        drawKey(keys.left, centerX - keyW * 1.5 - gap, rowY);
        drawKey(keys.down, centerX - keyW / 2, rowY, 95);
        drawKey(keys.right, centerX + keyW / 2 + gap, rowY);
        p.pop();
    }
}
