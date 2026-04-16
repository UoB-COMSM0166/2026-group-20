/**
 * A list of all valid game stages
 * @enum {string}
 *
 * @property {string} BOOT
 * Initial boot / splash screen.
 *
 * @property {string} MENU
 * Main menu screen
 * @property {string} MAPMENU
 * Map selection menu
 *
 * @property {string} BUILD
 * Build phase before the run starts.
 *
 * @property {string} RUN
 * Active gameplay phase.
 *
 * @property {string} RESULTS
 * Results / end-of-round screen.
 *
 */

export const GameStage = Object.freeze({
    BOOT: 'BOOT',
    MENU: 'MENU',
    CHAR_SELECT: 'CHAR_SELECT',
    MAPMENU: 'MAPMENU',
    BUILD: 'BUILD',
    RUN: 'RUN',
    RESULTS: 'RESULTS',
    SHOP: 'SHOP',
    TUTORIAL: 'TUTORIAL',
    WALK_MAP: 'WALK_MAP',
});
