/**
 * A list of all valid game stages
 *
 * @enum {string}
 *
 * @property {string} MENU
 * Main menu screen
 *
 * @property {string} MAPMENU
 * Map selection menu
 *
 * @property {string} MAP1
 * First playable map.
 *
 * @property {string} MAP1
 * Second playable map.
 */

export const GameStage = Object.freeze({
    BOOT:    'BOOT',
    MENU:    'MENU',
    MAPMENU: 'MAPMENU',
    BUILD:   'BUILD',
    RUN:     'RUN',
    RESULTS: 'RESULTS',
    SHOP:    'SHOP',
    MAP2:    'MAP2',
});
