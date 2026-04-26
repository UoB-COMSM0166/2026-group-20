export const GameConfig = {
    GAME_WIDTH: 960,
    GAME_HEIGHT: 544,

    RESPAWN_TIME: 2000, // 2 seconds
    SPAWN_POSITION: { x: 100, y: 100 },
    TIME_LIMIT: 120, // 2 minutes

    PLAYERSPEED: 3.2,
    JUMP_VELOCITY: 12,
    GRAVITY: 0.7,
    MAX_FALL_SPEED: 18,
    SKIN_WIDTH: 0.01,

    // Start Screen
    FONT: 'PanasChill',
    TITLE_FONTSIZE: 19,
    TITLE_X: 310,
    TITLE_Y: 200,
    TITLE_COLOUR: { r: 200, g: 232, b: 212 },

    PRESS_FONTSIZE: 7,
    PRESS_X: 350,
    PRESS_Y: 300,
    PRESS_COLOUR: { r: 108, g: 176, b: 152 },

    BUTTON1_X: 330,
    BUTTON1_Y: 330,
    BUTTON1_W: 112,
    BUTTON1_H: 34,

    BUTTON2_X: 480,
    BUTTON2_Y: 330,
    BUTTON2_W: 112,
    BUTTON2_H: 34,

    // MAP MENU
    MAP_TITLE_COLOUR: { r: 143, g: 57, b: 133 }, // purple
    MAP_TITLE_X: 330,
    MAP_TITLE_Y: 200,

    MAP_BUTTON1_X: 200,
    MAP_BUTTON1_Y: 330,
    MAP_BUTTON1_W: 112,
    MAP_BUTTON1_H: 34,

    MAP_BUTTON2_X: 400,
    MAP_BUTTON2_Y: 330,
    MAP_BUTTON2_W: 112,
    MAP_BUTTON2_H: 34,

    MAP_RETURN_X: 50,
    MAP_RETURN_Y: 50,
    MAP_RETURN_R: 30,

    // tile
    TILE: 32,

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
    SAW_TOOTH_COUNT: 10, // number of teeth around the blade circumference

    // Shop — wallet cost to purchase one placement token per item type
    SHOP_PRICES: {
        PLATFORM: 3,
        SPIKE: 5,
        SAW: 7,
        CANNON: 8,
        MOVING_PLATFORM: 6,
        FALLING_PLATFORM: 5,
        ICE_PLATFORM: 4,
        BOUNCE_PAD: 5,
        FLAME: 6,
        SPIKED_BALL: 7,
        ICE_BLOCK: 4,
        WIND_ZONE: 6,
        TELEPORTER: 10,
        BOMB: 8,
        SHADOW: 9,
    },
    SHADOW_RECORD_MS: 5000,
    SHADOW_COOLDOWN_MS: 5000,
    BOMB_FUSE_MS: 2000, // ms before bomb explodes after trigger
    BOMB_RADIUS: 1, // tile radius of explosion (destroys tiles + obstacles)
    BOMB_MAX_DEPTH: 1, // extra tiles below the surface that a bomb can carve out
    BOMB_TRIGGER_RADIUS: 1.5, // tile distance to trigger fuse

    // MovingPlatform
    MOVING_PLATFORM_SPEED: 1.5, // px per frame at 60 fps
    MOVING_PLATFORM_RANGE: 3, // tiles of travel from start position

    // FallingPlatform
    FALLING_PLATFORM_TRIGGER_MS: 500, // ms standing before drop starts
    FALLING_PLATFORM_GRAVITY: 0.4, // px/frame² acceleration while falling

    // BouncePad
    BOUNCE_PAD_FORCE: -18, // vy applied on landing (negative = up)

    // Flame
    FLAME_ON_MS: 1000, // ms active (hazard)
    FLAME_OFF_MS: 700, // ms inactive (safe)

    // WindZone
    WIND_FORCE: 0.35, // px/frame² push applied per frame inside zone

    // Teleporter
    TELEPORTER_COOLDOWN_MS: 1200, // ms before same player can teleport again

    // Developer Mode settings
    DEV_MODE_UNLIMITED_TIME: true, // disables time limit
    DEV_MODE_INSTANT_KILL: true, // K key to kill current player
    DEV_MODE_TELEPORT_TO_END: true, // E key to teleport to finish line
    DEV_MODE_FREEZE_TIME: true, // T key to freeze/unfreeze time
};
