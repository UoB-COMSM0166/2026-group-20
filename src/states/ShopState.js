import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';

// All purchasable items derived from GameConfig.SHOP_PRICES
const SHOP_ITEMS = Object.entries(GameConfig.SHOP_PRICES).map(([type, price]) => ({
    type,
    price,
    label: type.split('_').map(w => w.charAt(0) + w.slice(1).toLowerCase()).join(' '),
}));

// Player colours
const PLAYER_COLOURS = [
    [90,  170, 255], // P1 blue
    [255, 200, 80],  // P2 orange
];

// Table layout constants
const COLS        = 2;
const ROW_H       = 36;
const TABLE_PAD_X = 20;
const TABLE_PAD_Y = 10;

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
        this._currentTurn   = 0;
        this._message       = '';
        this._msgTimer      = 0;
    }

    update(deltaTime) {
        if (this._msgTimer > 0) {
            this._msgTimer -= deltaTime;
            if (this._msgTimer <= 0) this._message = '';
        }
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight, players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];
        const wallet = scoreManager.getWallet(player);
        const col    = PLAYER_COLOURS[this._currentTurn];

        p.background(15, 15, 25);

        // ── Header ───────────────────────────────────────────────────────
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(22);
        p.text(`P${this._currentTurn + 1} — SHOP`, gameWidth / 2, 10);

        // Wallet (top-right)
        p.fill(100, 220, 180);
        p.textSize(16);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`💰 ${wallet}`, gameWidth - 14, 10);

        // Inventory summary (top-left)
        const invEntries = [...player.inventory.entries()].filter(([, c]) => c > 0);
        p.fill(160, 160, 200);
        p.textSize(11);
        p.textAlign(p.LEFT, p.TOP);
        if (invEntries.length > 0) {
            const inv = invEntries.map(([t, c]) => `${t.split('_').map(w => w[0] + w.slice(1).toLowerCase()).join(' ')} ×${c}`).join('  ');
            p.text(`Bag: ${inv}`, 14, 12);
        } else {
            p.fill(90, 90, 110);
            p.text('Bag: empty', 14, 12);
        }

        // Subtitle
        p.fill(160, 160, 190);
        p.textSize(12);
        p.textAlign(p.CENTER, p.TOP);
        p.text('Buy as many items as you can afford. Press ENTER or Done when finished.', gameWidth / 2, 34);

        // ── Table ────────────────────────────────────────────────────────
        const tableTop  = 58;
        const tableH    = gameHeight - tableTop - 52; // leave room for buttons at bottom
        const colW      = (gameWidth - TABLE_PAD_X * 2) / COLS;
        const itemsPerCol = Math.ceil(SHOP_ITEMS.length / COLS);

        // Table background
        p.fill(20, 22, 36);
        p.noStroke();
        p.rect(TABLE_PAD_X, tableTop, gameWidth - TABLE_PAD_X * 2, tableH, 6);

        // Column headers
        const headerH = 24;
        p.fill(35, 38, 58);
        p.rect(TABLE_PAD_X, tableTop, gameWidth - TABLE_PAD_X * 2, headerH, 6);

        p.fill(140, 140, 180);
        p.textSize(11);
        p.textAlign(p.LEFT, p.CENTER);
        for (let c = 0; c < COLS; c++) {
            const hx = TABLE_PAD_X + c * colW + TABLE_PAD_Y;
            p.text('ITEM', hx, tableTop + headerH / 2);
            p.text('COST', hx + colW * 0.52, tableTop + headerH / 2);
        }

        // Rows
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const col_i   = Math.floor(i / itemsPerCol);
            const row_i   = i % itemsPerCol;
            const rx      = TABLE_PAD_X + col_i * colW;
            const ry      = tableTop + headerH + row_i * ROW_H;
            const item    = SHOP_ITEMS[i];
            const canAfford = wallet >= item.price;
            const btnRect = this._buyBtnRect(i, tableTop, colW, headerH, itemsPerCol);
            const hovered = mx >= btnRect.x && mx <= btnRect.x + btnRect.w &&
                            my >= btnRect.y && my <= btnRect.y + btnRect.h;

            // Row background (alternating)
            p.noStroke();
            p.fill(row_i % 2 === 0 ? [24, 26, 42] : [28, 30, 48]);
            p.rect(rx, ry, colW, ROW_H);

            // Item colour swatch
            const swatchCol = this._itemColor(item.type);
            p.fill(...swatchCol);
            p.rect(rx + 8, ry + ROW_H / 2 - 7, 14, 14, 2);

            // Item name
            p.fill(canAfford ? [210, 210, 235] : [90, 90, 100]);
            p.textSize(12);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(item.label, rx + 28, ry + ROW_H / 2);

            // Price
            p.fill(canAfford ? [255, 215, 0] : [140, 80, 80]);
            p.textSize(12);
            p.textAlign(p.LEFT, p.CENTER);
            p.text(`💰 ${item.price}`, rx + colW * 0.52, ry + ROW_H / 2);

            // Buy button
            if (canAfford) {
                p.fill(hovered ? [60, 140, 75] : [38, 100, 52]);
            } else {
                p.fill(35, 35, 45);
            }
            p.noStroke();
            p.rect(btnRect.x, btnRect.y, btnRect.w, btnRect.h, 4);
            p.fill(canAfford ? (hovered ? 255 : 200) : 70);
            p.textSize(11);
            p.textAlign(p.CENTER, p.CENTER);
            p.text('Buy', btnRect.x + btnRect.w / 2, btnRect.y + btnRect.h / 2);
        }

        // Divider lines between rows
        p.stroke(35, 38, 55);
        p.strokeWeight(1);
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const col_i = Math.floor(i / itemsPerCol);
            const row_i = i % itemsPerCol;
            const rx    = TABLE_PAD_X + col_i * colW;
            const ry    = tableTop + headerH + row_i * ROW_H;
            p.line(rx, ry, rx + colW, ry);
        }
        // Column divider
        p.line(TABLE_PAD_X + colW, tableTop, TABLE_PAD_X + colW, tableTop + tableH);
        p.noStroke();

        // ── Done button ───────────────────────────────────────────────────
        const doneY  = gameHeight - 44;
        const doneW  = 160;
        const doneH  = 34;
        const doneX  = gameWidth / 2 - doneW / 2;
        const doneHov = mx >= doneX && mx <= doneX + doneW && my >= doneY && my <= doneY + doneH;

        p.fill(doneHov ? [60, 120, 180] : [40, 85, 135]);
        p.noStroke();
        p.rect(doneX, doneY, doneW, doneH, 6);
        p.fill(220, 235, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text('✓  Done shopping', doneX + doneW / 2, doneY + doneH / 2);

        // Turn dots
        const dotY = doneY + doneH + 8;
        [0, 1].forEach(i => {
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
            p.textSize(12);
            p.text(this._message, gameWidth / 2, doneY - 4);
        }

        // Controls hint
        p.fill(75, 75, 95);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.textSize(10);
        p.text('ENTER / Done → finish turn   S → skip turn', 14, gameHeight - 2);
    }

    mousePressed(mx, my) {
        const { gameWidth, gameHeight, players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];
        const wallet = scoreManager.getWallet(player);

        const tableTop    = 58;
        const tableH      = gameHeight - tableTop - 52;
        const colW        = (gameWidth - TABLE_PAD_X * 2) / COLS;
        const headerH     = 24;
        const itemsPerCol = Math.ceil(SHOP_ITEMS.length / COLS);

        // Buy button clicks
        for (let i = 0; i < SHOP_ITEMS.length; i++) {
            const item    = SHOP_ITEMS[i];
            const btnRect = this._buyBtnRect(i, tableTop, colW, headerH, itemsPerCol);
            if (mx >= btnRect.x && mx <= btnRect.x + btnRect.w &&
                my >= btnRect.y && my <= btnRect.y + btnRect.h) {
                this._buyItem(item, player, scoreManager);
                return;
            }
        }

        // Done button
        const doneY = gameHeight - 44;
        const doneW = 160;
        const doneH = 34;
        const doneX = gameWidth / 2 - doneW / 2;
        if (mx >= doneX && mx <= doneX + doneW && my >= doneY && my <= doneY + doneH) {
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
        this._showMessage(`Bought ${label}! (💰 ${scoreManager.getWallet(player)} remaining)`);
    }

    /**
     * End this player's shopping turn.
     * @private
     */
    _doneTurn() {
        this._message     = '';
        this._currentTurn++;
        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.BUILD);
        }
    }

    _showMessage(text) {
        this._message  = text;
        this._msgTimer = 2200;
    }

    /**
     * Compute the Buy button rect for item index i.
     * @private
     */
    _buyBtnRect(i, tableTop, colW, headerH, itemsPerCol) {
        const col_i = Math.floor(i / itemsPerCol);
        const row_i = i % itemsPerCol;
        const rx    = TABLE_PAD_X + col_i * colW;
        const ry    = tableTop + headerH + row_i * ROW_H;
        const btnW  = 42;
        const btnH  = ROW_H - 8;
        return {
            x: rx + colW - btnW - 8,
            y: ry + 4,
            w: btnW,
            h: btnH,
        };
    }

    /**
     * Return a display colour for an obstacle type.
     * @private
     */
    _itemColor(type) {
        const map = {
            PLATFORM:         [120, 90,  60],
            MOVING_PLATFORM:  [80,  110, 160],
            FALLING_PLATFORM: [90,  65,  40],
            ICE_PLATFORM:     [160, 220, 245],
            BOUNCE_PAD:       [80,  200, 100],
            SPIKE:            [220, 60,  60],
            CANNON:           [100, 100, 115],
            SAW:              [200, 60,  60],
            FLAME:            [240, 100, 20],
            SPIKE_PLATFORM:   [170, 80,  40],
            ICE_BLOCK:        [120, 190, 230],
            WIND_ZONE:        [60,  185, 185],
            TELEPORTER:       [160, 80,  240],
        };
        return map[type] ?? [150, 150, 150];
    }
}
