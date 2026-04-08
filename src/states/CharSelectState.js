import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { CHARACTERS } from '../config/CharacterConfig.js';

// Player accent colours used in UI
const PLAYER_COLOURS = [
    [90, 170, 255], // P1 blue
    [255, 200, 80], // P2 orange
];

// Card layout (fits 4 cards in 960px canvas)
const CARD_W = 175;
const CARD_H = 200;
const CARD_GAP = 20;
const SPRITE_SCALE = 3; // draw the 28×34 sprite at 4× for the preview

/**
 * CharSelectState — turn-based character selection screen.
 *
 * Flow:
 *   P1 clicks a card → character locked in, advance to P2's turn.
 *   P2 clicks a card (any not already taken) → both confirmed → MAPMENU.
 *
 * On confirm, player.setSprite() is called with the chosen sheet and animConfig.
 *
 * Controls:
 *   Left click character card — select
 *   ENTER                     — confirm current selection (if one is highlighted)
 */
export class CharSelectState extends State {
    enter() {
        this._currentTurn = 0; // 0 = P1 choosing, 1 = P2 choosing
        this._hovered = null; // character id under cursor this frame
        this._highlighted = null; // character id keyboard-highlighted
        this._chosen = [null, null]; // chosen character id per player
        this._animTick = 0; // increments each frame for card previews
    }

    update(deltaTime) {
        this._animTick += deltaTime;
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const col = PLAYER_COLOURS[this._currentTurn];

        p.background(12, 14, 24);

        // ── Title ─────────────────────────────────────────────────────────
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(22);
        p.text(
            `P${this._currentTurn + 1} — CHOOSE YOUR CHARACTER`,
            gameWidth / 2,
            12,
        );

        p.fill(160, 160, 190);
        p.textSize(12);
        p.text(
            'Click a card to select  •  ENTER to confirm',
            gameWidth / 2,
            40,
        );

        // ── Character cards ─
        const totalW =
            CHARACTERS.length * CARD_W + (CHARACTERS.length - 1) * CARD_GAP;
        const startX = (gameWidth - totalW) / 2;
        const cardY = (gameHeight - CARD_H) / 2 - 10;

        this._hovered = null;

        CHARACTERS.forEach((char, i) => {
            const cx = startX + i * (CARD_W + CARD_GAP);
            const isHovered =
                mx >= cx &&
                mx <= cx + CARD_W &&
                my >= cardY &&
                my <= cardY + CARD_H;
            const takenBy = this._takenBy(char.id);
            const isTaken = takenBy !== null;
            const isChosen = this._chosen[this._currentTurn] === char.id;

            if (isHovered && !isTaken) this._hovered = char.id;

            // Card background
            if (isChosen) {
                p.fill(45, 55, 90);
            } else if (isHovered && !isTaken) {
                p.fill(32, 38, 62);
            } else {
                p.fill(20, 22, 38);
            }
            p.noStroke();
            p.rect(cx, cardY, CARD_W, CARD_H, 10);

            // Selection border
            if (isChosen) {
                p.stroke(...col);
                p.strokeWeight(2.5);
                p.noFill();
                p.rect(cx, cardY, CARD_W, CARD_H, 10);
                p.noStroke();
            } else if (isHovered && !isTaken) {
                p.stroke(100, 110, 160);
                p.strokeWeight(1.5);
                p.noFill();
                p.rect(cx, cardY, CARD_W, CARD_H, 10);
                p.noStroke();
            }

            // ── Sprite preview ────────────────────────────────────────────
            const spriteSheet = this.ctx.sprites[char.spriteKey];
            if (spriteSheet) {
                this._drawCardSprite(p, char, spriteSheet, cx, cardY, isTaken);
            } else {
                // Fallback colour swatch
                p.noStroke();
                p.fill(...char.colour, isTaken ? 80 : 180);
                p.circle(cx + CARD_W / 2, cardY + 90, 60);
            }

            // ── Character name ─────────────────────────────────────────────
            p.noStroke();
            p.fill(isTaken ? [80, 80, 90] : [220, 220, 240]);
            p.textAlign(p.CENTER, p.TOP);
            p.textSize(14);
            p.text(char.displayName, cx + CARD_W / 2, cardY + CARD_H - 48);

            // ── Taken / chosen badge ────
            if (isTaken) {
                const takenCol = PLAYER_COLOURS[takenBy];
                // Dark overlay
                p.fill(0, 0, 0, 130);
                p.rect(cx, cardY, CARD_W, CARD_H, 10);

                p.fill(...takenCol);
                p.textSize(12);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(
                    `P${takenBy + 1}'s pick`,
                    cx + CARD_W / 2,
                    cardY + CARD_H - 22,
                );
            } else {
                // Colour accent dot at bottom
                p.fill(...char.colour);
                p.circle(cx + CARD_W / 2, cardY + CARD_H - 22, 10);
            }
        });

        // ── Player turn indicators ─────
        const dotsY = cardY + CARD_H + 22;
        [0, 1].forEach((i) => {
            const dotX = gameWidth / 2 + (i === 0 ? -16 : 16);
            const active = i === this._currentTurn;
            p.fill(active ? PLAYER_COLOURS[i] : [40, 40, 55]);
            p.noStroke();
            p.circle(dotX, dotsY, active ? 13 : 9);

            if (this._chosen[i]) {
                const charName =
                    CHARACTERS.find((c) => c.id === this._chosen[i])
                        ?.displayName ?? '';
                p.fill(PLAYER_COLOURS[i]);
                p.textAlign(i === 0 ? p.RIGHT : p.LEFT, p.CENTER);
                p.textSize(11);
                p.text(
                    `P${i + 1}: ${charName}`,
                    gameWidth / 2 + (i === 0 ? -26 : 26),
                    dotsY,
                );
            }
        });

        // ── Controls hint ──
        p.fill(70, 70, 90);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(10);
        p.text(
            'Click a character to select  •  ENTER to confirm selection',
            gameWidth / 2,
            gameHeight - 4,
        );
    }

    mousePressed(mx, my) {
        const { gameWidth, gameHeight } = this.ctx;
        const totalW =
            CHARACTERS.length * CARD_W + (CHARACTERS.length - 1) * CARD_GAP;
        const startX = (gameWidth - totalW) / 2;
        const cardY = (gameHeight - CARD_H) / 2 - 10;

        CHARACTERS.forEach((char, i) => {
            const cx = startX + i * (CARD_W + CARD_GAP);
            if (
                mx >= cx &&
                mx <= cx + CARD_W &&
                my >= cardY &&
                my <= cardY + CARD_H
            ) {
                if (this._takenBy(char.id) !== null) return; // already taken
                this._selectChar(char);
            }
        });
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.keyCode === 13) {
            if (this._chosen[this._currentTurn]) {
                this._advanceTurn();
            }
        }
    }

    // ── Private ──

    /**
     * Record the character selection for the current player and advance.
     * @param {object} char - entry from CHARACTERS
     * @private
     */
    _selectChar(char) {
        const playerIdx = this._currentTurn;
        const player = this.ctx.players[playerIdx];

        this._chosen[playerIdx] = char.id;

        // Apply sprite immediately so preview is live
        const sheet = this.ctx.sprites[char.spriteKey];
        if (sheet) player.setSprite(sheet, char.animConfig);

        this._advanceTurn();
    }

    /**
     * Move to the next player's turn, or to MAPMENU if both are done.
     * @private
     */
    _advanceTurn() {
        this._currentTurn++;
        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.MAPMENU);
        }
    }

    /**
     * Returns the player index (0 or 1) who has chosen this character,
     * or null if it is still available.
     * @param {string} charId
     * @returns {number|null}
     * @private
     */
    _takenBy(charId) {
        for (let i = 0; i < this._chosen.length; i++) {
            if (this._chosen[i] === charId) return i;
        }
        return null;
    }

    /**
     * Draw an animated sprite preview centred in a card.
     * Uses the idle animation frames, cycling via _animTick.
     * @private
     */
    _drawCardSprite(p, char, spriteSheet, cx, cardY, dimmed) {
        const fw = 28;
        const fh = spriteSheet.height;
        const scale = SPRITE_SCALE;

        // Pick an idle frame to cycle (roughly 4fps)
        const idleFrames = char.animConfig.IDLE;
        const frameIdx =
            idleFrames[Math.floor(this._animTick / 250) % idleFrames.length];

        const srcX = frameIdx * fw;

        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = cx + (CARD_W - drawW) / 2;
        const drawY = cardY + 20;

        p.push();
        p.noSmooth();
        if (dimmed) p.tint(255, 80);
        p.image(spriteSheet, drawX, drawY, drawW, drawH, srcX, 0, fw, fh);
        p.noTint();
        p.pop();
    }
}
