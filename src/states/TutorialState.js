import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';

/**
 * TutorialState — a full-screen tutorial popup shown once before each game.
 *
 * Covers:
 *   - P1 / P2 movement and jump controls
 *   - Double jump
 *   - Build phase basics
 *   - Shop phase basics
 *
 * Transitions:
 *   SPACE / ENTER / click → BUILD
 *   ESC                   → MAPMENU
 */
export class TutorialState extends State {
    _returnToTarget() {
        if (this._returnStage === GameStage.RUN) {
            this.ctx.resumeRunState = true;
        }
        this.goTo(this._returnStage ?? GameStage.WALK_MAP);
    }

    enter() {
        this._page = 0;
        // When opened from the pause menu, ctx.tutorialReturnStage is set
        // so closing the tutorial returns to the paused game.
        this._returnStage = this.ctx.tutorialReturnStage ?? null;
        this.ctx.tutorialReturnStage = null; // consume it
    }

    update(deltaTime) {
        if (this._alpha < 255) {
            this._alpha = Math.min(255, this._alpha + deltaTime * 0.6);
        }
    }

    render(mx, my) {
        const { p, gameWidth, gameHeight } = this.ctx;

        // ── Dark overlay ───────────────────────────────────────────────────
        p.background(10, 14, 26);

        // ── Panel ──────────────────────────────────────────────────────────
        const panW  = gameWidth  - 60;
        const panH  = gameHeight - 50;
        const panX  = 30;
        const panY  = 20;

        p.noStroke();
        p.fill(18, 22, 38);
        p.rect(panX, panY, panW, panH, 10);
        p.stroke(60, 80, 130);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(panX, panY, panW, panH, 10);
        p.noStroke();

        if (this._page === 0) {
            this._renderControlsPage(p, panX, panY, panW, panH, mx, my);
        } else {
            this._renderFlowPage(p, panX, panY, panW, panH, mx, my);
        }

    }

    mousePressed(mx, my) {
        const { gameWidth, gameHeight } = this.ctx;

        // Next / Start buttons
        const btnW = 140, btnH = 32;
        if (this._page === 0) {
            // "Next →" button
            const bx = gameWidth - 30 - btnW - 10;
            const by = gameHeight - 20 - btnH - 8;
            if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                this._page = 1;
                return;
            }
        } else {
            // "Play →" button
            const bx = gameWidth - 30 - btnW - 10;
            const by = gameHeight - 20 - btnH - 8;
            if (mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH) {
                // If opened from pause menu, return to the paused game
                if (this._returnStage) {
                    this._returnToTarget();
                } else {
                    this.goTo(this.ctx.shopHasRun ? GameStage.BUILD : GameStage.RUN);
                }
                return;
            }
            // "← Back" button
            const backX = 30 + 10;
            if (mx >= backX && mx <= backX + btnW && my >= by && my <= by + btnH) {
                this._page = 0;
                return;
            }
        }
    }

    keyPressed() {
        const { p } = this.ctx;
        if (p.keyCode === p.ENTER || p.key === ' ') {
            if (this._page === 0) {
                this._page = 1;
            } else {
                // If opened from pause menu, return to the paused game
                if (this._returnStage) {
                    this._returnToTarget();
                } else {
                    this.goTo(this.ctx.shopHasRun ? GameStage.BUILD : GameStage.RUN);
                }
            }
        } else if (p.keyCode === p.ESCAPE) {
            this._returnToTarget();
        }
    }

    // ── Private render helpers ────────────────────────────────────────────

    _renderControlsPage(p, panX, panY, panW, panH, mx, my) {
        const { gameWidth, gameHeight } = this.ctx;
        const cx = panX + panW / 2;

        // Title
        p.fill(180, 200, 255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(9);
        p.text('HOW TO PLAY', cx, panY + 14);

        // Separator
        p.stroke(50, 65, 110);
        p.strokeWeight(1);
        p.line(panX + 20, panY + 38, panX + panW - 20, panY + 38);
        p.noStroke();

        // Page indicator
        p.fill(80, 100, 150);
        p.textSize(5);
        p.textAlign(p.CENTER, p.TOP);
        p.text('1 / 2', cx, panY + 42);

        // Two player columns
        const col1X = panX + 30;
        const col2X = panX + panW / 2 + 15;
        const colW  = panW / 2 - 45;
        const startY = panY + 56;

        this._drawPlayerColumn(p, col1X, startY, colW, 1,
            'P1 — WASD',
            [90, 170, 255],
            [
                { keys: ['A', 'D'],        desc: 'Move left / right' },
                { keys: ['W'],             desc: 'Jump' },
                { keys: ['W', 'W'],        desc: 'Double jump ✦', highlight: true },
            ]
        );

        this._drawPlayerColumn(p, col2X, startY, colW, 2,
            'P2 — Arrow Keys',
            [255, 200, 80],
            [
                { keys: ['←', '→'],        desc: 'Move left / right' },
                { keys: ['↑'],             desc: 'Jump' },
                { keys: ['↑', '↑'],        desc: 'Double jump ✦', highlight: true },
            ]
        );

        // Double jump callout box
        const boxY = startY + 204;
        const boxX = panX + 30;
        const boxW = panW - 60;
        p.noStroke();
        p.fill(40, 50, 80);
        p.rect(boxX, boxY, boxW, 68, 6);
        p.stroke(80, 110, 180);
        p.strokeWeight(1);
        p.noFill();
        p.rect(boxX, boxY, boxW, 68, 6);
        p.noStroke();
        p.fill(160, 200, 255);
        p.textAlign(p.LEFT, p.TOP);
        p.textSize(5.4);
        p.text('✦  Double Jump:', boxX + 16, boxY + 10);
        p.fill(210, 225, 255);
        p.text(
            'Press jump once to jump,\nthen press jump again mid-air for a second jump!',
            boxX + 16,
            boxY + 24,
        );

        // Navigation button
        this._drawNavButton(p, gameWidth, gameHeight, panX, panW, 'Next  →', [80, 140, 80], mx, my);

        // Skip hint
        p.fill(60, 70, 100);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(5.4);
        p.text('ESC to go back to map menu  ·  SPACE or ENTER to advance', panX + panW / 2, panY + panH - 8);
    }

    _renderFlowPage(p, panX, panY, panW, panH, mx, my) {
        const { gameWidth, gameHeight } = this.ctx;
        const cx = panX + panW / 2;

        // Title
        p.fill(180, 200, 255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(9);
        p.text('GAME FLOW', cx, panY + 14);

        p.stroke(50, 65, 110);
        p.strokeWeight(1);
        p.line(panX + 20, panY + 38, panX + panW - 20, panY + 38);
        p.noStroke();

        p.fill(80, 100, 150);
        p.textSize(5.4);
        p.textAlign(p.CENTER, p.TOP);
        p.text('2 / 2', cx, panY + 42);

        // ── 2×2 card grid ─────────────────────────────────────────────────
        const gridX  = panX + 20;
        const gridY  = panY + 54;
        const gap    = 12;
        const cardW  = (panW - 40 - gap) / 2;
        const cardH  = (panH - 54 - 42 - gap) / 2; // 42 = buttons+hint area

        const phases = [
            {
                icon: '🎭', label: 'Character Select',
                colour: [180, 140, 255],
                lines: [
                    'Each player picks a character in turn.',
                    'No two players can choose the same one.',
                    'Characters have different animation styles.',
                ],
            },
            {
                icon: '🔨', label: 'Build Phase',
                colour: [255, 200, 80],
                lines: [
                    'P1 then P2 place obstacles on the map.',
                    'Select a type from the palette, click to place.',
                    '↩ Undo Last or right-click a tile to remove.',
                    'ENTER confirms your turn.',
                ],
            },
            {
                icon: '🏃', label: 'Run Phase',
                colour: [100, 220, 120],
                lines: [
                    'Race to the GOAL tile before time runs out.',
                    'Collect coins — they become gold after the round.',
                    'Dying loses your round coins, not your gold.',
                    'ESC or ✕ Quit to return to the map menu.',
                ],
            },
            {
                icon: '🛒', label: 'Shop Phase',
                colour: [80, 190, 255],
                lines: [
                    'Spend gold on obstacle tokens for Build phases.',
                    '1 Teleporter token places one portal pair.',
                    'Buy as many tokens as you can afford.',
                    'ENTER or Done to finish shopping.',
                ],
            },
        ];

        phases.forEach((ph, i) => {
            const col  = i % 2;
            const row  = Math.floor(i / 2);
            const cx2  = gridX + col * (cardW + gap);
            const cy2  = gridY + row * (cardH + gap);

            // Card background
            p.noStroke();
            p.fill(22, 28, 50);
            p.rect(cx2, cy2, cardW, cardH, 7);

            // Coloured top bar
            p.fill(...ph.colour, 35);
            p.rect(cx2, cy2, cardW, 30, 7);
            p.fill(...ph.colour, 35);
            p.rect(cx2, cy2 + 14, cardW, 16); // square off bottom of top bar

            // Border
            p.stroke(...ph.colour, 90);
            p.strokeWeight(1);
            p.noFill();
            p.rect(cx2, cy2, cardW, cardH, 7);
            p.noStroke();

            // Phase header
            p.fill(...ph.colour);
            p.textAlign(p.LEFT, p.TOP);
            p.textSize(6);
            p.text(`${ph.icon}  ${ph.label}`, cx2 + 12, cy2 + 9);

            // Divider under header
            p.stroke(...ph.colour, 60);
            p.strokeWeight(1);
            p.line(cx2 + 10, cy2 + 30, cx2 + cardW - 10, cy2 + 30);
            p.noStroke();

            // Bullet lines
            let ly = cy2 + 38;
            ph.lines.forEach(line => {
                p.fill(185, 198, 220);
                p.textAlign(p.LEFT, p.TOP);
                p.textSize(5.2);
                p.text(`• ${line}`, cx2 + 12, ly);
                ly += 18;
            });
        });

        // Navigation buttons
        this._drawNavButton(p, gameWidth, gameHeight, panX, panW, '← Back', [60, 70, 110], mx, my, true);
        const playLabel = this._returnStage ? '← Back to Game' : 'Play  →';
        this._drawNavButton(p, gameWidth, gameHeight, panX, panW, playLabel, [60, 130, 70], mx, my);

        p.fill(60, 70, 100);
        p.textAlign(p.CENTER, p.BOTTOM);
        p.textSize(5.4);
        p.text('ESC to go back to map menu  ·  SPACE or ENTER to start', panX + panW / 2, panY + panH - 8);
    }

    _drawPlayerColumn(p, x, y, w, playerNo, title, colour, bindings) {
        // Column background
        p.noStroke();
        p.fill(22, 28, 50);
        p.rect(x, y, w, 182, 7);
        p.stroke(...colour, 100);
        p.strokeWeight(1);
        p.noFill();
        p.rect(x, y, w, 182, 7);
        p.noStroke();

        // Header bar
        p.fill(...colour, 40);
        p.rect(x, y, w, 28, 7);

        p.fill(...colour);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(5.2);
        p.text(title, x + w / 2, y + 14);

        // Bindings
        let ky = y + 40;
        bindings.forEach(b => {
            // Key badges
            let kx = x + 14;
            b.keys.forEach((k, i) => {
                if (i > 0) {
                    p.fill(100, 110, 140);
                    p.textAlign(p.LEFT, p.CENTER);
                    p.textSize(5.2);
                    p.text('+', kx, ky + 10);
                    kx += 14;
                }
                const kw = Math.max(22, k.length * 8 + 8);
                p.noStroke();
                p.fill(b.highlight ? [60, 50, 90] : [38, 44, 68]);
                p.rect(kx, ky, kw, 20, 4);
                p.stroke(b.highlight ? [...colour, 200] : [80, 90, 130]);
                p.strokeWeight(1);
                p.noFill();
                p.rect(kx, ky, kw, 20, 4);
                p.noStroke();
                p.fill(b.highlight ? [...colour] : [200, 210, 240]);
                p.textAlign(p.CENTER, p.CENTER);
                p.textSize(5.2);
                p.text(k, kx + kw / 2, ky + 10);
                kx += kw + 4;
            });

            // Description
            p.fill(b.highlight ? [...colour] : [170, 185, 215]);
            p.textAlign(p.LEFT, p.CENTER);
            p.textSize(5.2);
            p.text(b.desc, x + 14, ky + 32);

            ky += 44;
        });
    }

    _drawNavButton(p, gameWidth, gameHeight, panX, panW, label, colour, mx, my, isBack = false) {
        const btnW = 140, btnH = 32;
        const by   = gameHeight - 20 - btnH - 8;
        const bx   = isBack
            ? panX + 10
            : gameWidth - 30 - btnW - 10;

        const hov = mx >= bx && mx <= bx + btnW && my >= by && my <= by + btnH;
        p.noStroke();
        p.fill(hov ? colour.map(c => Math.min(255, c + 30)) : colour);
        p.rect(bx, by, btnW, btnH, 6);
        p.fill(240, 245, 255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(6.3);
        p.text(label, bx + btnW / 2, by + btnH / 2);
    }
}
