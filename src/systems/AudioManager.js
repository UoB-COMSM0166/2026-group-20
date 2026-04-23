/**
 * AudioManager — Web Audio API based sound system.
 *
 * No external audio files required. All sounds are synthesised
 * procedurally using OscillatorNode / GainNode.
 *
 * Public API:
 *   playSound(name)          — play a one-shot SFX ('coin', 'death', 'finish', 'jump', 'bounce')
 *   playMusic()              — start the looping background melody
 *   stopMusic()              — stop background music immediately
 *   toggleAudio(type)        — type: 'sfx' | 'music' | 'all'
 *   get sfxEnabled           — bool
 *   get musicEnabled         — bool
 *
 * Wire into ctx in sketch.js and call from game states.
 */
export class AudioManager {
    constructor() {
        this._ctx = null;
        //this._musicGain = null;
        //this._musicNodes = [];
        //this._musicTimer = null;
        this._musicTrack = null;
        this._sfxEnabled = true;
        this._musicEnabled = true;
        this._musicPlaying = false;
    }

    // ── Public getters ────────────────────────────────────────────────────

    get sfxEnabled() {
        return this._sfxEnabled;
    }
    get musicEnabled() {
        return this._musicEnabled;
    }

    // ── Initialise ────────────────────────────────────────────────────────

    /** Call once on first user interaction to unlock the AudioContext. */
    _ensureCtx() {
        if (this._ctx) return;
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();

        this._musicGain = this._ctx.createGain();
        this._musicGain.gain.value = 0.18;
        this._musicGain.connect(this._ctx.destination);
    }

    /**
     * Play a one-shot synthesised sound effect.
     * @param {'coin'|'death'|'finish'|'jump'|'bounce'} name
     */
    playSound(name) {
        if (!this._sfxEnabled) return;
        const now = performance.now();
        if (!this._lastSfxTime) this._lastSfxTime = {};
        if (this._lastSfxTime[name] && now - this._lastSfxTime[name] < 80)
            return;
        this._lastSfxTime[name] = now;

        try {
            this._ensureCtx();
            const ac = this._ctx;
            const t = ac.currentTime;

            switch (name) {
                case 'coin':
                    this._tone(
                        ac,
                        t,
                        1500,
                        0.05,
                        'sine',
                        0.7,
                        [
                            [0, 0.7],
                            [0.05, 0.0],
                        ],
                        2000,
                    );
                    break;
                case 'jump':
                    this._tone(
                        ac,
                        t,
                        800,
                        0.1,
                        'sawtooth',
                        0.6,
                        [
                            [0, 0.6],
                            [0.1, 0.0],
                        ],
                        1200,
                    );
                    break;
                case 'bounce':
                    this._tone(
                        ac,
                        t,
                        1200,
                        0.06,
                        'sine',
                        0.6,
                        [
                            [0, 0.6],
                            [0.06, 0.0],
                        ],
                        600,
                    );
                    break;
                case 'death':
                    this._tone(
                        ac,
                        t,
                        800,
                        0.3,
                        'sine',
                        0.7,
                        [
                            [0, 0.7],
                            [0.3, 0.0],
                        ],
                        100,
                    );
                    break;
                case 'finish':
                    this._chord(ac, t, [880, 1108, 1318, 1760], 0.9);
                    break;
            }
        } catch (e) {}
    }

    setMusicTrack(track) {
        this._musicTrack = track;
    }

    /**
     * Start the background music loop (simple 8-bit style melody).
     * Safe to call multiple times — won't double-start.
     */
    playMusic() {
        if (!this._musicEnabled || this._musicPlaying) return;
        try {
            if (!this._musicTrack.isPlaying()) {
                this._musicTrack.setLoop(true);
                this._musicTrack.setVolume(0.25);
                this._musicTrack.play();
            }
            this._musicPlaying = true;
        } catch (e) {}
    }

    /** Stop background music. */
    stopMusic() {
        this._musicPlaying = false;
        try {
            if (this._musicTrack?.isPlaying()) {
                this._musicTrack.stop();
            }
        } catch (e) {}
    }

    /**
     * Toggle a specific audio type.
     * @param {'sfx'|'music'|'all'} type
     */
    toggleAudio(type) {
        if (type === 'sfx' || type === 'all') {
            this._sfxEnabled = !this._sfxEnabled;
        }
        if (type === 'music' || type === 'all') {
            this._musicEnabled = !this._musicEnabled;
            if (!this._musicEnabled) {
                this.stopMusic();
            } else if (this._musicPlaying === false) {
                this.playMusic();
            }
        }
    }
    /**
     * Play a single synthesised tone.
     * @param {AudioContext} ac
     * @param {number} t         - AudioContext start time
     * @param {number} freq      - Start frequency (Hz)
     * @param {number} duration  - Duration (s)
     * @param {string} type      - OscillatorType
     * @param {number} volume    - Peak gain
     * @param {number[][]} env   - [[time, gain], ...] envelope points
     * @param {number} [endFreq] - Frequency at end (for pitch sweep)
     * @private
     */
    _tone(ac, t, freq, duration, type, volume, env, endFreq) {
        const osc = ac.createOscillator();
        const gain = ac.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, t);
        if (endFreq !== undefined) {
            osc.frequency.linearRampToValueAtTime(endFreq, t + duration);
        }

        gain.gain.setValueAtTime(0, t);
        for (const [dt, v] of env) {
            gain.gain.linearRampToValueAtTime(v * volume, t + dt);
        }

        osc.connect(gain);
        gain.connect(this._ctx.destination);
        osc.start(t);
        osc.stop(t + duration);
    }

    /**
     * Play a short ascending chord (victory / finish sound).
     * @private
     */
    _chord(ac, t, freqs, vol) {
        freqs.forEach((freq, i) => {
            const delay = i * 0.08;
            const duration = 0.4;
            this._tone(ac, t + delay, freq, duration, 'sine', vol, [
                [0, 0.18],
                [duration * 0.8, 0.0],
            ]);
        });
    }
}
