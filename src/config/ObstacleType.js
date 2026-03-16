/**
 * Enum of all placeable obstacle types available in the Build phase.
 * Add new entries here as new obstacle classes are implemented.
 */
export const ObstacleType = Object.freeze({
    PLATFORM: 'PLATFORM', // solid block — blocks movement
    SPIKE: 'SPIKE', // hazard — kills on contact
});
