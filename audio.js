class SoundEngine {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    playTone(type, f1, f2, dur, vol = 0.2) {
        this.init();
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(f1, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(f2, this.ctx.currentTime + dur);
        gain.gain.setValueAtTime(vol, this.ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + dur);
        osc.connect(gain); gain.connect(this.ctx.destination);
        osc.start(); osc.stop(this.ctx.currentTime + dur);
    }

    playPick() { this.playTone('sine', 440, 880, 0.08, 0.12); }
    playDash() { this.playTone('sawtooth', 380, 80, 0.15, 0.2); }
    playHit(isCrit = false) { this.playTone(isCrit ? 'sawtooth' : 'square', isCrit ? 140 : 200, 35, isCrit ? 0.22 : 0.1, isCrit ? 0.3 : 0.15); }
    playHammer() { this.playTone('sawtooth', 100, 20, 0.3, 0.35); }
    playSpear() { this.playTone('triangle', 420, 120, 0.12, 0.25); }
    playMagic() { this.playTone('sine', 600, 1200, 0.18, 0.22); }
    playZap() { this.playTone('sawtooth', 800, 150, 0.12, 0.2); }
    playStomp() { this.playTone('square', 110, 25, 0.28, 0.35); }
    playExplosion() { this.playTone('sawtooth', 120, 25, 0.4, 0.35); }
    playBounce() { this.playTone('sine', 240, 700, 0.2, 0.25); }
    playDeath() { this.playTone('sawtooth', 280, 30, 0.8, 0.3); }
    playCoinToss() { this.playTone('sine', 1400, 2200, 0.08, 0.18); }
    playCoinRicochet() { this.playTone('sine', 2400, 3800, 0.22, 0.35); }
    playClink() { this.playTone('sine', 1600, 800, 0.08, 0.2); }

    playBuild() {
        this.init();
        if (!this.ctx) return;
        [400, 600, 800].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.04);
            gain.gain.setValueAtTime(0.12, this.ctx.currentTime + idx * 0.04);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.04 + 0.05);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.04);
            osc.stop(this.ctx.currentTime + idx * 0.04 + 0.05);
        });
    }

    playLevelUp() {
        this.init();
        if (!this.ctx) return;
        [261.63, 329.63, 392.00, 523.25, 659.25].forEach((freq, idx) => {
            const osc = this.ctx.createOscillator(), gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime + idx * 0.06);
            gain.gain.setValueAtTime(0.15, this.ctx.currentTime + idx * 0.06);
            gain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + idx * 0.06 + 0.15);
            osc.connect(gain); gain.connect(this.ctx.destination);
            osc.start(this.ctx.currentTime + idx * 0.06);
            osc.stop(this.ctx.currentTime + idx * 0.06 + 0.15);
        });
    }
}

const sounds = new SoundEngine();