import { GameConfig } from '../config/GameConfig.js';


export class GameManager {
  constructor(players) {
    this.timeLimit = GameConfig.TIME_LIMIT;      
    this.timeLeft = GameConfig.TIME_LIMIT;      
    this.isGameOver = false;         
    this.rankings = []; 
    this.players = players;             
  }

  update(deltaTime) {
    if (this.isGameOver) return;

    this.timeLeft -= deltaTime / 1000; 

    if (this.timeLeft <= 0) {
      this.timeLeft = 0;
      this.handleTimeUp();
    }
  }

  onPlayerReachFinish(player) {
    if (this.isGameOver ||player.gameState !== PlayerGameState.PLAYING) return;

    player.setGameState(PlayerGameState.SUCCESS);
    this.rankings.push(player);

    const currentRank = this.rankings.length;
    console.log(`Player arrive end at rank ${currentRank}`);

    if (currentRank === this.players.length) {
      this.isGameOver = true;
      console.log("All players have finished! Game over.");
    }

  }

  handleTimeUp() {
    this.isGameOver = true;
    console.log("Time's up! Game over.");
    
    this.players.forEach(player => {
      if (!player.hasFinished) {
        player.setGameState(PlayerGameState.FAILED);
      }
    });
  }

  getPlayerRank(player) {
    const index = this.rankings.indexOf(player);
    return index !== -1 ? index + 1 : null; 
  }

  reset() {
    this.timeLeft = this.timeLimit;
    this.isGameOver = false;
    this.rankings = [];
  }
}