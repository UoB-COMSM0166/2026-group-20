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
    // constructor(ctx, goTo, bgImage = null) {
    //     super(ctx, goTo);
    //     this.bgImage = bgImage;
    //     console.log("map");
    // }

    enter() {
        const { p, gameWidth, gameHeight } = this.ctx;
        this.mapMenu = new MapMenu(p, gameWidth, gameHeight);
    }

    // useless 
    render(mx, my) {
        const { p, mapSelectBg, gameWidth, gameHeight } = this.ctx;
        console.log("bgImage is missing in MapMenuState");
        if (this.bgImage) {
            p.image(mapSelectBg, 0, 0, gameWidth, gameHeight);
        } else {
            p.background(40);
        }
        this.mapMenu.render(p, mx, my);
    }

    mousePressed(mx, my) {
        const { mapMenu } = this;

        if (mapMenu.buttonReturn.isHovered(mx, my)) {
            this.goTo(GameStage.MENU);
        } else if (mapMenu.buttonMap1.isHovered(mx, my)) {
            this.ctx.selectMap('map1'); // pre-select so ctx is valid
            this.goTo(GameStage.WALK_MAP);
        } else if (mapMenu.buttonMap2.isHovered(mx, my)) {
            this.ctx.selectMap('map2');
            this.goTo(GameStage.WALK_MAP);
        }
    }
}
