import { describe, it, expect, beforeEach} from "vitest";
import { TimeManager } from "../src/systems/TimeManager.js";
import { ScoreManager } from "../src/systems/ScoreManager.js";
import { GameConfig } from "../src/config/GameConfig.js";
import { PlayerGameState } from "../src/config/PlayerGameState.js";


describe('TimeManager', () => {

    // update - count down and tigger game over 
    // handleTimeUp - unfinished player 
    // getPlayerRank - null if not finish
    // reset - reset timer 

    let players;
    let scoreManager;
    let manager;

    beforeEach(() => {
        players = [
        {
            playerNo: 0,
            gameState: PlayerGameState.PLAYING,
            setGameState(newState) {
                this.gameState = newState;
            },
        },
        {
            playerNo: 1,
            gameState: PlayerGameState.PLAYING,
            setGameState(newState) {
                this.gameState = newState;
            },
        },
        ];

        scoreManager = new ScoreManager(players);
        manager = new TimeManager(players, scoreManager);
    });

    it("reduces time by 1s", () => {
        manager.update(1000);
        expect(manager.timeLeft).toBe(119);
    });


    it("reduces time by 120s", () => {
        manager.update(120000);
        expect(manager.timeLeft).toBe(0);
    });

    it("reduces time by 150s", () => {
        manager.update(150000);
        expect(manager.timeLeft).toBe(0);
    });

    // onPlayerReachFinish - when the player reaches the goal 
    it("marks player as SUCCESS and updates score", () => {
        manager.update(5000);
        manager.onPlayerReachFinish(players[0]);

        expect(players[0].gameState).toBe(PlayerGameState.SUCCESS);

        const score = scoreManager.getScore(players[0]);
        expect(score.finished).toBe(true);
        expect(score.finishTime).toBe(5);
    });

     it("gives correct ranking", () => {
        manager.onPlayerReachFinish(players[0]);
        manager.onPlayerReachFinish(players[1]);

        expect(manager.getPlayerRank(players[0])).toBe(1);
        expect(manager.getPlayerRank(players[1])).toBe(2);
    });

    it("fails unfinished players when time runs out", () => {
        manager.onPlayerReachFinish(players[0]);
        manager.update(200000); 

        expect(players[0].gameState).toBe(PlayerGameState.SUCCESS);
        expect(players[1].gameState).toBe(PlayerGameState.FAILED);

        const score = scoreManager.getScore(players[1]);
        expect(score.finished).toBe(false);
    });

    it("ends game when all players finish", () => {
        manager.onPlayerReachFinish(players[0]);
        manager.onPlayerReachFinish(players[1]);

        expect(manager.isGameOver).toBe(true);
    });

    it("reset clears rankings and restores time", () => {
        manager.onPlayerReachFinish(players[0]);
        manager.update(5000);

        manager.reset();

        expect(manager.timeLeft).toBe(GameConfig.TIME_LIMIT);
        expect(manager.rankings.length).toBe(0);
        expect(manager.isGameOver).toBe(false);
    });
});