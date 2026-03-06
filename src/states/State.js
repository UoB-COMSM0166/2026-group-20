/**
 * Base class for all game states.
 *
 * Every state receives:
 *   @param {object}   ctx       - Shared session context (p, gameWidth, gameHeight, players, scoreManager)
 *   @param {Function} goTo      - Call goTo(GameStage.X) to trigger a state transition
 *
 * Lifecycle:
 *   enter()                     — called once when this state becomes active
 *   update(deltaTime)           — logic tick, deltaTime in ms
 *   render(mouseX, mouseY)      — draw everything for this state
 *   mousePressed(mouseX, mouseY)— forwarded from p5 mousePressed
 *   keyPressed()                — forwarded from p5 keyPressed
 *   exit()                      — called once just before leaving this state
 */
export class State {
    constructor(ctx, goTo) {
        this.ctx = ctx;
        this.goTo = goTo;
    }

    enter() {}
    update(_deltaTime) {}
    render(_mx, _my) {}
    mousePressed(_mx, _my) {}
    keyPressed() {}
    exit() {}
}
