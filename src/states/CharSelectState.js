import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';
import { CHARACTERS } from '../config/CharacterConfig.js';
import { getPixelatedSprite } from '../utils/PixelSprite.js';

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
        this._nicknames = ['', '']; // player nicknames being entered
        this._pendingNameFor = null; // character id currently being named
        this._cardFrameCache = new Map();
    }

    update(deltaTime) {
        this._animTick += deltaTime;
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;
        const col = PLAYER_COLOURS[this._currentTurn];

        p.background(12, 14, 24);
        this._renderCharacterSelect(mx, my, p, gameWidth, gameHeight, col);
    }

    _renderCharacterSelect(mx, my, p, gameWidth, gameHeight, col) {
        // ── Title ─────────────────────────────────────────────────────────
        p.noStroke();
        p.fill(...col);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text(
            `P${this._currentTurn + 1} — CHOOSE YOUR CHARACTER`,
            gameWidth / 2,
            12,
        );

        p.fill(160, 160, 190);
        p.textSize(5);
        p.text(
            this._pendingNameFor
                ? 'Type your ID above the selected character  •  ENTER to confirm  •  ESC to cancel'
                : 'Click a character to select  •  Hover to view stats',
            gameWidth / 2,
            40,
        );

        // ── Character cards (simplified) ─
        const totalW =
            CHARACTERS.length * CARD_W + (CHARACTERS.length - 1) * CARD_GAP;
        const startX = (gameWidth - totalW) / 2;
        const cardY = (gameHeight - CARD_H) / 2 - 10;

        this._hovered = null;
        let hoveredChar = null;

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

            if (isHovered && !isTaken) {
                this._hovered = char.id;
                hoveredChar = char;
            }

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

            // ── Sprite preview (larger, more prominent) ────────────────────────────────────────────
            const spriteSheet = this.ctx.sprites[char.spriteKey];
            if (spriteSheet) {
                this._drawCardSprite(p, char, spriteSheet, cx, cardY, isTaken);
            } else {
                // Fallback colour swatch
                p.noStroke();
                p.fill(...char.colour, isTaken ? 80 : 180);
                p.circle(cx + CARD_W / 2, cardY + 90, 60);
            }

            // ── Character name only ────────────────────────────────────────
            p.noStroke();
            p.fill(isTaken ? [80, 80, 90] : [220, 220, 240]);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(6);
            p.text(char.displayName, cx + CARD_W / 2, cardY + CARD_H - 28);

            // ── Taken / chosen badge ────
            if (isTaken) {
                const takenCol = PLAYER_COLOURS[takenBy];
                // Dark overlay
                p.fill(0, 0, 0, 130);
                p.rect(cx, cardY, CARD_W, CARD_H, 10);

                p.fill(...takenCol);
                p.textSize(5);
                p.textAlign(p.CENTER, p.CENTER);
                p.text(`P${takenBy + 1}`, cx + CARD_W / 2, cardY + CARD_H - 20);
            }

            if (
                this._pendingNameFor === char.id &&
                this._currentTurn < this.ctx.players.length
            ) {
                this._drawInlineNameInput(
                    p,
                    cx + CARD_W / 2,
                    cardY + 14,
                    col,
                    this._nicknames[this._currentTurn],
                );
            }
        });

        // ── Hover details popup ────────────────────────────────────────────
        if (hoveredChar && !this._takenBy(hoveredChar.id)) {
            this._drawCharacterDetailsPopup(
                p,
                hoveredChar,
                mx,
                my,
                gameWidth,
                gameHeight,
            );
        }

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
                p.textSize(5);
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
        p.textSize(5);
        p.text(
            this._pendingNameFor
                ? 'ENTER to confirm name  •  BACKSPACE to delete  •  ESC to cancel selection'
                : 'Click to select a character',
            gameWidth / 2,
            gameHeight - 4,
        );
    }

    _drawCharacterDetailsPopup(p, char, mx, my, gameWidth, gameHeight) {
        const popupW = 220;
        const popupH = 180;

        // Position popup near cursor, but keep it on screen
        let popupX = mx + 15;
        let popupY = my - 60;

        if (popupX + popupW > gameWidth) popupX = gameWidth - popupW - 10;
        if (popupY < 10) popupY = 10;

        // Background
        p.noStroke();
        p.fill(12, 16, 28);
        p.rect(popupX, popupY, popupW, popupH, 8);

        // Border
        p.stroke(100, 110, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(popupX, popupY, popupW, popupH, 8);
        p.noStroke();

        // Title
        p.fill(...char.colour);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(7);
        p.text(char.displayName, popupX + 12, popupY + 10);

        // Tagline
        p.fill(150, 150, 180);
        p.textSize(5);
        p.text(char.tagline || '', popupX + 12, popupY + 28);

        // Stats
        if (char.stats) {
            const statKeys = Object.keys(char.stats);
            let statY = popupY + 48;

            statKeys.forEach((key) => {
                const val = char.stats[key];
                const maxVal = 5;

                // Label
                p.fill(160, 160, 190);
                p.textSize(5);
                p.textAlign(p.LEFT, p.CENTER);
                p.text(key + ':', popupX + 12, statY + 5);

                // Stat bar
                const barX = popupX + 80;
                const barW = 120;
                const barH = 6;

                p.fill(40, 45, 70);
                p.noStroke();
                p.rect(barX, statY - 3, barW, barH, 2);

                p.fill(...char.colour);
                p.rect(barX, statY - 3, (barW * val) / maxVal, barH, 2);

                // Value text
                p.fill(200, 200, 220);
                p.textSize(5);
                p.textAlign(p.RIGHT, p.CENTER);
                p.text(val + '/' + maxVal, popupX + popupW - 12, statY + 5);

                statY += 22;
            });
        }
    }

    mousePressed(mx, my) {
        if (this._pendingNameFor) return;

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
        if (this._pendingNameFor) {
            if (p.keyCode === p.ENTER || p.keyCode === 13) {
                this._confirmCurrentName();
            } else if (p.keyCode === p.BACKSPACE) {
                this._nicknames[this._currentTurn] = this._nicknames[
                    this._currentTurn
                ].slice(0, -1);
            } else if (p.keyCode === p.ESCAPE) {
                this._cancelCurrentSelection();
            } else if (
                p.key &&
                p.key.length === 1 &&
                /[a-zA-Z0-9 ]/.test(p.key)
            ) {
                if (this._nicknames[this._currentTurn].length < 12) {
                    this._nicknames[this._currentTurn] += p.key;
                }
            }
        } else if (p.keyCode === p.ESCAPE) {
            this._stepBackSelectionFlow();
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
        player.character = char;

        // Apply sprite
        const sheet = this.ctx.sprites[char.spriteKey];
        if (sheet) player.setSprite(sheet, char.animConfig);

        // Apply character-specific attributes
        if (char.speed !== undefined) player.speed = char.speed;
        if (char.jumpVel !== undefined) player.jumpVel = char.jumpVel;
        if (char.maxJumps !== undefined) {
            player.maxJumps = char.maxJumps;
            player.jumpsLeft = char.maxJumps;
        }
        if (char.gravity !== undefined) player.gravity = char.gravity;

        this._pendingNameFor = char.id;
    }

    _confirmCurrentName(useDefault = false) {
        const fallback = `Player ${this._currentTurn + 1}`;
        const value = useDefault
            ? fallback
            : this._nicknames[this._currentTurn].trim() || fallback;
        this._nicknames[this._currentTurn] = value;
        this.ctx.players[this._currentTurn].nickname = value;
        this._pendingNameFor = null;
        this._currentTurn++;
        if (this._currentTurn >= this.ctx.players.length) {
            this.goTo(GameStage.WALK_MAP);
        }
    }

    _cancelCurrentSelection() {
        const playerIdx = this._currentTurn;
        this._pendingNameFor = null;
        this._resetPlayerSelection(playerIdx);
    }

    _stepBackSelectionFlow() {
        if (this._pendingNameFor) {
            this._cancelCurrentSelection();
            return;
        }

        if (this._currentTurn <= 0) {
            this.goTo(GameStage.MENU);
            return;
        }

        const previousPlayerIdx = this._currentTurn - 1;
        this._resetPlayerSelection(previousPlayerIdx);
        this._currentTurn = previousPlayerIdx;
    }

    _resetPlayerSelection(playerIdx) {
        this._chosen[playerIdx] = null;
        this._nicknames[playerIdx] = '';

        const player = this.ctx.players[playerIdx];
        if (!player) return;

        player.character = null;
        player.nickname = `Player ${playerIdx + 1}`;
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
     * @param p
     * @param char
     * @param spriteSheet
     * @param cx
     * @param cardY
     * @param dimmed
     * @private
     */
    _drawCardSprite(p, char, spriteSheet, cx, cardY, dimmed) {
        const fw = 28;
        const fh = spriteSheet.height;
        const scale = SPRITE_SCALE;

        // Duck's idle loop is visually too subtle on the card, so let only Duck
        // use run frames here. Other characters keep their normal idle preview.
        const previewFrames =
            char.id === 'duck' && char.animConfig.RUN?.length
                ? char.animConfig.RUN
                : char.animConfig.IDLE;
        const frameIdx =
            previewFrames[
                Math.floor(this._animTick / 160) % previewFrames.length
            ];

        const srcX = frameIdx * fw;
        const frameKey = `${char.id}:${frameIdx}`;
        let frame = this._cardFrameCache.get(frameKey);
        if (!frame) {
            frame = spriteSheet.get(srcX, 0, fw, fh);
            this._cardFrameCache.set(frameKey, frame);
        }
        const displayFrame = getPixelatedSprite(p, frame, char.pixelScale ?? 1);

        const drawW = fw * scale;
        const drawH = fh * scale;
        const drawX = cx + (CARD_W - drawW) / 2;
        const drawY = cardY + 20;

        p.push();
        p.noSmooth();
        if (dimmed) p.tint(255, 80);
        p.image(displayFrame, drawX, drawY, drawW, drawH);
        p.noTint();
        p.pop();
    }

    _drawInlineNameInput(p, cx, y, col, value) {
        const boxW = 132;
        const boxH = 28;
        const boxX = cx - boxW / 2;
        const display = value || 'TYPE ID';

        p.noStroke();
        p.fill(18, 22, 38, 235);
        p.rect(boxX, y, boxW, boxH, 7);
        p.fill(255, 255, 255, 14);
        p.rect(boxX + 2, y + 2, boxW - 4, boxH * 0.38, 5);
        p.stroke(...col);
        p.strokeWeight(1.8);
        p.noFill();
        p.rect(boxX, y, boxW, boxH, 7);
        p.noStroke();

        p.fill(...col);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(5);
        p.text(display, cx, y + boxH / 2 + 1);
    }
}
