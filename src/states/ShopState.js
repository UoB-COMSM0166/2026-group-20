import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { GameConfig } from '../config/GameConfig.js';
import { ObstacleType } from '../config/ObstacleType.js';

// Ordered list of items shown in the shop, derived from GameConfig.SHOP_PRICES
const SHOP_ITEMS = Object.entries(GameConfig.SHOP_PRICES).map(([type, price]) => ({
    type,
    price,
    label: type.charAt(0) + type.slice(1).toLowerCase(), // 'PLATFORM' → 'Platform'
}));

// Player colours — must match DrawPlayer / Scoreboard
const PLAYER_COLOURS = [
    [90,  170, 255], // P1 blue
    [255, 200, 80],  // P2 orange
];

/**
 * ShopState — turn-based shop phase between rounds.
 *
 * Flow:
 *   enter() with ctx.shopPurchases = []
 *   P1 picks one item (or skips) → confirm
 *   P2 picks one item (or skips) → confirm
 *   → BuildState
 *
 * Purchased items are pushed into ctx.shopPurchases as ObstacleType strings.
 * BuildState reads this array as a token pool — placing an obstacle consumes
 * one matching token. A null shopPurchases means free placement (round 1).
 *
 * Controls (active player only):
 *   Mouse click on item card  — select / deselect
 *   ENTER or click Confirm    — buy selected item (if affordable) and end turn
 *   S or click Skip           — end turn without buying
 */
export class ShopState extends State {

    enter() {
        // Reset the purchase pool for the new round
        this.ctx.shopPurchases = [];

        this._currentTurn = 0; // 0 = P1, 1 = P2
        this._selected    = null; // ObstacleType string currently highlighted
        this._message     = '';   // one-frame feedback message
        this._msgTimer    = 0;
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
        p.textSize(28);
        p.text(`P${this._currentTurn + 1} — SHOP`, gameWidth / 2, 18);

        p.fill(180, 180, 200);
        p.textSize(14);
        p.text('Pick one obstacle to place this round, then confirm.', gameWidth / 2, 56);

        // ── Wallet ───────────────────────────────────────────────────────
        p.fill(100, 220, 180);
        p.textSize(18);
        p.textAlign(p.RIGHT, p.TOP);
        p.text(`💰 Wallet: ${wallet}`, gameWidth - 20, 18);

        // ── Item cards ───────────────────────────────────────────────────
        const cardW   = 140;
        const cardH   = 110;
        const gap     = 24;
        const totalW  = SHOP_ITEMS.length * cardW + (SHOP_ITEMS.length - 1) * gap;
        const startX  = (gameWidth - totalW) / 2;
        const cardY   = gameHeight / 2 - cardH / 2 - 20;

        SHOP_ITEMS.forEach((item, i) => {
            const cx        = startX + i * (cardW + gap);
            const isSelected = this._selected === item.type;
            const canAfford  = wallet >= item.price;
            const isHovered  = mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH;

            // Card background
            if (isSelected) {
                p.fill(50, 70, 110);
            } else if (isHovered && canAfford) {
                p.fill(35, 40, 60);
            } else {
                p.fill(22, 25, 40);
            }
            p.noStroke();
            p.rect(cx, cardY, cardW, cardH, 8);

            // Selection / hover border
            if (isSelected) {
                p.stroke(...col);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(cx, cardY, cardW, cardH, 8);
                p.noStroke();
            } else if (isHovered && canAfford) {
                p.stroke(100, 110, 160);
                p.strokeWeight(1.5);
                p.noFill();
                p.rect(cx, cardY, cardW, cardH, 8);
                p.noStroke();
            }

            // Obstacle preview icon
            p.noStroke();
            this._drawIcon(p, item.type, cx + cardW / 2, cardY + 38);

            // Item name
            p.fill(canAfford ? 230 : 110);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.text(item.label, cx + cardW / 2, cardY + 68);

            // Price
            if (canAfford) {
                p.fill(255, 215, 0);
            } else {
                p.fill(160, 80, 80);
            }
            p.textSize(13);
            p.text(`💰 ${item.price}`, cx + cardW / 2, cardY + 87);

            // Can't afford overlay
            if (!canAfford) {
                p.fill(0, 0, 0, 100);
                p.rect(cx, cardY, cardW, cardH, 8);
                p.fill(180, 80, 80);
                p.textSize(11);
                p.text('CAN\'T AFFORD', cx + cardW / 2, cardY + cardH / 2 - 6);
            }
        });

        // ── Confirm / Skip buttons ────────────────────────────────────────
        const btnY   = cardY + cardH + 36;
        const btnH   = 38;
        const btnW   = 140;
        const confirmX = gameWidth / 2 - btnW - 12;
        const skipX    = gameWidth / 2 + 12;

        // Confirm
        const confirmActive = this._selected !== null;
        const confirmHover  = mx >= confirmX && mx <= confirmX + btnW && my >= btnY && my <= btnY + btnH;
        p.fill(confirmActive
            ? (confirmHover ? [60, 140, 80] : [40, 110, 60])
            : [30, 50, 35]);
        p.noStroke();
        p.rect(confirmX, btnY, btnW, btnH, 6);
        p.fill(confirmActive ? 230 : 90);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text('✓  Confirm', confirmX + btnW / 2, btnY + btnH / 2);

        // Skip
        const skipHover = mx >= skipX && mx <= skipX + btnW && my >= btnY && my <= btnY + btnH;
        p.fill(skipHover ? [80, 50, 50] : [55, 35, 35]);
        p.noStroke();
        p.rect(skipX, btnY, btnW, btnH, 6);
        p.fill(200, 150, 150);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text('✗  Skip', skipX + btnW / 2, btnY + btnH / 2);

        // ── Turn indicator dots ───────────────────────────────────────────
        const dotY = btnY + btnH + 28;
        [0, 1].forEach(i => {
            const dotX = gameWidth / 2 + (i === 0 ? -18 : 18);
            const active = i === this._currentTurn;
            p.fill(active ? PLAYER_COLOURS[i] : [50, 50, 65]);
            p.noStroke();
            p.circle(dotX, dotY, active ? 14 : 10);
        });
        p.fill(150, 150, 170);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(11);
        p.text('P1                    P2', gameWidth / 2, dotY + 10);

        // ── Feedback message ──────────────────────────────────────────────
        if (this._message) {
            p.fill(255, 220, 80);
            p.textAlign(p.CENTER, p.BOTTOM);
            p.textSize(13);
            p.text(this._message, gameWidth / 2, btnY - 8);
        }

        // ── Controls hint ─────────────────────────────────────────────────
        p.fill(90, 90, 110);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(11);
        p.text('Click to select  •  ENTER to confirm  •  S to skip', gameWidth / 2, gameHeight - 8);
    }

    mousePressed(mx, my) {
        const { gameWidth, gameHeight, players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];
        const wallet = scoreManager.getWallet(player);

        const cardW  = 140;
        const cardH  = 110;
        const gap    = 24;
        const totalW = SHOP_ITEMS.length * cardW + (SHOP_ITEMS.length - 1) * gap;
        const startX = (gameWidth - totalW) / 2;
        const cardY  = gameHeight / 2 - cardH / 2 - 20;

        // Item card click
        SHOP_ITEMS.forEach(item => {
            const i  = SHOP_ITEMS.indexOf(item);
            const cx = startX + i * (cardW + gap);
            if (mx >= cx && mx <= cx + cardW && my >= cardY && my <= cardY + cardH) {
                if (wallet >= item.price) {
                    this._selected = this._selected === item.type ? null : item.type;
                } else {
                    this._showMessage(`Not enough coins! Need 💰${item.price}`);
                }
            }
        });

        // Confirm button
        const btnY     = cardY + cardH + 36;
        const btnH     = 38;
        const btnW     = 140;
        const confirmX = gameWidth / 2 - btnW - 12;
        if (mx >= confirmX && mx <= confirmX + btnW && my >= btnY && my <= btnY + btnH) {
            this._confirmTurn();
            return;
        }

        // Skip button
        const skipX = gameWidth / 2 + 12;
        if (mx >= skipX && mx <= skipX + btnW && my >= btnY && my <= btnY + btnH) {
            this._skipTurn();
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            this._confirmTurn();
        } else if (p.key === 's' || p.key === 'S') {
            this._skipTurn();
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    /**
     * Buy the selected item (if any) and advance to the next turn / BUILD.
     * @private
     */
    _confirmTurn() {
        const { players, scoreManager } = this.ctx;
        const player = players[this._currentTurn];

        if (this._selected !== null) {
            const price = GameConfig.SHOP_PRICES[this._selected];
            const ok    = scoreManager.spendWallet(player, price);
            if (!ok) {
                this._showMessage('Not enough coins!');
                return;
            }
            this.ctx.shopPurchases.push(this._selected);
            this._showMessage(`P${this._currentTurn + 1} bought ${this._selected.charAt(0) + this._selected.slice(1).toLowerCase()}!`);
        }

        this._advanceTurn();
    }

    /**
     * Skip without buying and advance to next turn / BUILD.
     * @private
     */
    _skipTurn() {
        this._advanceTurn();
    }

    /**
     * Move to the next player's turn, or to BUILD if all players are done.
     * @private
     */
    _advanceTurn() {
        this._selected = null;
        this._currentTurn++;

        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.BUILD);
        }
        // else render() will now show the next player's turn
    }

    /**
     * Show a short feedback message for 1.8 seconds.
     * @private
     */
    _showMessage(text) {
        this._message  = text;
        this._msgTimer = 1800;
    }

    /**
     * Draw a small icon for each obstacle type, centred at (cx, cy).
     * @private
     */
    _drawIcon(p, type, cx, cy) {
        const s = 22; // icon half-size
        p.noStroke();

        switch (type) {
            case ObstacleType.PLATFORM:
                p.fill(120, 90, 60);
                p.rect(cx - s, cy - s * 0.4, s * 2, s * 0.8, 3);
                p.fill(160, 125, 85);
                p.rect(cx - s, cy - s * 0.4, s * 2, s * 0.15, 3);
                break;

            case ObstacleType.SPIKE:
                p.fill(220, 60, 60);
                p.triangle(cx - s, cy + s * 0.6, cx, cy - s * 0.6, cx + s, cy + s * 0.6);
                p.fill(255, 120, 120, 160);
                p.triangle(cx - s * 0.4, cy + s * 0.6, cx, cy - s * 0.1, cx + s * 0.1, cy + s * 0.6);
                break;

            case ObstacleType.CANNON: {
                // Base
                p.fill(70, 70, 80);
                p.rect(cx - s * 0.7, cy - s * 0.7, s * 1.4, s * 1.4, 3);
                // Barrel
                p.fill(55, 55, 65);
                p.rect(cx, cy - s * 0.24, s * 0.9, s * 0.48, 3);
                // Red dot
                p.fill(220, 80, 80);
                p.circle(cx + s * 0.7, cy, s * 0.2);
                break;
            }

            case ObstacleType.SAW: {
                // Outer disc
                p.fill(200, 200, 210);
                p.circle(cx, cy, s * 1.7);
                // Teeth
                p.fill(220, 60, 60);
                for (let i = 0; i < 6; i++) {
                    const a  = (i / 6) * Math.PI * 2;
                    p.circle(cx + Math.cos(a) * s * 0.72, cy + Math.sin(a) * s * 0.72, s * 0.4);
                }
                // Inner disc
                p.fill(180, 180, 190);
                p.circle(cx, cy, s * 0.9);
                // Hub
                p.fill(100, 100, 110);
                p.circle(cx, cy, s * 0.36);
                break;
            }
        }
    }
}
