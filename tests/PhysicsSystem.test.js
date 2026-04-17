import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
    moveAndCollideX,
    moveAndCollideY,
    checkSpikeCollision,
} from '../src/systems/PhysicsSystem.js';
import { isSolid, isSpike } from '../src/maps/TiledMapLoader.js';

// Mock dependencies
vi.mock('../src/maps/TiledMapLoader.js', () => ({
    isSolid: vi.fn(),
    isSpike: vi.fn(),
}));

vi.mock('../src/config/GameConfig.js', () => ({
    GameConfig: { TILE: 32 },
}));

describe('Physics Module', () => {
    let mockP5, mockEntity;

    beforeEach(() => {
        vi.clearAllMocks();
        mockP5 = { floor: Math.floor };
        mockEntity = {
            x: 0,
            y: 0,
            w: 20,
            h: 20,
            skin: 0,
            vy: 0,
            onGround: false,
            lifeState: 'ALIVE',
        };
    });

    describe('moveAndCollideX', () => {
        it('should move entity when no collision exists', () => {
            isSolid.mockReturnValue(false);
            moveAndCollideX(mockEntity, 5, [], mockP5);
            expect(mockEntity.x).toBe(5);
        });

        it('should stop entity at tile boundary when moving right into a solid', () => {
            // Setup: Entity at x=20 moving right by 15 (end x=35).
            // Solid tile exists at x=32 (Tile index 1).
            mockEntity.x = 20;
            isSolid.mockImplementation((tx, ty) => tx === 1);

            moveAndCollideX(mockEntity, 15, [], mockP5);

            // Expected: tileX (32) - entity.w (20) - skin (0) = 12
            // Note: Your logic moves the entity first, then checks.
            expect(mockEntity.x).toBe(12);
        });

        it('should collide with other ALIVE players', () => {
            const otherPlayer = {
                x: 50,
                y: 0,
                w: 20,
                h: 20,
                lifeState: 'ALIVE',
            };
            mockEntity.x = 40;

            moveAndCollideX(mockEntity, 5, [otherPlayer], mockP5);

            // Expected: other.x (50) - entity.w (20) = 30
            expect(mockEntity.x).toBe(30);
        });
    });

    describe('moveAndCollideY', () => {
        it('should set onGround to true when landing on a tile', () => {
            mockEntity.y = 10;
            // Solid tile at index 1 (y=32)
            isSolid.mockImplementation((tx, ty) => ty === 1);

            moveAndCollideY(mockEntity, 25, [], mockP5);

            expect(mockEntity.onGround).toBe(true);
            expect(mockEntity.vy).toBe(0);
            expect(mockEntity.y).toBe(32 - mockEntity.h);
        });

        it('should resolve collision against solid obstacles', () => {
            const obs = { x: 0, y: 50, w: 32, h: 32, isSolid: true };
            mockEntity.y = 40;

            moveAndCollideY(mockEntity, 15, [], mockP5, [obs]);

            expect(mockEntity.y).toBe(50 - mockEntity.h);
        });
    });

    describe('checkSpikeCollision', () => {
        it('should return true if overlapping a spike tile', () => {
            isSpike.mockReturnValue(true);
            const result = checkSpikeCollision(mockEntity, mockP5, []);
            expect(result).toBe(true);
        });

        it('should return true if overlapping a hazard obstacle', () => {
            isSpike.mockReturnValue(false);
            const hazard = { x: 5, y: 5, w: 10, h: 10, isHazard: true };
            const result = checkSpikeCollision(mockEntity, mockP5, [hazard]);
            expect(result).toBe(true);
        });
    });
});
