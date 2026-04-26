import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';
import { drawShadowIcon } from '../utils/ShadowIcon.js';
import { drawBombIcon } from '../utils/BombIcon.js';

const ITEM_SUMMARIES = {
    PLATFORM: 'Solid support block.',
    MOVING_PLATFORM: 'Horizontal moving lift.',
    FALLING_PLATFORM: 'Drops after contact.',
    ICE_PLATFORM: 'Slippery solid tile.',
    BOUNCE_PAD: 'Launches players upward.',
    SPIKE: 'Contact kills instantly.',
    CANNON: 'Shoots timed projectiles.',
    SAW: 'Rotating instant-kill blade.',
    FLAME: 'Hazard that blinks on and off.',
    SPIKED_BALL: 'Heavy static hazard.',
    ICE_BLOCK: 'Slide-through speed zone.',
    WIND_ZONE: 'Push field with direction.',
    TELEPORTER: 'Links a two-portal pair.',
    BOMB: 'Triggered explosive trap.',
    SHADOW: 'Replays the last 5 seconds.',
};

// Rich item descriptions for hover tooltips
const ITEM_DESCRIPTIONS = {
    PLATFORM:
        'Place a solid block that players can stand on, jump from, or use to block a route.',
    MOVING_PLATFORM:
        'Creates a platform that patrols left and right and can carry players along its path.',
    FALLING_PLATFORM:
        'Looks safe at first, then drops after a player stands on it for a short moment.',
    ICE_PLATFORM:
        'A solid platform with very low friction. Players keep sliding after they land on it.',
    BOUNCE_PAD:
        'A spring tile that throws players upward the moment they land on it.',
    SPIKE: 'A compact trap that kills instantly on contact.',
    CANNON: 'A directional trap that periodically fires projectiles across the map.',
    SAW: 'A spinning hazard that kills on touch and is best used in tight spaces.',
    FLAME: 'A timed fire trap that alternates between safe and deadly states.',
    SPIKED_BALL:
        'A dangerous static hazard that kills on contact but does not move.',
    ICE_BLOCK:
        'A pass-through ice zone that boosts slide and movement speed while overlapping it.',
    WIND_ZONE:
        'A directional force field that pushes players while they are inside it.',
    TELEPORTER:
        'One token places a linked portal pair. Step in one end to come out of the other.',
    BOMB: 'A proximity trap with a short fuse that explodes and destroys nearby placed obstacles.',
    SHADOW: 'Places a replay trigger that spawns a ghost copy of the last 5 seconds of movement.',
};

// All purchasable items derived from GameConfig.SHOP_PRICES
// Shuffled each round via shuffleItems()
let ALL_SHOP_ITEMS = Object.entries(GameConfig.SHOP_PRICES).map(
    ([type, price]) => ({
        type,
        price,
        label: type
            .split('_')
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' '),
        desc: ITEM_DESCRIPTIONS[type] || '',
    }),
);

// Active items shown this round (random subset of 8)
let SHOP_ITEMS = ALL_SHOP_ITEMS;

/**
 *
 */
function shuffleShopItems() {
    const shuffled = [...ALL_SHOP_ITEMS].sort(() => Math.random() - 0.5);
    SHOP_ITEMS = shuffled.slice(0, Math.min(8, shuffled.length));
}

// Player colours
const PLAYER_COLOURS = [
    [90, 170, 255], // P1 blue
    [255, 200, 80], // P2 orange
];

const GRID_COLS = 4;
const CARD_W = 212;
const CARD_H = 132;
const CARD_GAP_X = 14;
const CARD_GAP_Y = 16;

/**
 * ShopState — turn-based shop.
 *
 * A player can buy as many items as they can afford in their turn.
 * Each purchase immediately deducts from wallet and adds to inventory.
 * "Done" (or ENTER with nothing selected) ends the turn.
 *
 * Layout: 2-column scrollable table. Each row shows name, price, and a Buy
 * button. All 13 items fit within the 960-wide canvas without overflow.
 *
 * Controls:
 *   Click Buy button   — purchase that item (if affordable)
 *   Click Done / ENTER — end turn
 *   S                  — end turn (skip)
 */
export class ShopState extends State {
    enter() {
        this.ctx.shopHasRun = true;
        this._currentTurn = 0;
        this._message = '';
        this._msgTimer = 0;
        this._hoveredItem = null;
        shuffleShopItems(); // Feature 7: random shop each round
    }

    update(deltaTime) {
        if (this._msgTimer > 0) {
            this._msgTimer -= deltaTime;
            if (this._msgTimer <= 0) this._message = '';
        }
        this._hoveredItem = null; // reset each frame, set during render
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight, players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];
        const col = PLAYER_COLOURS[this._currentTurn];
        const panelX = 24;
        const panelY = 56;
        const panelW = gameWidth - 48;
        const panelH = gameHeight - 122;
        const gridX = panelX + 20;
        const gridY = panelY + 38;

        p.background(11, 13, 22);

        // Header
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(8);
        p.text(`P${this._currentTurn + 1} PIXEL SHOP`, gameWidth / 2, 10);

        p.fill(160, 160, 190);
        p.textSize(5);
        p.textAlign(p.CENTER, p.TOP);
        p.text(
            'Hover icon to inspect. Buy traps with wallet coins.',
            gameWidth / 2,
            36,
        );

        this._hoveredItem = null;

        // Main shop panel
        p.fill(16, 20, 34);
        p.rect(panelX, panelY, panelW, panelH, 10);
        p.stroke(...col);
        p.strokeWeight(2);
        p.noFill();
        p.rect(panelX, panelY, panelW, panelH, 10);
        p.noStroke();

        p.fill(32, 38, 60);
        p.rect(panelX, panelY, panelW, 24, 10, 10, 0, 0);
        p.fill(205, 218, 255);
        p.textAlign(p.LEFT, p.CENTER);
        p.textSize(5.5);
        p.text('ITEM SHOP', panelX + 12, panelY + 13);

        const wallet = scoreManager.getWallet(player);
        p.fill(100, 220, 180);
        p.textAlign(p.RIGHT, p.CENTER);
        p.text(`WALLET ${wallet}`, panelX + panelW - 12, panelY + 13);

        const invEntries = [...player.inventory.entries()].filter(
            ([, c]) => c > 0,
        );
        p.fill(invEntries.length ? [150, 176, 220] : [95, 102, 130]);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(4.8);
        p.text(
            invEntries.length
                ? `BAG ${invEntries.map(([t, c]) => `${this._labelFor(t)} x${c}`).join('   ')}`
                : 'BAG EMPTY',
            gridX,
            gridY - 16,
        );

        // Item cards
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const item = SHOP_ITEMS[i];
            const column = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const rx = gridX + column * (CARD_W + CARD_GAP_X);
            const ry = gridY + row * (CARD_H + CARD_GAP_Y);
            const canAfford = wallet >= item.price;
            const iconRect = { x: rx + 12, y: ry + 18, w: 56, h: 56 };
            const buyRect = {
                x: rx + CARD_W - 70,
                y: ry + CARD_H - 28,
                w: 58,
                h: 18,
            };
            const cardHovered =
                mx >= rx && mx <= rx + CARD_W && my >= ry && my <= ry + CARD_H;
            const iconHovered =
                mx >= iconRect.x &&
                mx <= iconRect.x + iconRect.w &&
                my >= iconRect.y &&
                my <= iconRect.y + iconRect.h;
            const buyHovered =
                mx >= buyRect.x &&
                mx <= buyRect.x + buyRect.w &&
                my >= buyRect.y &&
                my <= buyRect.y + buyRect.h;
            if (iconHovered) this._hoveredItem = item;

            p.noStroke();
            p.fill(cardHovered ? [28, 34, 56] : [22, 26, 44]);
            p.rect(rx, ry, CARD_W, CARD_H, 8);
            p.stroke(...this._itemColor(item.type), cardHovered ? 255 : 170);
            p.strokeWeight(1.5);
            p.noFill();
            p.rect(rx, ry, CARD_W, CARD_H, 8);
            p.noStroke();

            p.fill(34, 40, 66);
            p.rect(rx, ry, CARD_W, 18, 8, 8, 0, 0);
            p.fill(225, 232, 255);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(5);
            p.text(this._labelFor(item.type), rx + 10, ry + 10);

            p.fill(18, 22, 36);
            p.rect(iconRect.x, iconRect.y, iconRect.w, iconRect.h, 6);
            p.stroke(66, 78, 120);
            p.strokeWeight(1);
            p.noFill();
            p.rect(iconRect.x, iconRect.y, iconRect.w, iconRect.h, 6);
            p.noStroke();
            this._drawShopIcon(
                item.type,
                iconRect.x,
                iconRect.y,
                iconRect.w,
                iconRect.h,
            );

            p.fill(canAfford ? [255, 215, 0] : [170, 88, 88]);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(5.5);
            p.text(`PRICE ${item.price}`, rx + 82, ry + 30);

            const owned = player.inventory.get(item.type) ?? 0;
            p.fill(124, 210, 170);
            p.textSize(5);
            p.text(`OWNED ${owned}`, rx + 82, ry + 50);

            p.fill(120, 132, 170);
            p.textSize(4.3);
            p.text(
                ITEM_SUMMARIES[item.type] ?? '',
                rx + 12,
                ry + 82,
                CARD_W - 24,
                28,
            );

            p.fill(
                canAfford
                    ? buyHovered
                        ? [72, 156, 90]
                        : [46, 112, 62]
                    : [44, 44, 54],
            );
            p.rect(buyRect.x, buyRect.y, buyRect.w, buyRect.h, 4);
            p.fill(canAfford ? [238, 248, 238] : [110, 110, 118]);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(5);
            p.text(
                'BUY',
                buyRect.x + buyRect.w / 2,
                buyRect.y + buyRect.h / 2 + 0.5,
            );
        }

        if (this._hoveredItem) {
            const item = this._hoveredItem;
            const tipW = 270;
            const tipH = 74;
            const tipX = Math.min(mx + 14, gameWidth - tipW - 8);
            const tipY = Math.max(my - tipH - 8, 8);
            p.noStroke();
            p.fill(14, 18, 30, 242);
            p.rect(tipX, tipY, tipW, tipH, 8);
            p.stroke(...this._itemColor(item.type));
            p.strokeWeight(1.5);
            p.noFill();
            p.rect(tipX, tipY, tipW, tipH, 8);
            p.noStroke();
            this._drawShopIcon(item.type, tipX + 10, tipY + 10, 42, 42);
            p.fill(...this._itemColor(item.type));
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(5.5);
            p.text(this._labelFor(item.type), tipX + 62, tipY + 12);
            p.fill(255, 215, 0);
            p.text(`PRICE ${item.price}`, tipX + 62, tipY + 28);
            p.fill(180, 185, 210);
            p.textSize(4.7);
            p.text(item.desc, tipX + 10, tipY + 48, tipW - 20, 22);
        }

        // Done button
        const doneY = gameHeight - 48;
        const doneW = 160;
        const doneH = 28;
        const doneX = gameWidth / 2 - doneW / 2;
        const doneHov =
            mx >= doneX &&
            mx <= doneX + doneW &&
            my >= doneY &&
            my <= doneY + doneH;

        p.fill(doneHov ? [60, 120, 180] : [40, 85, 135]);
        p.noStroke();
        p.rect(doneX, doneY, doneW, doneH, 6);
        p.fill(220, 235, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(5);
        p.text('DONE SHOPPING', doneX + doneW / 2, doneY + doneH / 2 + 0.5);

        // Turn dots
        const dotY = doneY + doneH + 8;
        [0, 1].forEach((i) => {
            const dotX = gameWidth / 2 + (i === 0 ? -14 : 14);
            const active = i === this._currentTurn;
            p.fill(active ? PLAYER_COLOURS[i] : [45, 45, 60]);
            p.noStroke();
            p.circle(dotX, dotY, active ? 12 : 8);
        });

        // Feedback message
        if (this._message) {
            p.fill(255, 220, 80);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(5.5);
            p.text(this._message, gameWidth / 2, doneY - 4);
        }

        // Controls hint
        p.fill(75, 75, 95);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(5);
        p.text(
            'ENTER / Done → finish turn   S → skip turn',
            14,
            gameHeight - 2,
        );
    }

    mousePressed(mx, my) {
        const { gameWidth, gameHeight, players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];
        const panelX = 24;
        const panelY = 56;
        const gridX = panelX + 20;
        const gridY = panelY + 38;

        // Buy button clicks
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const item = SHOP_ITEMS[i];
            const column = i % GRID_COLS;
            const row = Math.floor(i / GRID_COLS);
            const rx = gridX + column * (CARD_W + CARD_GAP_X);
            const ry = gridY + row * (CARD_H + CARD_GAP_Y);
            const btnRect = {
                x: rx + CARD_W - 70,
                y: ry + CARD_H - 28,
                w: 58,
                h: 18,
            };
            if (
                mx >= btnRect.x &&
                mx <= btnRect.x + btnRect.w &&
                my >= btnRect.y &&
                my <= btnRect.y + btnRect.h
            ) {
                this._buyItem(item, player, scoreManager);
                return;
            }
        }

        // Done button
        const doneY = gameHeight - 48;
        const doneW = 160;
        const doneH = 28;
        const doneX = gameWidth / 2 - doneW / 2;
        if (
            mx >= doneX &&
            mx <= doneX + doneW &&
            my >= doneY &&
            my <= doneY + doneH
        ) {
            this._doneTurn();
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this._doneTurn();
        } else if (p.key === 's' || p.key === 'S') {
            this._doneTurn();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    /**
     * Attempt to buy one unit of an item. Does NOT end the turn.
     * @param item
     * @param player
     * @param scoreManager
     * @private
     */
    _buyItem(item, player, scoreManager) {
        const ok = scoreManager.spendWallet(player, item.price);
        if (!ok) {
            this._showMessage(`Not enough coins! Need 💰${item.price}`);
            return;
        }
        const current = player.inventory.get(item.type) ?? 0;
        player.inventory.set(item.type, current + 1);
        const label = item.label;
        this._showMessage(
            `Bought ${label}! (💰 ${scoreManager.getWallet(player)} remaining)`,
        );
    }

    /**
     * End this player's shopping turn.
     * @private
     */
    _doneTurn() {
        this._message = '';
        this._currentTurn++;
        if (this._currentTurn >= this.ctx.players.length) {
            this.ctx.mapManager?.generateRandomMap?.(this.ctx.mapKey, this.ctx);
            this.goTo(GameStage.BUILD);
        }
    }

    _showMessage(text) {
        this._message = text;
        this._msgTimer = 2200;
    }

    _itemColor(type) {
        const map = {
            PLATFORM: [120, 90, 60],
            MOVING_PLATFORM: [80, 110, 160],
            FALLING_PLATFORM: [90, 65, 40],
            ICE_PLATFORM: [160, 220, 245],
            BOUNCE_PAD: [80, 200, 100],
            SPIKE: [220, 60, 60],
            CANNON: [100, 100, 115],
            SAW: [200, 60, 60],
            FLAME: [240, 100, 20],
            SPIKED_BALL: [170, 80, 40],
            ICE_BLOCK: [120, 190, 230],
            WIND_ZONE: [60, 185, 185],
            TELEPORTER: [160, 80, 240],
            BOMB: [220, 80, 40],
            SHADOW: [140, 90, 220],
        };
        return map[type] ?? [150, 150, 150];
    }

    _labelFor(type) {
        return type
            .split('_')
            .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
            .join(' ');
    }

    _drawShopIcon(type, x, y, w, h) {
        const { p, shopIcons } = this.ctx;
        const img = shopIcons?.[type] ?? null;
        p.push();
        p.noSmooth();
        if (img) {
            const { sx, sy, sw, sh, dx, dy, dw, dh } = this._iconDrawSpec(
                type,
                img,
                x,
                y,
                w,
                h,
            );
            p.image(img, dx, dy, dw, dh, sx, sy, sw, sh);
        } else if (type === ObstacleType.BOMB) {
            drawBombIcon(p, x, y, w, h);
        } else if (type === ObstacleType.SHADOW) {
            drawShadowIcon(p, x, y, w, h);
        } else {
            p.noStroke();
            p.fill(...this._itemColor(type));
            p.rect(x + 8, y + 8, w - 16, h - 16, 4);
        }
        p.pop();
    }

    _fitIconRect(x, y, w, h, sourceW, sourceH, maxW = w, maxH = h) {
        const scale = Math.min(maxW / sourceW, maxH / sourceH);
        const dw = sourceW * scale;
        const dh = sourceH * scale;
        return {
            dx: x + (w - dw) / 2,
            dy: y + (h - dh) / 2,
            dw,
            dh,
        };
    }

    _iconDrawSpec(type, img, x, y, w, h) {
        if (type === ObstacleType.MOVING_PLATFORM) {
            const fit = this._fitIconRect(x, y, w, h, 32, 8, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 32,
                sh: 8,
                ...fit,
            };
        }

        if (type === ObstacleType.FALLING_PLATFORM) {
            const fit = this._fitIconRect(x, y, w, h, 32, 10, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 32,
                sh: 10,
                ...fit,
            };
        }

        if (type === ObstacleType.BOUNCE_PAD) {
            const fit = this._fitIconRect(x, y, w, h, 28, 28, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 28,
                sh: 28,
                ...fit,
            };
        }

        if (type === ObstacleType.SAW) {
            const fit = this._fitIconRect(x, y, w, h, 38, 38, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 38,
                sh: 38,
                ...fit,
            };
        }

        if (type === ObstacleType.FLAME) {
            const fit = this._fitIconRect(x, y, w, h, 16, 32, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 16,
                sh: 32,
                ...fit,
            };
        }

        if (type === ObstacleType.WIND_ZONE) {
            return {
                sx: 32 * 2 + 6,
                sy: 9,
                sw: 22,
                sh: 14,
                dx: x,
                dy: y,
                dw: w,
                dh: h,
            };
        }

        if (type === ObstacleType.SPIKE) {
            return {
                sx: 41,
                sy: 0,
                sw: 38,
                sh: 40,
                dx: x,
                dy: y,
                dw: w,
                dh: h,
            };
        }

        if (type === ObstacleType.CANNON) {
            const fit = this._fitIconRect(x, y, w, h, 30, 18, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 30,
                sh: 18,
                ...fit,
            };
        }

        if (type === ObstacleType.SPIKED_BALL) {
            const fit = this._fitIconRect(x, y, w, h, 28, 28, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 28,
                sh: 28,
                ...fit,
            };
        }

        if (type === ObstacleType.TELEPORTER) {
            const fit = this._fitIconRect(x, y, w, h, 40, 40, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 40,
                sh: 40,
                ...fit,
            };
        }

        if (
            type === ObstacleType.PLATFORM ||
            type === ObstacleType.ICE_PLATFORM ||
            type === ObstacleType.ICE_BLOCK
        ) {
            const fit = this._fitIconRect(x, y, w, h, 40, 40, w, h);
            return {
                sx: 0,
                sy: 0,
                sw: 40,
                sh: 40,
                ...fit,
            };
        }

        const fit = this._fitIconRect(x, y, w, h, img.width, img.height, w, h);
        return {
            sx: 0,
            sy: 0,
            sw: img.width,
            sh: img.height,
            ...fit,
        };
    }
}
