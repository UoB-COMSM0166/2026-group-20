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
        // Lazily create AudioContext on first interaction (browser autoplay policy)
        this._ctx       = null;
        this._musicGain = null;
        this._musicNodes = [];   // currently playing music oscillators
        this._musicTimer = null; // setInterval handle

        this._sfxEnabled   = true;
        this._musicEnabled = false;
        this._musicPlaying = false;

        // Beat index for the music sequencer
        this._beat = 0;
    }

    // ── Public getters ────────────────────────────────────────────────────

    get sfxEnabled()   { return this._sfxEnabled;   }
    get musicEnabled() { return this._musicEnabled; }

    // ── Initialise ────────────────────────────────────────────────────────

    /** Call once on first user interaction to unlock the AudioContext. */
    _ensureCtx() {
        if (this._ctx) return;
        this._ctx = new (window.AudioContext || window.webkitAudioContext)();

        this._musicGain = this._ctx.createGain();
        this._musicGain.gain.value = 0.18;
        this._musicGain.connect(this._ctx.destination);
    }

    // ── SFX ──────────────────────────────────────────────────────────────

    /**
     * Play a one-shot synthesised sound effect.
     * @param {'coin'|'death'|'finish'|'jump'|'bounce'} name
     */
    playSound(name) {
        if (!this._sfxEnabled) return;
        try {
            this._ensureCtx();
            const ac = this._ctx;
            const t  = ac.currentTime;

            switch (name) {
                case 'coin':    this._tone(ac, t, 880, 0.08, 'sine',     0.15, [[0, 0.18],[0.05, 0.0]]); break;
                case 'jump':    this._tone(ac, t, 300, 0.06, 'square',   0.12, [[0, 0.12],[0.1,  0.0]], 600); break;
                case 'bounce':  this._tone(ac, t, 500, 0.05, 'sine',     0.14, [[0, 0.14],[0.08, 0.0]], 800); break;
                case 'death':   this._tone(ac, t, 220, 0.25, 'sawtooth', 0.25, [[0, 0.20],[0.2,  0.0]], 80);  break;
                case 'finish':  this._chord(ac, t, [523, 659, 784, 1047], 0.5); break;
                default: break;
            }
        } catch(e) { /* silently ignore audio errors */ }
    }

    // ── Music ─────────────────────────────────────────────────────────────

    /**
     * Start the background music loop (simple 8-bit style melody).
     * Safe to call multiple times — won't double-start.
     */
    playMusic() {
        if (!this._musicEnabled || this._musicPlaying) return;
        try {
            this._ensureCtx();
            this._musicPlaying = true;
            this._beat = 0;
            this._scheduleMusicBeat();
        } catch(e) {}
    }

    /** Stop background music. */
    stopMusic() {
        this._musicPlaying = false;
        clearTimeout(this._musicTimer);
        this._musicNodes.forEach(n => { try { n.stop(); } catch(e){} });
        this._musicNodes = [];
    }

    // ── Toggle controls ───────────────────────────────────────────────────

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
                // Re-start music if it was playing before
                this.playMusic();
            }
        }
    }

    // ── Private ───────────────────────────────────────────────────────────

    /**
     * Schedule a single beat of the background melody.
     * Uses a simple pentatonic loop.
     * @private
     */
    _scheduleMusicBeat() {
        if (!this._musicPlaying || !this._musicEnabled) return;
        try {
            this._ensureCtx();
            const ac = this._ctx;

            // Simple pentatonic melody — repeating 16-note pattern
            const MELODY = [
                523, 659, 784, 659,  523, 440, 392, 440,
                523, 659, 784, 880,  784, 659, 523, 392
            ];
            const BPM    = 120;
            const beatMs = (60 / BPM / 2) * 1000; // eighth notes

            const freq = MELODY[this._beat % MELODY.length];
            const t    = ac.currentTime;

            const osc  = ac.createOscillator();
            const gain = ac.createGain();

            osc.type      = 'square';
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.0, t);
            gain.gain.linearRampToValueAtTime(1.0, t + 0.01);
            gain.gain.linearRampToValueAtTime(0.0, t + (beatMs / 1000) * 0.8);

            osc.connect(gain);
            gain.connect(this._musicGain);
            osc.start(t);
            osc.stop(t + beatMs / 1000);

            this._musicNodes.push(osc);
            // Clean up old stopped nodes
            if (this._musicNodes.length > 8) {
                this._musicNodes = this._musicNodes.slice(-8);
            }

            this._beat++;
            this._musicTimer = setTimeout(
                () => this._scheduleMusicBeat(),
                beatMs * 0.95  // slight overlap prevents gaps
            );
        } catch(e) { this._musicPlaying = false; }
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
        const osc  = ac.createOscillator();
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
    _chord(ac, t, freqs, duration) {
        freqs.forEach((freq, i) => {
            const delay = i * 0.08;
            this._tone(ac, t + delay, freq, duration,
                'sine', 0.18,
                [[0, 0.18], [duration * 0.8, 0.0]]
            );
        });
    }
}
