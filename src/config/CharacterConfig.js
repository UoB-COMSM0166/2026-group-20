import { AnimationConfig } from './AnimationConfig.js';
import { AnimationConfig2 } from './AnimationConfig2.js';

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
        id:          'chicken',
        displayName: 'Chicken',
        spriteKey:   'chicken',
        animConfig:  AnimationConfig,
        colour:      [255, 210, 80],  // yellow
    },
    {
        id:          'bunny',
        displayName: 'Bunny',
        spriteKey:   'bunny',
        animConfig:  AnimationConfig2,
        colour:      [255, 160, 200], // pink
    },
    {
        id:          'duck',
        displayName: 'Duck',
        spriteKey:   'duck',
        animConfig:  AnimationConfig2,
        colour:      [100, 200, 255], // light blue
    },
    {
        id:          'polar',
        displayName: 'Polar Bear',
        spriteKey:   'polar',
        animConfig:  AnimationConfig2,
        colour:      [200, 230, 255], // ice white
    },
];
