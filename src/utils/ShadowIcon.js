/**
 *
 * @param p
 * @param x
 * @param y
 * @param w
 * @param h
 */
export function drawShadowIcon(p, x, y, w, h) {
    const size = Math.min(w, h) - 3;
    const cx = x + w / 2;
    const cy = y + h / 2;

    p.push();
    p.noStroke();
    p.fill(40, 24, 62, 170);
    p.circle(cx, cy, size);

    p.fill(110, 70, 180, 85);
    p.circle(cx, cy, size * 1.12);

    p.stroke(180, 120, 255, 180);
    p.strokeWeight(2);
    p.noFill();
    p.circle(cx, cy, size * 0.8);

    p.noStroke();
    p.fill(235, 220, 255, 220);
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(Math.max(10, size * 0.62));
    p.text('◌', cx, cy + 1);
    p.pop();
}
