export class SoundManager {
    constructor() {
        this.audioContext = null;
        this.sounds = {};
        this.initAudioContext();
    }

    initAudioContext() {
        // Create audio context on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }
        }, { once: true });
    }

    createBeep(frequency, duration, type = 'sine') {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }

        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();

        oscillator.type = type;
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        
        gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);

        return { oscillator, gainNode };
    }

    playCorrectSound() {
        if (!this.audioContext) return;
        
        // Happy ascending beeps
        const { oscillator, gainNode } = this.createBeep(440, 0.1); // A4 note
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);

        setTimeout(() => {
            const { oscillator: osc2 } = this.createBeep(523.25, 0.1); // C5 note
            osc2.start();
            osc2.stop(this.audioContext.currentTime + 0.1);
        }, 100);
    }

    playIncorrectSound() {
        if (!this.audioContext) return;
        
        // Sad descending beeps
        const { oscillator, gainNode } = this.createBeep(440, 0.1, 'sawtooth');
        oscillator.start();
        oscillator.stop(this.audioContext.currentTime + 0.1);

        setTimeout(() => {
            const { oscillator: osc2 } = this.createBeep(349.23, 0.1, 'sawtooth'); // F4 note
            osc2.start();
            osc2.stop(this.audioContext.currentTime + 0.1);
        }, 100);
    }

    playCelebrationSound() {
        if (!this.audioContext) return;
        
        // Play an arpeggio
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, index) => {
            setTimeout(() => {
                const { oscillator } = this.createBeep(freq, 0.15);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.15);
            }, index * 100);
        });
    }

    stopAll() {
        if (this.audioContext) {
            this.audioContext.close().then(() => {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            });
        }
    }
} 