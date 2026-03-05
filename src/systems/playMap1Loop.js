import { GameConfig, TILE } from "../config/gameConfig";
import { drawMap, MAP } from "./MapGeneration.js";
import { DrawPlayer } from "../utils/DrawPlayer.js";
import { PlayerGameState } from "../config/PlayerGameState.js";

export function playMap1Loop(p, respawnManager, timeManager, players) {
        p.background(25);
        drawMap(p);

        let deltaTime = p.deltaTime || 16.6;
        respawnManager.update(deltaTime);

        timeManager.update(deltaTime);

        if (!timeManager.isGameOver) {
            for (const player of players) {
                if (player.gameState !== PlayerGameState.SUCCESS) {
                    player.update(players, respawnManager);

                    let tx = p.floor((player.x + player.w / 2) / TILE);
                    let ty = p.floor((player.y + player.h / 2) / TILE);

                    if (MAP[ty] && MAP[ty][tx] === "F") {
                        timeManager.onPlayerReachFinish(player);
                    }
                }
            }
        }

        for (const player of players) {
            DrawPlayer(player);
        }

        p.fill(255);
        p.textSize(24);
        p.textAlign(p.CENTER, p.TOP);
        p.text(`Time: ${Math.ceil(timeManager.timeLeft)}s`, GameConfig.GAME_WIDTH / 2, 20);

        if (timeManager.isGameOver) {
            p.fill(0, 0, 0, 150); 
            p.rect(0, 0, GameConfig.GAME_WIDTH, GameConfig.GAME_HEIGHT);
            
            p.fill(255);
            p.textAlign(p.CENTER, p.CENTER);
            p.textSize(48);
            p.text("GAME OVER", GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT / 2 - 50);

            p.textSize(24);
            if (timeManager.rankings.length > 0) {
                let winner = timeManager.rankings[0];
                p.text(`Winner: Player ${winner.playerNo + 1} !`, GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT / 2 + 10);
            } else {
                p.text("Time's Up! Everyone Failed.", GameConfig.GAME_WIDTH / 2, GameConfig.GAME_HEIGHT / 2 + 10);
            }
        }

        p.fill(255);
        p.textSize(14);
        p.textAlign(p.LEFT, p.BOTTOM);
        p.text("P1: A/D + W   P2: ←/→ + ↑   (Press ESC to Return)", 10, GameConfig.GAME_HEIGHT - 10);
    }