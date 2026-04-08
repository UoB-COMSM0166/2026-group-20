// tests/ScoreManager.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import { ScoreManager } from '../src/systems/ScoreManager.js';

//Reward algorithm:
//1st → 20   2nd → 10   3rd → 5   4th → 2   Fail → 0

// only test for two players 

describe('ScoreManager', () => {
  let players;
  let manager;

  beforeEach(() => {
    players = [{ playerNo: 0 }, { playerNo: 1 }];
    manager = new ScoreManager(players);
  });

// getWallet - how much money the player has 
// getRoundCoins - how much money the play collected in the current round
// collectCoin - adds the coin value to the player's current round coin total 
// recordDeath - records how many deaths
// onPlayerFinish - when a player reaches the goal 
// onPlayerFail - when a player does not reach the goal 
// getRankedScores - sorted leaderboard for all players 

// initial wallet is 0
// wallet increases after finishing a round 
// wallet persists across the round

  it('all players start with 0 wallet and 0 coins', () => {
    expect(manager.getWallet(players[0])).toBe(0);
    expect(manager.getWallet(players[1])).toBe(0);
    expect(manager.getRoundCoins(players[0])).toBe(0);
    expect(manager.getRoundCoins(players[1])).toBe(0);
  });

// coins increase after collection 
  it('adds collected coins', () => {
    manager.collectCoin(players[0], {value: 3});
    manager.collectCoin(players[0], {value: 2});
    expect(manager.getRoundCoins(players[0])).toBe(5);
    expect(manager.getRoundCoins(players[1])).toBe(0);

    manager.collectCoin(players[1], {value: 4});
    manager.collectCoin(players[1], {value: 2});
    expect(manager.getRoundCoins(players[0])).toBe(5);
    expect(manager.getRoundCoins(players[1])).toBe(6);
  });

// check deaths 
  it('records player deaths', () => {
    manager.recordDeath(players[0]);
    manager.recordDeath(players[0]);
    manager.recordDeath(players[0]);
    manager.recordDeath(players[0]);
    manager.recordDeath(players[0]);

    expect(manager.getScore(players[0]).deaths).toBe(5);
  });

// 
  it('awards finish reward plus collected coins to wallet', () => {
    manager.collectCoin(players[0], {value: 4});
    manager.onPlayerFinish(players[0], 1, 12); 

    expect(manager.getWallet(players[0])).toBe(24);
    expect(manager.getRoundCoins(players[0])).toBe(0); // reset after finish 

    const score = manager.getScore(players[0]);
    expect(score.finished).toBe(true);
    expect(score.finishTime).toBe(12);
    expect(score.coins).toBe(4);
    expect(score.wallet).toBe(24);
  });

// if the player fails 
  it('clears round coins but does not change wallet when player fails', () => {
    manager.collectCoin(players[1], {value: 6});
    manager.onPlayerFail(players[1]);

    expect(manager.getWallet(players[1])).toBe(0);
    expect(manager.getRoundCoins(players[1])).toBe(0);
    const score = manager.getScore(players[1]);
    expect(score.finished).toBe(false);
    expect(score.coins).toBe(6);
    expect(score.wallet).toBe(0);
  });


  it('ranks finished players before failed players', () => {
    manager.collectCoin(players[0], {value: 2});
    manager.collectCoin(players[1], {value: 8});

    manager.onPlayerFinish(players[0], 1, 10.5);
    manager.onPlayerFail(players[1]);

    const ranked = manager.getRankedScores();

    expect(ranked[0].playerNo).toBe(0);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[1].playerNo).toBe(1);
    expect(ranked[1].rank).toBe(2);
  });

  it('orders finished players by lower finish time', () => {
    manager.onPlayerFinish(players[0], 2, 15.2);
    manager.onPlayerFinish(players[1], 1, 9.8);

    const ranked = manager.getRankedScores();

    expect(ranked[0].playerNo).toBe(1);
    expect(ranked[1].playerNo).toBe(0);
  });

  it('spends wallet only when enough money is available', () => {
    manager.collectCoin(players[0], { value: 5 });
    manager.onPlayerFinish(players[0], 1, 8.0); // 25

    expect(manager.spendWallet(players[0], 10)).toBe(true);
    expect(manager.getWallet(players[0])).toBe(15);

    expect(manager.spendWallet(players[0], 20)).toBe(false);
    expect(manager.getWallet(players[0])).toBe(15);
  });

  it('resetRound clears round coins and score records but keeps wallet', () => {
    manager.collectCoin(players[0], { value: 3 });
    manager.recordDeath(players[0]);
    manager.onPlayerFinish(players[0], 1, 11.1); 

    manager.resetRound();

    expect(manager.getWallet(players[0])).toBe(23);
    expect(manager.getRoundCoins(players[0])).toBe(0);

    const score = manager.getScore(players[0]);
    expect(score.deaths).toBe(0);
    expect(score.finished).toBe(false);
    expect(score.finishTime).toBe(null);
    expect(score.rank).toBe(null);
  });
  it('spend exact wallet amount', () => {
    manager.collectCoin(players[0], { value: 5 });
    manager.collectCoin(players[1], { value: 3 });

    manager.onPlayerFinish(players[0], 1, 12);
    manager.onPlayerFinish(players[1], 2, 14.68);

    expect(manager.spendWallet(players[0], 25)).toBe(true);
    expect(manager.getWallet(players[0])).toBe(0);

    expect(manager.spendWallet(players[1], 13)).toBe(true);
    expect(manager.getWallet(players[1])).toBe(0);
  });


  it('spend wallet with no coins', () => {
    manager.collectCoin(players[0], {value: 5});
    manager.onPlayerFail(players[0]); 
    
    expect(manager.getWallet(players[0])).toBe(0);
    expect(manager.spendWallet(players[0], 25)).toBe(false);
  });

  it('handles tie finish times in ranking', () => {
    manager.onPlayerFinish(players[0], 1, 10.0);
    manager.onPlayerFinish(players[1], 2, 10.0);

    const ranked = manager.getRankedScores();

    expect(ranked.length).toBeGreaterThanOrEqual(2);

    const p0 = ranked.find(p => p.playerNo === 0);
    const p1 = ranked.find(p => p.playerNo === 1);

    expect(p0.finished).toBe(true);
    expect(p1.finished).toBe(true);

    expect(p0.finishTime).toBe(10.0);
    expect(p1.finishTime).toBe(10.0);
  });

  it('finish with no coins collected', () => {
    manager.onPlayerFinish(players[0], 1, 9.5);

    expect(manager.getRoundCoins(players[0])).toBe(0);
    expect(manager.getWallet(players[0])).toBe(20);
  });

});
