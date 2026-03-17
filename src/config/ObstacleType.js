/**
 * Enum of all placeable obstacle types available in the Build phase.
 * Add new entries here as new obstacle classes are implemented.
 */
export const ObstacleType = Object.freeze({
<<<<<<< HEAD
    PLATFORM: 'PLATFORM', // solid block — blocks movement
    SPIKE:    'SPIKE',    // hazard — kills on contact
    CANNON:   'CANNON',  // fires projectiles in a set direction
    SAW:      'SAW',     // spinning blade — hazard, not solid
=======
    // Solid only
    PLATFORM:         'PLATFORM',         // static solid block
    MOVING_PLATFORM:  'MOVING_PLATFORM',  // slides on a fixed path
    FALLING_PLATFORM: 'FALLING_PLATFORM', // drops after player stands on it
    ICE_PLATFORM:     'ICE_PLATFORM',     // solid but zero friction
    BOUNCE_PAD:       'BOUNCE_PAD',       // launches player upward on landing

    // Hazard only
    SPIKE:  'SPIKE',   // static kill zone
    CANNON: 'CANNON',  // fires projectiles
    SAW:    'SAW',     // spinning blade
    FLAME:  'FLAME',   // pulses on/off; kills only when active

    // Solid + hazard
    SPIKE_PLATFORM: 'SPIKE_PLATFORM', // safe from above, deadly from sides/below

    // Special effect (neither solid nor hazard)
    ICE_BLOCK:  'ICE_BLOCK',  // applies sliding physics to nearby players
    WIND_ZONE:  'WIND_ZONE',  // pushes players in a set direction
    TELEPORTER: 'TELEPORTER', // warps player to linked partner
>>>>>>> origin/feature/shop
});
