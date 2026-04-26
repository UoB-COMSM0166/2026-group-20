export function drawBombIcon(p, x, y, w, h) {
    const size = Math.min(w, h) - 3;
    const cx = x + w / 2;
    const cy = y + h / 2 + 1;

    p.push();
    p.noStroke();
    p.fill(0, 0, 0, 52);
    p.ellipse(cx, cy + size * 0.34, size * 0.72, size * 0.2);

    p.fill(38, 42, 50);
    p.circle(cx, cy, size);

    p.fill(255, 255, 255, 60);
    p.circle(cx - size * 0.18, cy - size * 0.22, size * 0.28);

    p.stroke(210, 160, 60);
    p.strokeWeight(Math.max(1.5, size * 0.07));
    p.noFill();
    p.arc(
        cx + size * 0.2,
        cy - size * 0.28,
        size * 0.32,
        size * 0.32,
        Math.PI,
        Math.PI * 1.7,
    );

    p.noStroke();
    p.fill(255, 180, 80);
    p.circle(cx + size * 0.34, cy - size * 0.42, Math.max(3, size * 0.12));
    p.pop();
}
