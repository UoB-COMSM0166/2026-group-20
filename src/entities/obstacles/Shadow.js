import { Obstacle } from '../Obstacle.js';
import { Player } from '../Player.js';
import { GameConfig } from '../../config/GameConfig.js';
import { PlayerState } from '../../config/PlayerState.js';
import { getPixelatedSprite } from '../../utils/PixelSprite.js';

export class Shadow extends Obstacle {
    constructor(p, x, y, ctx) {
        super(p, x, y);
        this._ctx = ctx;
        this._age = 0;
        this._frameCounter = 0;
        this._cooldowns = new Map();
        this._touching = new Set();
        this._replays = [];
        this._nextGhostId = 1000;
    }

    get isSolid() {
        return false;
    }

    get isHazard() {
        return false;
    }

    update(deltaTime) {
        this._age += deltaTime;
        this._frameCounter++;
        for (const [playerNo, remaining] of this._cooldowns) {
            const next = remaining - deltaTime;
            if (next <= 0) this._cooldowns.delete(playerNo);
            else this._cooldowns.set(playerNo, next);
        }
        for (const replay of this._replays) {
            replay.elapsed += deltaTime;
            this._stepReplay(replay, deltaTime);
        }
        this._replays = this._replays.filter((replay) =>
            replay.elapsed < replay.duration &&
            replay.ghost.lifeState === PlayerState.ALIVE,
        );
    }

    applyEffect(player) {
        const playerNo = player.playerNo ?? -1;
        const touching = this._intersectsPlayer(player);
        if (!touching) {
            this._touching.delete(playerNo);
            return;
        }
        if (this._touching.has(playerNo)) return;
        if ((this._cooldowns.get(playerNo) ?? 0) > 0) return;
        this._touching.add(playerNo);

        const history = Array.isArray(player._shadowHistory)
            ? player._shadowHistory
            : [];
        if (history.length < 2) return;

        const firstTime = history[0].time;
        const frames = history.map((snap) => ({
            t: snap.time - firstTime,
            left: snap.left,
            right: snap.right,
            jump: snap.jump,
        }));

        const ghost = new Player(
            this.p,
            player.x,
            player.y,
            this._nextGhostId++,
            player.spriteSheet,
            player.animConfig,
        );
        ghost.input = { left: false, right: false, jump: false };
        ghost.character = player.character;
        ghost.speed = player.speed;
        ghost.jumpVel = player.jumpVel;
        ghost.maxJumps = player.maxJumps;
        ghost.jumpsLeft = player.maxJumps;
        ghost.gravity = player.gravity;
        ghost.maxFall = player.maxFall;
        ghost.x = player.x;
        ghost.y = player.y;

        const tint = this._playerTint(playerNo);
        this._replays.push({
            frames,
            elapsed: 0,
            duration: frames[frames.length - 1]?.t ?? GameConfig.SHADOW_RECORD_MS,
            tint,
            ghost,
            trail: [],
        });
        this._cooldowns.set(playerNo, GameConfig.SHADOW_COOLDOWN_MS);
    }

    draw() {
        const p = this.p;
        const T = GameConfig.TILE;
        const cx = this.x + T / 2;
        const cy = this.y + T / 2;
        const pulse = 0.78 + Math.sin(this._age * 0.005) * 0.12;

        p.noStroke();
        p.fill(40, 24, 62, 170);
        p.circle(cx, cy, T * 0.74);
        p.fill(110, 70, 180, 85);
        p.circle(cx, cy, T * 0.92 * pulse);
        p.stroke(180, 120, 255, 180);
        p.strokeWeight(2);
        p.noFill();
        p.circle(cx, cy, T * 0.8);
        p.noStroke();
        p.fill(235, 220, 255, 220);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text('◌', cx, cy + 1);

        const activeCooldown = this._cooldowns.size > 0;
        if (activeCooldown) {
            const ratio = Math.max(
                ...[...this._cooldowns.values()].map(
                    (value) => value / GameConfig.SHADOW_COOLDOWN_MS,
                ),
            );
            p.noFill();
            p.stroke(255, 220, 255, 180);
            p.strokeWeight(3);
            p.arc(
                cx,
                cy,
                T * 0.98,
                T * 0.98,
                -Math.PI / 2,
                -Math.PI / 2 + Math.PI * 2 * ratio,
            );
            p.noStroke();
        }

        for (const replay of this._replays) {
            this._drawReplay(replay);
        }
    }

    _drawReplay(replay) {
        const p = this.p;
        const ghost = replay.ghost;
        const baseImg = this._resolveFrameImage(ghost);
        const img = getPixelatedSprite(p, baseImg, ghost.character?.pixelScale ?? 1);
        const tint = replay.tint;

        for (const ghostFrame of replay.trail) {
            if (!ghostFrame) continue;
            const alpha = ghostFrame.alpha;
            p.push();
            if (img) {
                p.tint(24, 18, 40, Math.max(20, alpha * 0.65));
                if (!ghostFrame.facingRight) {
                    p.translate(ghostFrame.x + ghostFrame.w + 4, ghostFrame.y + 4);
                    p.scale(-1, 1);
                    p.image(img, 0, 0);
                } else {
                    p.image(img, ghostFrame.x + 4, ghostFrame.y + 4);
                }
                p.tint(tint[0], tint[1], tint[2], alpha);
                if (!ghostFrame.facingRight) {
                    p.translate(ghostFrame.x + ghostFrame.w, ghostFrame.y);
                    p.scale(-1, 1);
                    p.image(img, 0, 0);
                } else {
                    p.image(img, ghostFrame.x, ghostFrame.y);
                }
            } else {
                p.noStroke();
                p.fill(tint[0], tint[1], tint[2], alpha * 0.7);
                p.rect(ghostFrame.x, ghostFrame.y, ghostFrame.w, ghostFrame.h, 6);
            }
            p.pop();
        }

        p.push();
        if (img) {
            p.tint(16, 10, 30, 105);
            if (!ghost.facingRight) {
                p.translate(ghost.x + ghost.w + 5, ghost.y + 5);
                p.scale(-1, 1);
                p.image(img, 0, 0);
            } else {
                p.image(img, ghost.x + 5, ghost.y + 5);
            }
            p.pop();
            p.push();
            p.tint(tint[0], tint[1], tint[2], 185);
            if (!ghost.facingRight) {
                p.translate(ghost.x + ghost.w, ghost.y);
                p.scale(-1, 1);
                p.image(img, 0, 0);
            } else {
                p.image(img, ghost.x, ghost.y);
            }
        } else {
            p.noStroke();
            p.fill(tint[0], tint[1], tint[2], 150);
            p.rect(ghost.x, ghost.y, ghost.w, ghost.h, 6);
        }
        p.pop();
    }

    _resolveFrameImage(player) {
        const cfg = player.animConfig ?? player.character?.animConfig ?? null;
        const framesArr = player.framesArr;
        if (!framesArr?.length) return null;
        if (!cfg) return framesArr[0] ?? null;

        let frameList = cfg.IDLE;
        if (player.movementState === 'RUN') frameList = cfg.RUN;
        else if (player.movementState === 'JUMP') frameList = cfg.JUMP;
        else if (player.movementState === 'FALL') frameList = cfg.FALL;

        if (!Array.isArray(frameList) || frameList.length === 0) {
            return framesArr[0] ?? null;
        }
        const idx = frameList[Math.floor(this._frameCounter / 6) % frameList.length];
        return framesArr[idx] ?? framesArr[0] ?? null;
    }

    _intersectsPlayer(player) {
        return !(
            player.x + player.w <= this.x ||
            player.x >= this.x + this.w ||
            player.y + player.h <= this.y ||
            player.y >= this.y + this.h
        );
    }

    _playerTint(playerNo) {
        return playerNo === 0 ? [120, 200, 255] : [255, 210, 120];
    }

    _stepReplay(replay, deltaTime) {
        const ctx = this._ctx;
        if (!ctx?.tiledMap || !replay?.ghost) return;

        const input = this._getReplayInput(replay);
        replay.ghost.input.left = input.left;
        replay.ghost.input.right = input.right;
        replay.ghost.input.jump = input.jump;

        for (const obs of ctx.placedObstacles) {
            if (obs === this) continue;
            if (obs.carryPlayers) obs.carryPlayers([replay.ghost]);
        }

        for (const obs of ctx.placedObstacles) {
            if (obs === this) continue;
            if (obs.preEffect) obs.preEffect(replay.ghost);
        }

        const respawnManager = {
            triggerDeath: (ghost, reason) => ghost.die(reason),
        };
        replay.ghost.update(
            [],
            respawnManager,
            ctx.placedObstacles,
            ctx.tiledMap.MAP,
            ctx.mapPixelHeight ?? ctx.gameHeight,
        );

        if (replay.ghost.lifeState !== PlayerState.ALIVE) return;

        for (const obs of ctx.placedObstacles) {
            if (obs === this) continue;
            if (obs.applyEffect) {
                obs.applyEffect(
                    replay.ghost,
                    [],
                    respawnManager,
                    ctx.placedObstacles,
                );
            }
        }

        replay.trail.push({
            x: replay.ghost.x,
            y: replay.ghost.y,
            w: replay.ghost.w,
            h: replay.ghost.h,
            facingRight: replay.ghost.facingRight,
            alpha: 0,
        });
        replay.trail = replay.trail.slice(-4);
        replay.trail.forEach((frame, index) => {
            frame.alpha = 45 + index * 28;
        });
    }

    _getReplayInput(replay) {
        const frames = replay.frames;
        if (!frames?.length) return { left: false, right: false, jump: false };
        let active = frames[0];
        for (const snap of frames) {
            if (snap.t > replay.elapsed) break;
            active = snap;
        }
        return active;
    }

    static drawGhost(p, x, y) {
        const T = GameConfig.TILE;
        const cx = x + T / 2;
        const cy = y + T / 2;
        p.noStroke();
        p.fill(90, 60, 150, 110);
        p.circle(cx, cy, T * 0.74);
        p.stroke(190, 140, 255, 120);
        p.strokeWeight(2);
        p.noFill();
        p.circle(cx, cy, T * 0.8);
        p.noStroke();
        p.fill(240, 230, 255, 170);
        p.textAlign(p.CENTER, p.CENTER);
        p.textSize(16);
        p.text('◌', cx, cy + 1);
    }
}
