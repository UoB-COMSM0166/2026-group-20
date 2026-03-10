import { State } from './State.js';
import { GameStage } from '../config/GameStage.js';

/**
 * BootState — brief loading screen shown once at startup.
 *
 * Auto-advances to MENU after a short delay.
 * Extend this later to preload assets (sounds, sprites) before the game starts.
 *
 * Transitions:
 *   auto (1.5s) → MenuState
 */
export class BootState extends State {
    enter() {
        this._elapsed = 0;
        this._duration = 1500; // ms
    }

    update(deltaTime) {
        this._elapsed += deltaTime;
        if (this._elapsed >= this._duration) {
            this.goTo(GameStage.MENU);
        }
    }

    render() {
        const { p, gameWidth, gameHeight } = this.ctx;

        p.background(10);

        // Pulsing logo text
        const alpha = 128 + 127 * Math.sin((this._elapsed / this._duration) * Math.PI);
        p.fill(255, 255, 255, alpha);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(28);
        p.text('Loading...', gameWidth / 2, gameHeight / 2);

        p.textSize(13);
        p.fill(100, 100, 120, alpha);
        p.text('COMSM0166 — Group 20', gameWidth / 2, gameHeight / 2 + 40);
    }
}
