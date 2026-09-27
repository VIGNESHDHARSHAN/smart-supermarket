// Web Audio API Synthesizer for instant interactive sound feedback without external files

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.voices = [];
    this.activeUtterances = new Set();
    this.keepAliveTimer = null;
    this.initVoices();
  }

  initVoices() {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    
    const loadVoices = () => {
      try {
        const v = window.speechSynthesis.getVoices();
        if (v && v.length > 0) {
          this.voices = v;
        }
      } catch (e) {
        console.warn("Error getting voices:", e);
      }
    };

    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(900, this.ctx.currentTime);
      gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {
      console.warn("Click audio error:", e);
    }
  }

  playScanBeep() {
    try {
      this.init();
      if (!this.ctx) return;
      
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1800, this.ctx.currentTime);
      
      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.12);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start();
      osc.stop(this.ctx.currentTime + 0.12);
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  playSuccessChime() {
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const now = this.ctx.currentTime;

      notes.forEach((freq, index) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + index * 0.08);

        gain.gain.setValueAtTime(0.25, now + index * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.08 + 0.3);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + index * 0.08);
        osc.stop(now + index * 0.08 + 0.3);
      });
    } catch (e) {
      console.warn("Audio feedback error:", e);
    }
  }

  playCashRegister() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // High ding
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(2000, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Ch-ching rattle sound
      setTimeout(() => {
        if (!this.ctx) return;
        const now2 = this.ctx.currentTime;
        const osc2 = this.ctx.createOscillator();
        const gain2 = this.ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(2600, now2);
        gain2.gain.setValueAtTime(0.2, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.25);
        osc2.connect(gain2);
        gain2.connect(this.ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.25);
      }, 70);
    } catch (e) {
      console.warn("Cash register audio error:", e);
    }
  }

  playGateUnlock() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const notes = [659.25, 880, 1318.51]; // E5, A5, E6 (Security Access Granted chord)
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.09);
        gain.gain.setValueAtTime(0.22, now + idx * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.09 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.09);
        osc.stop(now + idx * 0.09 + 0.35);
      });
    } catch (e) {
      console.warn("Gate audio error:", e);
    }
  }

  playErrorBuzzer() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {
      console.warn("Error audio error:", e);
    }
  }

  playBagPacked() {
    try {
      this.init();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(1600, now + 0.08);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } catch (e) {
      console.warn("Bag audio error:", e);
    }
  }

  playCouponApplause() {
    try {
      this.init();
      if (!this.ctx) return;

      const notes = [440, 554.37, 659.25, 880]; // A4, C#5, E5, A5
      const now = this.ctx.currentTime;
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.06);
        gain.gain.setValueAtTime(0.2, now + idx * 0.06);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.06 + 0.4);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.06);
        osc.stop(now + idx * 0.06 + 0.4);
      });
    } catch (e) {
      console.warn("Coupon audio error:", e);
    }
  }

  playNotificationPing() {
    try {
      this.init();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5
      osc.frequency.exponentialRampToValueAtTime(1320, this.ctx.currentTime + 0.15); // E6

      gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + 0.25);
    } catch (e) {
      console.warn("Ping audio error:", e);
    }
  }

  cleanTextForSpeech(text) {
    if (!text) return '';
    return text
      // Replace markdown links with link text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      // Replace rupee symbol with "rupees " so voices pronounce prices naturally
      .replace(/₹\s*(\d+(\.\d+)?)/g, '$1 rupees')
      .replace(/₹/g, ' rupees ')
      // Strip markdown formatting symbols
      .replace(/[*_~`#]/g, ' ')
      // Strip bullet points
      .replace(/^[•\-\*]\s+/gm, '')
      // Remove emojis that may distort speech synthesis
      .replace(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F1E0}-\u{1F1FF}]/gu, '')
      // Condense multiple whitespaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  findBestVoice(lang = 'en-US') {
    let voices = this.voices;
    if (!voices || voices.length === 0) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        voices = window.speechSynthesis.getVoices() || [];
        this.voices = voices;
      }
    }
    if (!voices || voices.length === 0) return null;

    const normalizedLang = (lang || 'en-US').toLowerCase();
    const langPrefix = normalizedLang.split('-')[0];

    // 1. Exact match (e.g., 'en-US', 'hi-IN', 'ta-IN', 'es-ES')
    const exactMatches = voices.filter(v => v.lang && v.lang.toLowerCase() === normalizedLang);
    // 2. Prefix match (e.g., 'en', 'hi', 'ta', 'es')
    const prefixMatches = voices.filter(v => v.lang && v.lang.toLowerCase().startsWith(langPrefix));

    const candidates = exactMatches.length > 0 ? exactMatches : prefixMatches;

    if (candidates.length > 0) {
      // Prefer natural, Google, Neural or expressive male/female voices
      const preferred = candidates.find(v => {
        const name = (v.name || '').toLowerCase();
        return (
          name.includes('natural') ||
          name.includes('google') ||
          name.includes('neural') ||
          name.includes('online') ||
          name.includes('premium') ||
          name.includes('david') ||
          name.includes('george') ||
          name.includes('guy') ||
          name.includes('samantha')
        );
      });
      return preferred || candidates[0];
    }

    // 3. Fallback: Default voice or English voice to prevent "language-unavailable" crash
    const defaultVoice = voices.find(v => v.default) ||
                         voices.find(v => v.lang && v.lang.toLowerCase().startsWith('en')) ||
                         voices[0];
    return defaultVoice || null;
  }

  speakText(text, lang = 'en-US', callbacks = {}) {
    try {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        callbacks.onEnd?.();
        return;
      }

      this.stopSpeaking();

      const cleanText = this.cleanTextForSpeech(text);
      if (!cleanText) {
        callbacks.onEnd?.();
        return;
      }

      // Small async delay ensures previous cancel() is fully processed by Chromium
      setTimeout(() => {
        try {
          if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

          // Resume if synthesis engine was left in paused state
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }

          const utterance = new SpeechSynthesisUtterance(cleanText);
          const bestVoice = this.findBestVoice(lang);

          if (bestVoice) {
            utterance.voice = bestVoice;
            utterance.lang = bestVoice.lang || lang;
          } else {
            utterance.lang = lang;
          }

          utterance.rate = callbacks.rate !== undefined ? callbacks.rate : 1.0;
          utterance.pitch = callbacks.pitch !== undefined ? callbacks.pitch : 1.0;

          // Retain reference to avoid Chromium V8 Garbage Collection cutting off speech mid-sentence
          this.activeUtterances.add(utterance);
          window._activeSpeechUtterance = utterance;

          const cleanup = () => {
            this.activeUtterances.delete(utterance);
            if (this.keepAliveTimer) {
              clearInterval(this.keepAliveTimer);
              this.keepAliveTimer = null;
            }
          };

          utterance.onstart = (e) => {
            // Keep-alive heartbeat interval to bypass Chrome 15-second pause bug
            if (this.keepAliveTimer) clearInterval(this.keepAliveTimer);
            this.keepAliveTimer = setInterval(() => {
              if (window.speechSynthesis.speaking) {
                window.speechSynthesis.pause();
                window.speechSynthesis.resume();
              } else {
                clearInterval(this.keepAliveTimer);
                this.keepAliveTimer = null;
              }
            }, 10000);

            callbacks.onStart?.(e);
          };

          utterance.onboundary = (e) => {
            callbacks.onBoundary?.(e);
          };

          utterance.onend = (e) => {
            cleanup();
            callbacks.onEnd?.(e);
          };

          utterance.onerror = (e) => {
            console.warn("Speech synthesis utterance error:", e);
            cleanup();
            callbacks.onError?.(e);
          };

          this.currentUtterance = utterance;
          window.speechSynthesis.speak(utterance);

          // Workaround: In some Chromium versions, speak() leaves engine paused until explicitly resumed
          if (window.speechSynthesis.paused) {
            window.speechSynthesis.resume();
          }
        } catch (err) {
          console.warn("Speech speak error:", err);
          callbacks.onEnd?.();
        }
      }, 50);
    } catch (e) {
      console.warn("Speech synthesis outer error:", e);
      callbacks.onEnd?.();
    }
  }

  isSpeaking() {
    return typeof window !== 'undefined' && 'speechSynthesis' in window && window.speechSynthesis.speaking;
  }

  stopSpeaking() {
    try {
      if (this.keepAliveTimer) {
        clearInterval(this.keepAliveTimer);
        this.keepAliveTimer = null;
      }
      this.activeUtterances.clear();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        if (window.speechSynthesis.paused) {
          window.speechSynthesis.resume();
        }
      }
    } catch (e) {
      console.warn("Speech cancel error:", e);
    }
  }
}

export const soundEffects = new SoundEngine();

