import { describe, it, expect, beforeEach } from 'vitest';
import { PlayerScore } from '../src/models/PlayerScore.js';

describe('PlayerScore', () => {
    let score;

    beforeEach(() => {
        score = new PlayerScore(0); // Initialize for Player 1
    });

    describe('Initialization', () => {
        it('should initialize with default values', () => {
            expect(score.playerNo).toBe(0);
            expect(score.finished).toBe(false);
            expect(score.deaths).toBe(0);
            expect(score.rank).toBe(null);
        });
    });

    describe('finishTimeFormatted', () => {
        it('should return "—" if finishTime is null', () => {
            score.finishTime = null;
            expect(score.finishTimeFormatted).toBe('—');
        });

        it('should format times under 60 seconds correctly (e.g., 45.2s)', () => {
            score.finishTime = 45.23;
            // .toFixed(1) makes 45.23 -> "45.2"
            // .padStart(4, '0') makes "45.2" -> "45.2" (already 4 chars)
            expect(score.finishTimeFormatted).toBe('45.2s');
        });

        it('should format times over 60 seconds with minutes (e.g., 1:05.5)', () => {
            score.finishTime = 65.5;
            // 1 min, 5.5 secs. padStart(4, '0') makes "5.5" -> "05.5"
            expect(score.finishTimeFormatted).toBe('1:05.5');
        });

        it('should handle zero seconds correctly', () => {
            score.finishTime = 0;
            expect(score.finishTimeFormatted).toBe('00.0s');
        });
    });

    describe('rankFormatted', () => {
        it('should return "—" if rank is null', () => {
            score.rank = null;
            expect(score.rankFormatted).toBe('—');
        });

        it('should correctly format ordinal suffixes', () => {
            const cases = [
                { rank: 1, expected: '1st' },
                { rank: 2, expected: '2nd' },
                { rank: 3, expected: '3rd' },
                { rank: 4, expected: '4th' },
                { rank: 10, expected: '10th' },
            ];

            cases.forEach(({ rank, expected }) => {
                score.rank = rank;
                expect(score.rankFormatted).toBe(expected);
            });
        });
    });
});
