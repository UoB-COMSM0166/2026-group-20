import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RespawnManager } from '../src/systems/RespawnManager.js';
import { GameConfig } from '../src/config/GameConfig.js';
import { PlayerState } from '../src/config/PlayerState.js';

// Mock Configs
vi.mock('../src/config/GameConfig.js', () => ({
    GameConfig: { RESPAWN_TIME: 2000 }, // 2 seconds
}));
vi.mock('../src/config/PlayerState.js', () => ({
    PlayerState: { ALIVE: 'ALIVE', DEAD: 'DEAD' },
}));

describe('RespawnManager', () => {
    let respawnManager, mockScoreManager, mockPlayer;

    beforeEach(() => {
        vi.clearAllMocks();

        mockScoreManager = { recordDeath: vi.fn() };
        respawnManager = new RespawnManager(mockScoreManager);

        mockPlayer = {
            lifeState: 'ALIVE',
            die: vi.fn(function () {
                this.lifeState = 'DEAD';
            }),
            prepareRespawn: vi.fn(),
            finishRespawn: vi.fn(),
            respawnCountdown: 0,
        };
    });

    it('should queue a death and notify ScoreManager', () => {
        respawnManager.triggerDeath(mockPlayer, 'SPIKE');

        expect(mockPlayer.die).toHaveBeenCalledWith('SPIKE');
        expect(mockScoreManager.recordDeath).toHaveBeenCalledWith(mockPlayer);
        expect(respawnManager.queue.length).toBe(1);
    });

    it('should not kill an already dead player', () => {
        mockPlayer.lifeState = 'DEAD';
        respawnManager.triggerDeath(mockPlayer, 'SPIKE');
        expect(respawnManager.queue.length).toBe(0);
    });

    it('should progress through respawn phases based on deltaTime', () => {
        respawnManager.triggerDeath(mockPlayer, 'FALL');

        // Phase 1: Dead -> Respawning
        // Need to pass 2000ms (GameConfig.RESPAWN_TIME)
        respawnManager.update(2001);

        expect(mockPlayer.prepareRespawn).toHaveBeenCalled();
        expect(respawnManager.queue[0].phase).toBe('respawning');

        // Phase 2: Respawning -> Finished
        // Need to pass RESPAWN_TIME / 2 = 1000ms
        respawnManager.update(1001);

        expect(mockPlayer.finishRespawn).toHaveBeenCalled();
        expect(respawnManager.queue.length).toBe(0);
    });

    it('should update the player countdown timer correctly', () => {
        respawnManager.triggerDeath(mockPlayer, 'SPIKE');

        // Total time = 2000 (dead) + 1000 (respawning) = 3000ms
        // Let's pass 500ms. Remaining = 2500ms
        respawnManager.update(500);

        expect(mockPlayer.respawnCountdown).toBe(2.5);
    });

    it('should clear the queue when requested', () => {
        respawnManager.triggerDeath(mockPlayer, 'SPIKE');
        respawnManager.clear();
        expect(respawnManager.queue.length).toBe(0);
    });
});
