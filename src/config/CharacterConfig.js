import { AnimationConfigChick } from './AnimationConfigChick.js';
import { AnimationConfigBunny } from './AnimationConfigBunny.js';
import { AnimationConfigDuck } from './AnimationConfigDuck.js';
import { AnimationConfigPolar } from './AnimationConfigPolar.js';

/**
 * All selectable characters.
 *
 * spriteKey — matches the key in ctx.sprites (loaded in sketch.js preload).
 * animConfig — the animation frame-index map for this character.
 * displayName — shown on the selection card.
 * colour — accent colour used in the character select UI.
 */

export const CHARACTERS = [
    {
        id: 'chicken',
        displayName: 'Chicken',
        spriteKey: 'chicken',
        animConfig: AnimationConfigChick,
        colour: [255, 210, 80], // yellow
    },
    {
        id: 'bunny',
        displayName: 'Bunny',
        spriteKey: 'bunny',
        animConfig: AnimationConfigBunny,
        colour: [255, 160, 200], // pink
    },
    {
        id: 'duck',
        displayName: 'Duck',
        spriteKey: 'duck',
        animConfig: AnimationConfigDuck,
        colour: [100, 200, 255], // light blue
    },
    {
        id: 'polar',
        displayName: 'Polar Bear',
        spriteKey: 'polar',
        animConfig: AnimationConfigPolar,
        colour: [200, 230, 255], // ice white
    },
];
