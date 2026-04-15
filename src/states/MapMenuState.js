import { State } from './State.js';
import { MapMenu } from '../ui/MapMenu.js';
import { GameStage } from '../config/GameStage.js';

/**
 * MapMenuState — map selection screen.
 *
 * Transitions:
 *   Return button → MenuState
 *   Map button    → BuildState (after map switch)
 */
export class MapMenuState extends State {
    enter() {
        //added font
        const { p, gameWidth, gameHeight, font } = this.ctx;
        //const { p, font } = this.ctx;
        //this.mapMenu = new MapMenu(p, gameWidth, gameHeight, font);
        this.mapMenu = new MapMenu(p, font);
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
            this.ctx.selectMap('map1');
            this.goTo(GameStage.TUTORIAL);
        } else if (mapMenu.buttonMap2.isHovered(mx, my)) {
            this.ctx.selectMap('map2');
            this.goTo(GameStage.TUTORIAL);
        }
    }
}
