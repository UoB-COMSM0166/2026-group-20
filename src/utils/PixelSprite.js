const PIXEL_CACHE = new WeakMap();

function _getScaleKey(pixelScale) {
    return String(Math.max(0.1, Math.min(1, pixelScale)).toFixed(2));
}

export function getPixelatedSprite(p, img, pixelScale = 1) {
    if (!img || pixelScale >= 0.99) return img;

    let byScale = PIXEL_CACHE.get(img);
    if (!byScale) {
        byScale = new Map();
        PIXEL_CACHE.set(img, byScale);
    }

    const key = _getScaleKey(pixelScale);
    if (byScale.has(key)) return byScale.get(key);

    const sampleScale = Number(key);
    const sampleW = Math.max(1, Math.round(img.width * sampleScale));
    const sampleH = Math.max(1, Math.round(img.height * sampleScale));

    const lowRes = p.createGraphics(sampleW, sampleH);
    lowRes.noSmooth();
    lowRes.clear();
    lowRes.image(img, 0, 0, sampleW, sampleH);

    const pixelated = p.createGraphics(img.width, img.height);
    pixelated.noSmooth();
    pixelated.clear();
    pixelated.image(lowRes, 0, 0, img.width, img.height);

    byScale.set(key, pixelated);
    return pixelated;
}
