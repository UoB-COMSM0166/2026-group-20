export function drawShadowIcon(p, x, y, w, h) {
    const size = Math.min(w, h) - 3;
    const cx = x + w / 2;
    const cy = y + h / 2;
    const outer = size * 0.94;
    const ring = size * 0.7;
    const core = size * 0.34;

    p.push();
    p.noStroke();
    p.fill(18, 12, 44, 90);
    p.ellipse(cx, cy + size * 0.29, size * 0.9, size * 0.24);

    p.fill(50, 34, 108, 238);
    p.circle(cx, cy, outer);

    p.stroke(160, 245, 255, 215);
    p.strokeWeight(Math.max(1, size * 0.055));
    p.noFill();
    p.circle(cx, cy, ring);

    p.stroke(214, 190, 255, 170);
    p.strokeWeight(Math.max(1, size * 0.04));
    p.circle(cx, cy, size * 0.5);

    p.noStroke();
    p.fill(16, 20, 48, 245);
    p.circle(cx, cy, core);

    p.fill(78, 235, 255, 185);
    p.rect(cx - size * 0.06, cy - size * 0.28, size * 0.12, size * 0.56, 2);
    p.rect(cx - size * 0.28, cy - size * 0.06, size * 0.56, size * 0.12, 2);

    p.push();
    p.translate(cx, cy);
    p.rotate(Math.PI / 4);
    p.rect(-size * 0.045, -size * 0.22, size * 0.09, size * 0.44, 2);
    p.rect(-size * 0.22, -size * 0.045, size * 0.44, size * 0.09, 2);
    p.pop();

    p.fill(180, 248, 255, 220);
    p.circle(cx, cy, size * 0.18);
    p.fill(255, 255, 255, 135);
    p.circle(cx - size * 0.16, cy - size * 0.18, Math.max(2, size * 0.12));
    p.circle(cx + size * 0.18, cy + size * 0.12, Math.max(2, size * 0.08));
    p.pop();
}
