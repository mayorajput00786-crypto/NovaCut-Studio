/**
 * NovaCut Studio - CapCut Audio & Sound Effects Engine
 * Web Audio API synthesized sound effects + Multi-Language Speech Synthesis & Quiz Narrator
 * Works 100% offline with zero external audio assets required.
 */

export interface QuizNarrationOptions {
  question: string;
  optionA: string;
  optionB: string;
  correctAnswer: string;
  language?: 'en' | 'ur' | 'hi' | 'ar' | 'es' | 'fr' | 'de';
  rate?: number; // 0.8 to 1.5
  pitch?: number; // 0.8 to 1.2
  onStepChange?: (step: 'question' | 'options' | 'countdown' | 'answer' | 'idle') => void;
  onEnd?: () => void;
}

class SoundEngine {
  private ctx: AudioContext | null = null;
  private activeTimers: number[] = [];
  private isNarrating = false;

  private getAudioContext(): AudioContext {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // Quiz Countdown Tick
  playTick() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.05);

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch {}
  }

  // Quiz Correct Answer Chime / Ding (Two-Tone Bell)
  playCorrectDing() {
    try {
      const ctx = this.getAudioContext();
      const now = ctx.currentTime;

      // Note 1: E6
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(1318.51, now);
      gain1.gain.setValueAtTime(0.4, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.4);

      // Note 2: G#6 (chord)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1661.22, now + 0.08);
      gain2.gain.setValueAtTime(0.45, now + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.08);
      osc2.stop(now + 0.6);
    } catch {}
  }

  // CapCut Whoosh Transition Sound
  playWhoosh() {
    try {
      const ctx = this.getAudioContext();
      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // White noise buffer
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(300, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(1800, ctx.currentTime + 0.12);
      filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + 0.25);
      filter.Q.value = 3.0;

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.35, ctx.currentTime + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + 0.25);
    } catch {}
  }

  // CapCut Dramatic Bass Drop
  playBassDrop() {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(140, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(38, ctx.currentTime + 0.6);

      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.6);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.6);
    } catch {}
  }

  // Get matching browser TTS Voice
  private findVoiceForLanguage(langCode: string): SpeechSynthesisVoice | null {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    if (!voices || voices.length === 0) return null;

    const lower = langCode.toLowerCase();
    // 1. Exact match
    const exact = voices.find((v) => v.lang.toLowerCase() === lower);
    if (exact) return exact;

    // 2. Prefix match (e.g. 'ur' matches 'ur-PK' or 'ur-IN')
    const prefix = voices.find((v) => v.lang.toLowerCase().startsWith(lower));
    if (prefix) return prefix;

    // 3. Fallback to English
    return voices.find((v) => v.lang.toLowerCase().startsWith('en')) || voices[0] || null;
  }

  // Web Speech AI Narration for simple text
  speakText(
    text: string,
    options?: { language?: string; rate?: number; pitch?: number; onEnd?: () => void }
  ) {
    if (!('speechSynthesis' in window)) return;
    try {
      this.stopSpeech();
      const clean = text
        .replace(/\[[A-Z]\]/g, '')
        .replace(/✅|🩺|⚡|⏱️|❓/g, '')
        .trim();
      const utter = new SpeechSynthesisUtterance(clean);
      const lang = options?.language || 'en';
      const voice = this.findVoiceForLanguage(lang);
      if (voice) utter.voice = voice;
      utter.lang = lang;
      utter.rate = options?.rate || 1.05;
      utter.pitch = options?.pitch || 1.0;
      if (options?.onEnd) utter.onend = options.onEnd;
      window.speechSynthesis.speak(utter);
    } catch {}
  }

  // Full CapCut/TikTok Style Sequential Quiz Narrator
  narrateFullQuiz(options: QuizNarrationOptions) {
    if (!('speechSynthesis' in window)) return;
    this.stopSpeech();
    this.isNarrating = true;

    const lang = options.language || 'en';
    const rate = options.rate || 1.08;
    const pitch = options.pitch || 1.0;

    // Clean inputs
    const cleanQ = options.question.replace(/^Q:\s*|^سوال:\s*/i, '').replace(/🩺|⚡|❓/g, '').trim();
    const cleanA = options.optionA.replace(/^\[A\]\s*/i, '').trim();
    const cleanB = options.optionB.replace(/^\[B\]\s*/i, '').trim();
    const cleanAns = options.correctAnswer.replace(/^✅\s*|Correct:\s*/i, '').trim();

    // Language-specific speech prompts
    let qPrefix = 'Question:';
    let optAPrefix = 'Option A:';
    let optBPrefix = 'Option B:';
    let ansPrefix = 'The correct answer is:';

    if (lang === 'ur') {
      qPrefix = 'سوال:';
      optAPrefix = 'آپشن اے:';
      optBPrefix = 'آپشن بی:';
      ansPrefix = 'درست جواب ہے:';
    } else if (lang === 'hi') {
      qPrefix = 'प्रश्न:';
      optAPrefix = 'विकल्प ए:';
      optBPrefix = 'विकल्प बी:';
      ansPrefix = 'सही उत्तर है:';
    } else if (lang === 'ar') {
      qPrefix = 'سؤال:';
      optAPrefix = 'الخيار ألف:';
      optBPrefix = 'الخيار باء:';
      ansPrefix = 'الإجابة الصحيحة هي:';
    } else if (lang === 'es') {
      qPrefix = 'Pregunta:';
      optAPrefix = 'Opción A:';
      optBPrefix = 'Opción B:';
      ansPrefix = '¡La respuesta correcta es:';
    }

    const voice = this.findVoiceForLanguage(lang);

    // Sequence Step 1: Speak Question
    options.onStepChange?.('question');
    this.playWhoosh();

    const utterQ = new SpeechSynthesisUtterance(`${qPrefix} ${cleanQ}`);
    if (voice) utterQ.voice = voice;
    utterQ.rate = rate;
    utterQ.pitch = pitch;

    utterQ.onend = () => {
      if (!this.isNarrating) return;

      // Pause 250ms then speak Options
      const t1 = window.setTimeout(() => {
        if (!this.isNarrating) return;
        options.onStepChange?.('options');

        const utterOptions = new SpeechSynthesisUtterance(
          `${optAPrefix} ${cleanA}. ... ${optBPrefix} ${cleanB}.`
        );
        if (voice) utterOptions.voice = voice;
        utterOptions.rate = rate;
        utterOptions.pitch = pitch;

        utterOptions.onend = () => {
          if (!this.isNarrating) return;

          // Countdown phase (3 ticks)
          options.onStepChange?.('countdown');
          let ticksLeft = 3;

          const tickInterval = window.setInterval(() => {
            if (!this.isNarrating) {
              clearInterval(tickInterval);
              return;
            }
            this.playTick();
            ticksLeft--;

            if (ticksLeft <= 0) {
              clearInterval(tickInterval);

              // Answer Reveal: Play Ding bell chime
              this.playCorrectDing();
              options.onStepChange?.('answer');

              const t2 = window.setTimeout(() => {
                if (!this.isNarrating) return;

                const utterAns = new SpeechSynthesisUtterance(
                  `${ansPrefix} ${cleanAns}!`
                );
                if (voice) utterAns.voice = voice;
                utterAns.rate = rate * 0.95; // slightly deliberate for impact
                utterAns.pitch = pitch * 1.05;

                utterAns.onend = () => {
                  this.isNarrating = false;
                  options.onStepChange?.('idle');
                  options.onEnd?.();
                };

                window.speechSynthesis.speak(utterAns);
              }, 300);

              this.activeTimers.push(t2);
            }
          }, 800);
        };

        window.speechSynthesis.speak(utterOptions);
      }, 250);

      this.activeTimers.push(t1);
    };

    window.speechSynthesis.speak(utterQ);
  }

  stopSpeech() {
    this.isNarrating = false;
    this.activeTimers.forEach((t) => clearTimeout(t));
    this.activeTimers = [];
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  getIsNarrating(): boolean {
    return this.isNarrating;
  }
}

export const soundEngine = new SoundEngine();
