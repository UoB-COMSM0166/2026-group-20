import { State } from './State.js';
import { MapMenu } from '../ui/MapMenu.js';
import { GameStage } from '../config/GameStage.js';

/**
 * MapMenuState — map selection screen.
 *
 * Transitions:
 *   Return button → MenuState
 *   Map 1 button  → PlayState  (triggers a round reset before entering)
 *   Map 2 button  → Map2State
 */
export class MapMenuState extends State {
    enter() {
        const { p, gameWidth, gameHeight } = this.ctx;
        this.mapMenu = new MapMenu(p, gameWidth, gameHeight);
    }

    render(mx, my) {
        const { p } = this.ctx;
        p.background(40);
        this.mapMenu.render(p, mx, my);
    }

    mousePressed(mx, my) {
        const { mapMenu } = this;

        if (mapMenu.buttonReturn.isHovered(mx, my)) {
            this.goTo(GameStage.MENU);
        } else if (mapMenu.buttonMap1.isHovered(mx, my)) {
            this.goTo(GameStage.BUILD);
        } else if (mapMenu.buttonMap2.isHovered(mx, my)) {
            this.goTo(GameStage.MAP2);
        }
    }
}
