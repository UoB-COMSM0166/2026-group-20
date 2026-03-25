/**
 * Centralised audio manager.
 * Loads and plays all game sounds via the p5.sound library.
 *
 * Usage:
 *   const audio = new AudioManager(p);
 *   audio.play('jump');
 *
 * TODO: load actual audio files from src/assets/audio/
 */
export class AudioManager {
    constructor(p) {
        this.p = p;
        this.sounds = {};
        this.muted = false;
    }

    /**
     * Preload all audio assets. Call inside p5's preload().
     */
    preload() {
        // TODO: uncomment when audio files are added
        // this.sounds.jump   = this.p.loadSound('assets/audio/jump.mp3');
        // this.sounds.coin   = this.p.loadSound('assets/audio/coin.mp3');
        // this.sounds.death  = this.p.loadSound('assets/audio/death.mp3');
        // this.sounds.bgm    = this.p.loadSound('assets/audio/bgm.mp3');
    }

    /**
     * Play a sound by name.
     * @param {string} name - Key matching a loaded sound
     */
    play(name) {
        if (this.muted) return;
        if (this.sounds[name]) this.sounds[name].play();
    }

    /**
     * Start looping background music.
     */
    playBGM() {
        if (this.muted) return;
        if (this.sounds.bgm && !this.sounds.bgm.isPlaying()) {
            this.sounds.bgm.loop();
        }
    }

    stopBGM() {
        if (this.sounds.bgm) this.sounds.bgm.stop();
    }

    toggleMute() {
        this.muted = !this.muted;
        if (this.muted) this.stopBGM();
    }
}
