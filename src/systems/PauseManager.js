/**
 * PauseManager — manages the pause state during an active game round.
 *
 * Responsibilities:
 *   - Tracks whether the game is currently paused.
 *   - Renders the semi-transparent pause overlay with three buttons:
 *       ▶ Resume, ↺ Restart Round, ✕ Quit to Menu.
 *   - Forwards mouse clicks to caller-supplied callbacks.
 *
 * Usage (inside RunState):
 *   this.pauseManager = new PauseManager(p, gameWidth, gameHeight);
 *
 *   // In RunState.update():
 *   if (this.pauseManager.isPaused) return;
 *
 *   // In RunState.render():
 *   this.pauseManager.render(mx, my);
 *
 *   // In RunState.keyPressed() — ESC:
 *   this.pauseManager.toggle();
 *
 *   // In RunState.mousePressed():
 *   if (this.pauseManager.isPaused) {
 *       this.pauseManager.mousePressed(mx, my,
 *           () => this.pauseManager.resume(),
 *           () => { this._resetRound(); this.pauseManager.resume(); },
 *           () => this.goTo(GameStage.MENU)
 *       );
 *       return;
 *   }
 *
 * PauseManager has NO dependency on game logic, states, or GameStage.
 */
export class PauseManager {

    /**
     * @param {p5}    p
     * @param {number} gameWidth
     * @param {number} gameHeight
     */
    constructor(p, gameWidth, gameHeight) {
        this.p          = p;
        this.gameWidth  = gameWidth;
        this.gameHeight = gameHeight;
        this._paused    = false;

        // Three buttons stacked, centred horizontally
        const bW  = 200;
        const bH  = 44;
        const gap = 10;
        const cx  = gameWidth / 2;

        // Stack starts slightly below the panel centre to leave room for title
        const stackH = bH * 3 + gap * 2;
        const topY   = gameHeight / 2 - stackH / 2 + 20;

        this._btnResume  = { x: cx - bW / 2, y: topY,                 w: bW, h: bH };
        this._btnRestart = { x: cx - bW / 2, y: topY + bH + gap,       w: bW, h: bH };
        this._btnQuit    = { x: cx - bW / 2, y: topY + (bH + gap) * 2, w: bW, h: bH };
    }

    // ── Public API ────────────────────────────────────────────────────────

    get isPaused() { return this._paused; }

    pause()  { this._paused = true;  }
    resume() { this._paused = false; }
    toggle() { this._paused = !this._paused; }

    /**
     * Draw the pause overlay. Call at the end of RunState.render().
     * @param {number} mx
     * @param {number} my
     */
    render(mx, my) {
        if (!this._paused) return;

        const p  = this.p;
        const gW = this.gameWidth;
        const gH = this.gameHeight;

        // Dim overlay
        p.noStroke();
        p.fill(0, 0, 0, 160);
        p.rect(0, 0, gW, gH);

        // Panel
        const panW = 300;
        const panH = 270;
        const panX = gW / 2 - panW / 2;
        const panY = gH / 2 - panH / 2;

        p.fill(16, 20, 36);
        p.rect(panX, panY, panW, panH, 12);
        p.stroke(60, 90, 160);
        p.strokeWeight(1.5);
        p.noFill();
        p.rect(panX, panY, panW, panH, 12);
        p.noStroke();

        // Title
        p.fill(200, 215, 255);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(22);
        p.text('PAUSED', gW / 2, panY + 18);

        // Separator
        p.stroke(45, 60, 110);
        p.strokeWeight(1);
        p.line(panX + 24, panY + 52, panX + panW - 24, panY + 52);
        p.noStroke();

        // ESC hint
        p.fill(70, 85, 130);
        p.textAlign(p.CENTER, p.TOP);
        p.textSize(10);
        p.text('Press ESC to resume', gW / 2, panY + 58);

        // Buttons
        this._drawButton(p, mx, my, this._btnResume,
            '▶  Resume',
            [50, 130, 60],  [70, 160, 80],  [210, 245, 215]);

        this._drawButton(p, mx, my, this._btnRestart,
            '↺  Restart Round',
            [40, 90, 150],  [55, 115, 185], [190, 220, 255]);

        this._drawButton(p, mx, my, this._btnQuit,
            '✕  Quit to Menu',
            [110, 32, 32],  [145, 45, 45],  [250, 180, 180]);
    }

    /**
     * Route a click to the correct callback while paused.
     * @param {number}   mx
     * @param {number}   my
     * @param {Function} onResume   - Resume button
     * @param {Function} onRestart  - Restart Round button
     * @param {Function} onQuit     - Quit to Menu button
     */
    mousePressed(mx, my, onResume, onRestart, onQuit) {
        if (!this._paused) return;

        if      (this._hits(mx, my, this._btnResume))  onResume();
        else if (this._hits(mx, my, this._btnRestart)) onRestart();
        else if (this._hits(mx, my, this._btnQuit))    onQuit();
    }

    // ── Private ───────────────────────────────────────────────────────────

    _drawButton(p, mx, my, btn, label, baseCol, hoverCol, textCol) {
        const hov = this._hits(mx, my, btn);
        p.noStroke();
        p.fill(hov ? hoverCol : baseCol);
        p.rect(btn.x, btn.y, btn.w, btn.h, 8);
        // Top-edge sheen
        p.fill(255, 255, 255, hov ? 22 : 14);
        p.rect(btn.x, btn.y,              btn.w, btn.h * 0.45, 8);
        p.rect(btn.x, btn.y + btn.h * 0.45, btn.w, btn.h * 0.55);
        p.fill(...textCol);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(14);
        p.text(label, btn.x + btn.w / 2, btn.y + btn.h / 2);
    }

    _hits(mx, my, btn) {
        return mx >= btn.x && mx <= btn.x + btn.w &&
               my >= btn.y && my <= btn.y + btn.h;
    }
}
