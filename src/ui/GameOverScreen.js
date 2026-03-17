/**
 * Game over overlay — drawn on top of the map when the game ends.
 * Currently this logic lives inline in sketch.js — move it here.
 *
 * TODO: extract game-over rendering out of sketch.js into this class
 */
export class GameOverScreen {
    /**
     * @param {p5} p
     * @param {number} gameWidth
     * @param {number} gameHeight
     */
    constructor(p, gameWidth, gameHeight) {
        this.p = p;
        this.gameWidth = gameWidth;
        this.gameHeight = gameHeight;
    }

    /**
     * Render the game-over overlay.
     * @param {TimeManager} timeManager
     */
    render(timeManager) {
        const p = this.p;

        p.fill(0, 0, 0, 150);
        p.rect(0, 0, this.gameWidth, this.gameHeight);

        p.fill(255);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(48);
        p.text('GAME OVER', this.gameWidth / 2, this.gameHeight / 2 - 50);

        p.textSize(24);
        if (timeManager.rankings.length > 0) {
            const winner = timeManager.rankings[0];
            p.text(`Winner: Player ${winner.playerNo + 1} !`, this.gameWidth / 2, this.gameHeight / 2 + 10);
        } else {
            p.text("Time's Up! Everyone Failed.", this.gameWidth / 2, this.gameHeight / 2 + 10);
        }
    }
}
