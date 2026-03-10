export const GameConfig = {
    GAME_WIDTH: 1920,
    GAME_HEIGHT: 1080,

    RESPAWN_TIME: 2000, // 2 seconds
    SPAWN_POSITION: { x: 100, y: 100 },
    TIME_LIMIT: 120, // 2 minutes

    PLAYERSPEED: 3.2,
    JUMP_VELOCITY: 12,
    GRAVITY: 0.7,
    MAX_FALL_SPEED: 18,
    SKIN_WIDTH: 0.01,

    // Start Screen
    FONT: 'Monaco',
    TITLE_FONTSIZE: 20,
    TITLE_X: 310,
    TITLE_Y: 200,
    TITLE_COLOUR: { r: 143, g: 57, b: 133 }, // purple

    PRESS_FONTSIZE: 15,
    PRESS_X: 350,
    PRESS_Y: 300,
    PRESS_COLOUR: { r: 0, g: 0, b: 225 }, // blue

    BUTTON1_X: 330,
    BUTTON1_Y: 330,
    BUTTON1_W: 60,
    BUTTON1_H: 25,

    BUTTON2_X: 480,
    BUTTON2_Y: 330,
    BUTTON2_W: 60,
    BUTTON2_H: 25,

    // MAP MENU
    MAP_TITLE_COLOUR: { r: 143, g: 57, b: 133 }, // purple
    MAP_TITLE_X: 330,
    MAP_TITLE_Y: 200,

    MAP_BUTTON1_X: 200,
    MAP_BUTTON1_Y: 330,
    MAP_BUTTON1_W: 60,
    MAP_BUTTON1_H: 25,

    MAP_BUTTON2_X: 400,
    MAP_BUTTON2_Y: 330,
    MAP_BUTTON2_W: 60,
    MAP_BUTTON2_H: 25,

    MAP_RETURN_X: 50,
    MAP_RETURN_Y: 50,
    MAP_RETURN_R: 30,

    // tile
    TILE: 40,

    // Reward algorithm: index 0 = 1st place, 1 = 2nd, etc. Fail = 0.
    FINISH_REWARDS: [20, 10, 5, 2],

    // Value of each coin collected during a round
    COIN_VALUE: 1,

    // Cannon
    CANNON_FIRE_INTERVAL: 2200, // ms between shots
    CANNON_PROJECTILE_SPEED: 5, // pixels per frame
    CANNON_PROJECTILE_RADIUS: 7,

    // Saw
    SAW_ROTATION_SPEED: 0.005, // radians per millisecond (~0.8 rotations/second)
    SAW_TOOTH_COUNT: 10,       // number of teeth around the blade circumference
};
