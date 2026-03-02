export class HUD {
  constructor(p) {
    this.p = p;
  }

  display(players, level) {
    const p = this.p;

    // Semi-transparent top bar
    p.noStroke();
    p.fill(0, 0, 0, 160);
    p.rect(0, 0, p.width, 60);

    // Level (centre)
    p.fill(255, 220, 50);
    p.textSize(16);
    p.textAlign(p.CENTER, p.CENTER);
    p.text(`LEVEL ${level}`, p.width / 2, 30);

    // Per-player panels
    this.drawPlayerPanel(players[0], 20, true);
    this.drawPlayerPanel(players[1], p.width - 20, false);
  }

  drawPlayerPanel(player, x, alignLeft) {
    const p = this.p;
    const align = alignLeft ? p.LEFT : p.RIGHT;

    // Player name
    p.fill(player.col);
    p.textSize(14);
    p.textAlign(align, p.TOP);
    p.text(player.name, x, 6);

    // State: ALIVE / DEAD
    const alive = player.alive;
    p.fill(alive ? p.color(80, 220, 80) : p.color(220, 60, 60));
    p.textSize(12);
    p.text(alive ? "● ALIVE" : "✖ DEAD", x, 24);

    // Coins collected
    p.fill(255, 200, 0);
    p.text(`🪙 x${player.score}`, x, 40);

    // Wallet value
    p.fill(180, 255, 180);
    p.text(`💰 ${player.wallet}g`, alignLeft ? x + 60 : x - 60, 40);
  }
}
