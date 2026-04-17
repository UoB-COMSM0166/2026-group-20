import { AnimationConfigChick } from './AnimationConfigChick.js';
import { AnimationConfigBunny } from './AnimationConfigBunny.js';
import { AnimationConfigDuck } from './AnimationConfigDuck.js';
import { AnimationConfigPolar } from './AnimationConfigPolar.js';

/**
 * All selectable characters with individual attributes.
 *
 * speed     — horizontal movement (default 3.2)
 * jumpVel   — jump force (default 12, higher = jump higher)
 * maxJumps  — number of allowed mid-air jumps (default 2)
 * gravity   — fall acceleration per frame (default 0.7, higher = falls faster)
 * tagline   — shown on the character card in CharSelectState
 */
export const CHARACTERS = [
    {
        id: 'chicken',
        displayName: 'Chicken',
        spriteKey: 'chicken',
        animConfig: AnimationConfigChick,
        colour: [255, 210, 80],
        // Balanced all-rounder
        speed:    3.2,
        jumpVel:  12,
        maxJumps: 2,
        gravity:  0.7,
        tagline:  'Balanced all-rounder',
        stats:    { Speed: 3, Jump: 3, Agility: 3 },
        pixelScale: 1,
    },
    {
        id: 'bunny',
        displayName: 'Bunny',
        spriteKey: 'bunny',
        animConfig: AnimationConfigBunny,
        colour: [255, 160, 200],
        // Triple jump specialist
        speed:    3.2,
        jumpVel:  12,
        maxJumps: 3,
        gravity:  0.7,
        tagline:  'Triple jump, floaty',
        stats:    { Speed: 3, Jump: 3, Agility: 4 },
        pixelScale: 1,
    },
    {
        id: 'duck',
        displayName: 'Duck',
        spriteKey: 'duck',
        animConfig: AnimationConfigDuck,
        colour: [100, 200, 255],
        // Fast runner
        speed:    3.2,
        jumpVel:  12,
        maxJumps: 2,
        gravity:  0.7,
        tagline:  'Speed demon',
        stats:    { Speed: 3, Jump: 3, Agility: 3 },
        pixelScale: 0.62,
    },
    {
        id: 'polar',
        displayName: 'Polar Bear',
        spriteKey: 'polar',
        animConfig: AnimationConfigPolar,
        colour: [200, 230, 255],
        // Slow heavy tanky
        speed:    3.2,
        jumpVel:  12,
        maxJumps: 2,
        gravity:  0.7,
        tagline:  'Heavy & sturdy',
        stats:    { Speed: 3, Jump: 3, Agility: 2 },
        pixelScale: 1,
    },
];
