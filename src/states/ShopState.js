import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';

// Rich item descriptions for hover tooltips
const ITEM_DESCRIPTIONS = {
    PLATFORM:         'Solid block that players can stand on.',
    MOVING_PLATFORM:  'Slides left and right on a fixed path.',
    FALLING_PLATFORM: 'Drops after a player stands on it.',
    ICE_PLATFORM:     'Solid but frictionless — players slide.',
    BOUNCE_PAD:       'Launches players upward on contact.',
    SPIKE:            'Instant kill on touch.',
    CANNON:           'Fires projectiles periodically.',
    SAW:              'Spinning blade — instant kill.',
    FLAME:            'Pulses on/off. Kills when active.',
    SPIKED_BALL:      'Static hazard ball — instant kill.',
    ICE_BLOCK:        'Pass-through zone that increases speed.',
    WIND_ZONE:        'Pushes players in a set direction.',
    TELEPORTER:       '1 token = 2 portals. Warps players.',
    BOMB:             'Destroys terrain tiles on explosion!',
    SHADOW:           'Replays the last 5 seconds of a player as a ghost clone.',
};

// All purchasable items derived from GameConfig.SHOP_PRICES
// Shuffled each round via shuffleItems()
let ALL_SHOP_ITEMS = Object.entries(GameConfig.SHOP_PRICES).map(
    ([type, price]) => ({
        type,
        price,
        label: type.split('_').map((w) => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
        desc: ITEM_DESCRIPTIONS[type] || '',
    }),
);

// Active items shown this round (random subset of 8)
let SHOP_ITEMS = ALL_SHOP_ITEMS;

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
        p.textSize(9);
        p.text(`P${this._currentTurn + 1} PIXEL SHOP`, gameWidth / 2, 10);

        p.fill(160, 160, 190);
        p.textSize(5.5);
        p.textAlign(p.CENTER, p.TOP);
        p.text(
            'Hover icon to inspect. Buy traps with wallet coins.',
            gameWidth / 2,
            28,
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

        const invEntries = [...player.inventory.entries()].filter(([, c]) => c > 0);
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
            const col_i = i % GRID_COLS;
            const row_i = Math.floor(i / GRID_COLS);
            const rx = gridX + col_i * (CARD_W + CARD_GAP_X);
            const ry = gridY + row_i * (CARD_H + CARD_GAP_Y);
            const canAfford = wallet >= item.price;
            const iconRect = { x: rx + 12, y: ry + 18, w: 56, h: 56 };
            const buyRect = { x: rx + CARD_W - 70, y: ry + CARD_H - 28, w: 58, h: 18 };
            const cardHovered = mx >= rx && mx <= rx + CARD_W && my >= ry && my <= ry + CARD_H;
            const iconHovered = mx >= iconRect.x && mx <= iconRect.x + iconRect.w &&
                my >= iconRect.y && my <= iconRect.y + iconRect.h;
            const buyHovered = mx >= buyRect.x && mx <= buyRect.x + buyRect.w &&
                my >= buyRect.y && my <= buyRect.y + buyRect.h;
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
            this._drawShopIcon(item.type, iconRect.x, iconRect.y, iconRect.w, iconRect.h);

            p.fill(canAfford ? [255, 215, 0] : [170, 88, 88]);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(5.5);
            p.text(`PRICE ${item.price}`, rx + 82, ry + 30);

            const owned = player.inventory.get(item.type) ?? 0;
            p.fill(124, 210, 170);
            p.textSize(5);
            p.text(`OWNED ${owned}`, rx + 82, ry + 50);

            p.fill(120, 132, 170);
            p.textSize(4.6);
            p.text(this._shortDesc(item.type), rx + 12, ry + 86, 126);

            p.fill(canAfford ? (buyHovered ? [72, 156, 90] : [46, 112, 62]) : [44, 44, 54]);
            p.rect(buyRect.x, buyRect.y, buyRect.w, buyRect.h, 4);
            p.fill(canAfford ? [238, 248, 238] : [110, 110, 118]);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(5);
            p.text('BUY', buyRect.x + buyRect.w / 2, buyRect.y + buyRect.h / 2 + 0.5);
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
            p.textSize(5);
            p.text(item.desc, tipX + 10, tipY + 56);
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
            const col_i = i % GRID_COLS;
            const row_i = Math.floor(i / GRID_COLS);
            const rx = gridX + col_i * (CARD_W + CARD_GAP_X);
            const ry = gridY + row_i * (CARD_H + CARD_GAP_Y);
            const btnRect = { x: rx + CARD_W - 70, y: ry + CARD_H - 28, w: 58, h: 18 };
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
        const doneY = gameHeight - 44;
        const doneW = 160;
        const doneH = 34;
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
        } else if (p.keyCode === p.ESCAPE) {
            this.goTo(GameStage.RESULTS);
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

    _shortDesc(type) {
        const desc = ITEM_DESCRIPTIONS[type] || '';
        const words = desc.split(' ');
        return words.slice(0, 5).join(' ') + (words.length > 5 ? '...' : '');
    }

    _drawShopIcon(type, x, y, w, h) {
        const { p, shopIcons } = this.ctx;
        const img = shopIcons?.[type] ?? null;
        p.push();
        p.noSmooth();
        if (img) {
            if (type === ObstacleType.MOVING_PLATFORM) {
                p.image(img, x + 5, y + 18, w - 10, 14, 0, 0, 32, 8);
            } else if (type === ObstacleType.WIND_ZONE) {
                p.image(img, x + 8, y + 8, w - 16, h - 16, 0, 0, 32, 32);
            } else if (type === ObstacleType.TELEPORTER) {
                p.image(img, x + 6, y + 6, w - 12, h - 12, 0, 0, 40, 40);
            } else if (type === ObstacleType.PLATFORM) {
                p.image(img, x + 8, y + 8, w - 16, h - 16, 0, 0, 40, 40);
            } else if (type === ObstacleType.ICE_PLATFORM) {
                p.image(img, x + 8, y + 8, w - 16, h - 16, 0, 0, 40, 40);
            } else if (type === ObstacleType.ICE_BLOCK) {
                p.image(img, x + 8, y + 8, w - 16, h - 16, 0, 0, 40, 40);
            } else {
                const pad = 6;
                p.image(img, x + pad, y + pad, w - pad * 2, h - pad * 2);
            }
        } else if (type === ObstacleType.BOMB) {
            const cx = x + w / 2;
            const cy = y + h / 2 + 3;
            p.noStroke();
            p.fill(38, 42, 50);
            p.circle(cx, cy, Math.min(w, h) - 12);
            p.stroke(210, 160, 60);
            p.strokeWeight(3);
            p.noFill();
            p.arc(cx + 10, cy - 14, 18, 18, Math.PI, Math.PI * 1.7);
            p.noStroke();
            p.fill(255, 180, 80);
            p.circle(cx + 16, cy - 20, 6);
        } else if (type === ObstacleType.SHADOW) {
            const cx = x + w / 2;
            const cy = y + h / 2;
            p.noStroke();
            p.fill(70, 46, 122, 210);
            p.circle(cx, cy, Math.min(w, h) - 12);
            p.stroke(210, 180, 255);
            p.strokeWeight(2);
            p.noFill();
            p.circle(cx, cy, Math.min(w, h) - 18);
            p.noStroke();
            p.fill(240, 230, 255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(18);
            p.text('◌', cx, cy + 1);
        } else {
            p.noStroke();
            p.fill(...this._itemColor(type));
            p.rect(x + 8, y + 8, w - 16, h - 16, 4);
        }
        p.pop();
    }
}
