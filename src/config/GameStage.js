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
    MENU: "MENU",
    MAPMENU: "MAP",
    OPTION1: "OPTION1", // change this
    OPTION2: "OPTION2", 
    MAP1: "MAP1",
    MAP2: "MAP2"
    // add more
})