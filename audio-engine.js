/* ==========================================================================
   SPRUNKI STUDIO — Web Audio API Multi-Track Synthesizer & Beat Clock
   4-Bar (64-step) Quantized Loop Engine
   Normal Mode: Am - F - C - G (120 BPM)
   Horror Mode: Am - Bb - Ebdim - E7b9 (100 BPM)
   ========================================================================== */

(function (global) {
  'use strict';

  // Helper: MIDI note number -> Frequency (Hz)
  function mtof(midi) {
    return 440 * Math.pow(2, (midi - 69) / 12);
  }

  // Note constants
  const N = {
    E2: 40, F2: 41, Fs2: 42, G2: 43, Gs2: 44, A2: 45, Bb2: 46, B2: 47,
    C3: 48, Cs3: 49, D3: 50, Eb3: 51, E3: 52, F3: 53, Fs3: 54, G3: 55, Gs3: 56, A3: 57, Bb3: 58, B3: 59,
    C4: 60, Cs4: 61, D4: 62, Eb4: 63, E4: 64, F4: 65, Fs4: 66, G4: 67, Gs4: 68, A4: 69, Bb4: 70, B4: 71,
    C5: 72, Cs5: 73, D5: 74, Eb5: 75, E5: 76, F5: 77, Fs5: 78, G5: 79, Gs5: 80, A5: 81, Bb5: 82, B5: 83,
    C6: 84, E6: 88,
  };

  // Vowel Formants [F1, F2] for realistic synth vocals/choirs
  const VOWELS = {
    a: [730, 1090],
    e: [530, 1840],
    i: [270, 2290],
    o: [570, 840],
    u: [300, 870],
  };

  class SprunkiAudioEngine {
    constructor() {
      this.ctx = null;
      this.masterGain = null;
      this.compressor = null;
      this.analyser = null;
      this.delayNode = null;
      this.delayFeedback = null;
      this.delayWet = null;
      this.noiseBuffer = null;
      this.mediaDest = null;

      this.isPlaying = true;
      this.theme = 'normal'; // 'normal' | 'horror' | 'underwater'
      this.isHorror = false;
      this.bpm = 120;
      this.currentStep = 0; // 0..63
      this.nextNoteTime = 0;
      this.timerId = null;
      this.masterVolume = 0.8;

      // 7 Stage slots: { charId, muted, solo }
      this.slots = Array.from({ length: 7 }, () => ({
        charId: null,
        muted: false,
        solo: false,
      }));

      this.onStepCallback = null;
      this.isRecording = false;
      this.mediaRecorder = null;
      this.recordedChunks = [];
    }

    init() {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        return;
      }

      const AudioCtx = global.AudioContext || global.webkitAudioContext;
      this.ctx = new AudioCtx();

      // Master chain: Mix -> Compressor -> MasterGain -> Analyser -> Destination
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.value = -14;
      this.compressor.knee.value = 18;
      this.compressor.ratio.value = 6;
      this.compressor.attack.value = 0.004;
      this.compressor.release.value = 0.16;

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.masterVolume;

      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 128;
      this.analyser.smoothingTimeConstant = 0.78;

      // Subtle global space delay send
      this.delayNode = this.ctx.createDelay(1.0);
      this.delayNode.delayTime.value = 0.25;
      this.delayFeedback = this.ctx.createGain();
      this.delayFeedback.gain.value = 0.28;
      this.delayWet = this.ctx.createGain();
      this.delayWet.gain.value = 0.22;

      this.delayNode.connect(this.delayFeedback);
      this.delayFeedback.connect(this.delayNode);
      this.delayNode.connect(this.delayWet);
      this.delayWet.connect(this.compressor);

      this.compressor.connect(this.masterGain);
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Recording destination
      if (this.ctx.createMediaStreamDestination) {
        this.mediaDest = this.ctx.createMediaStreamDestination();
        this.masterGain.connect(this.mediaDest);
      }

      // Generate reusable white noise buffer
      const bufferSize = this.ctx.sampleRate * 2;
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }

      this.nextNoteTime = this.ctx.currentTime + 0.06;
      this.startScheduler();
    }

    startScheduler() {
      if (this.timerId) return;
      const lookaheadMs = 25;
      const scheduleAheadSec = 0.11;

      this.timerId = setInterval(() => {
        if (!this.ctx || !this.isPlaying) return;
        while (this.nextNoteTime < this.ctx.currentTime + scheduleAheadSec) {
          this.scheduleStep(this.currentStep, this.nextNoteTime);
          this.advanceStep();
        }
      }, lookaheadMs);
    }

    advanceStep() {
      const secPerBeat = 60.0 / this.bpm;
      const secPer16th = secPerBeat * 0.25;
      this.nextNoteTime += secPer16th;
      this.currentStep = (this.currentStep + 1) % 64;
    }

    setPlaying(playing) {
      this.init();
      this.isPlaying = playing;
      if (playing && this.ctx) {
        this.nextNoteTime = this.ctx.currentTime + 0.05;
      }
    }

    setVolume(val) {
      this.masterVolume = val;
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.setTargetAtTime(val, this.ctx.currentTime, 0.02);
      }
    }

    setTheme(theme) {
      this.theme = theme || 'normal';
      this.isHorror = this.theme === 'horror';
      if (this.theme === 'horror') {
        this.bpm = 100;
      } else if (this.theme === 'underwater') {
        this.bpm = 128;
      } else if (this.theme === 'phonk') {
        this.bpm = 136;
      } else {
        this.bpm = 120;
      }
      if (this.delayNode && this.ctx) {
        const delayTime =
          this.theme === 'horror'
            ? 0.42
            : this.theme === 'underwater'
            ? 0.351
            : this.theme === 'phonk'
            ? 0.22
            : 0.25;
        const feedback =
          this.theme === 'horror'
            ? 0.48
            : this.theme === 'underwater'
            ? 0.38
            : this.theme === 'phonk'
            ? 0.24
            : 0.25;
        const wet = this.theme === 'underwater' ? 0.32 : this.theme === 'phonk' ? 0.18 : 0.22;
        this.delayNode.delayTime.setTargetAtTime(delayTime, this.ctx.currentTime, 0.08);
        this.delayFeedback.gain.setTargetAtTime(feedback, this.ctx.currentTime, 0.08);
        this.delayWet.gain.setTargetAtTime(wet, this.ctx.currentTime, 0.08);
      }
    }

    setHorrorMode(horror) {
      this.setTheme(horror ? 'horror' : 'normal');
    }

    setSlots(slotsState) {
      this.slots = slotsState;
    }

    playEquipStinger(charId, triggerMode) {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;

      if (triggerMode === true || triggerMode === 'horror') {
        // Dramatic phase-2 horror drop sting
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(160, t);
        osc.frequency.exponentialRampToValueAtTime(34, t + 0.9);
        g.gain.setValueAtTime(0.35, t);
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.95);
        osc.connect(g);
        g.connect(this.compressor);
        osc.start(t);
        osc.stop(t + 0.96);

        // Static burst
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.frequency.setValueAtTime(1400, t);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.26, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.55);
        src.connect(bp);
        bp.connect(ng);
        ng.connect(this.compressor);
        src.start(t);
        src.stop(t + 0.56);
        return;
      }

      if (triggerMode === 'underwater') {
        // Submarine sonar ping + liquid resonant splash drop!
        this.synthSonarPing(t, 1318.5, 0.85, 0.34);
        this.synthAcid303(t + 0.08, 110, 0.55, 0.32, true);
        // Bubbling water whoosh
        const src = this.ctx.createBufferSource();
        src.buffer = this.noiseBuffer;
        const bp = this.ctx.createBiquadFilter();
        bp.type = 'bandpass';
        bp.Q.value = 5.5;
        bp.frequency.setValueAtTime(2400, t);
        bp.frequency.exponentialRampToValueAtTime(220, t + 0.6);
        const ng = this.ctx.createGain();
        ng.gain.setValueAtTime(0.26, t);
        ng.gain.exponentialRampToValueAtTime(0.001, t + 0.62);
        src.connect(bp);
        bp.connect(ng);
        ng.connect(this.compressor);
        src.start(t);
        src.stop(t + 0.64);
        return;
      }

      if (triggerMode === 'phonk') {
        // Iconic 3-note Drift Phonk 808 cowbell riff + clipped 808 bass drop!
        this.synthPhonkCowbell(t, mtof(N.A5), 0.16, 0.34);
        this.synthPhonkCowbell(t + 0.11, mtof(N.C6), 0.16, 0.34);
        this.synthPhonkCowbell(t + 0.22, mtof(N.E6), 0.28, 0.38);
        this.synthPhonk808(t + 0.22, mtof(N.A2 - 12), 0.7, 0.52, mtof(N.E2 - 12));
        return;
      }

      // Cheerful pop chime
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(660, t + 0.08);
      g.gain.setValueAtTime(0.16, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
      osc.connect(g);
      g.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 0.15);
    }

    /* ----------------------------------------------------------------------
       Main Per-Step Scheduler
       ---------------------------------------------------------------------- */
    scheduleStep(step, time) {
      const anySolo = this.slots.some((s) => s.charId && s.solo);
      const activeVisualTriggers = [];

      for (let i = 0; i < this.slots.length; i++) {
        const slot = this.slots[i];
        if (!slot.charId) continue;
        if (slot.muted) continue;
        if (anySolo && !slot.solo) continue;

        const triggered = this.triggerCharacterSound(slot.charId, step, time, this.theme);
        if (triggered) {
          activeVisualTriggers.push({ slotIndex: i, charId: slot.charId, type: triggered });
        }
      }

      // Schedule UI sync near exact playback time
      const delayMs = Math.max(0, (time - this.ctx.currentTime) * 1000);
      if (this.onStepCallback) {
        setTimeout(() => {
          if (this.isPlaying) {
            this.onStepCallback(step, activeVisualTriggers);
          }
        }, delayMs);
      }
    }

    /* ----------------------------------------------------------------------
       24 Character Musical Patterns (Normal, Horror & Underwater Techno)
       Returns animation cue string ('hit' | 'sing' | 'sway') or null
       ---------------------------------------------------------------------- */
    triggerCharacterSound(id, step, t, themeOrBool) {
      const bar = Math.floor(step / 16); // 0..3
      const s = step % 16;               // 0..15

      if (themeOrBool === 'underwater') {
        return this.triggerUnderwaterSound(id, step, t, bar, s);
      }
      if (themeOrBool === 'phonk') {
        return this.triggerPhonkSound(id, step, t, bar, s);
      }

      const horror = themeOrBool === true || themeOrBool === 'horror';

      // Chord roots for current bar
      const normalRoots = [N.A2, N.F2, N.C3, N.G2];
      const horrorRoots = [N.A2, N.Bb2, N.Eb3, N.E2];
      const root = horror ? horrorRoots[bar] : normalRoots[bar];

      switch (id) {
        /* ==================== BEATS ==================== */
        case 'oren': {
          // Punchy house/pop kick + subtle offbeat tick
          if (!horror) {
            if (s === 0 || s === 4 || s === 8 || s === 12 || (bar === 3 && s === 14)) {
              this.synthKick(t, 145, 44, 0.24, 0.85, false);
              return 'hit';
            }
          } else {
            // Heavy distorted heartbeat kick
            if (s === 0 || s === 3 || s === 8 || s === 11) {
              this.synthKick(t, 110, 32, 0.34, 0.9, true);
              return 'hit';
            }
          }
          return null;
        }

        case 'raddy': {
          // Snappy snare & claps on 2 and 4 (+ syncopated ghost)
          if (!horror) {
            if (s === 4 || s === 12) {
              this.synthSnare(t, 0.55, false);
              return 'hit';
            }
            if (s === 15 && (bar === 1 || bar === 3)) {
              this.synthSnare(t, 0.28, false);
              return 'hit';
            }
          } else {
            // Industrial metallic slam
            if (s === 4 || s === 12 || (bar === 3 && s === 14)) {
              this.synthSnare(t, 0.65, true);
              return 'hit';
            }
          }
          return null;
        }

        case 'clukr': {
          // Crisp hi-hats & cymbal splash
          if (!horror) {
            if (s === 2 || s === 6 || s === 10 || s === 14) {
              this.synthHiHat(t, 0.14, 0.28, 8500);
              return 'hit';
            }
            if (s % 2 === 0) {
              this.synthHiHat(t, 0.045, 0.14, 10500);
            }
            if (bar === 0 && s === 0) {
              this.synthCymbal(t, 0.55, 0.22);
              return 'hit';
            }
          } else {
            // Clanging metallic scrape hits
            if (s === 2 || s === 6 || s === 10 || s === 13) {
              this.synthCymbal(t, 0.24, 0.22, true);
              return 'hit';
            }
          }
          return null;
        }

        case 'funbot': {
          // Energetic electro breakbeat (kick/snare/hat combo)
          if (!horror) {
            if (s === 0 || s === 10) {
              this.synthKick(t, 170, 52, 0.18, 0.52, false);
              return 'hit';
            }
            if (s === 4 || s === 12) {
              this.synthSnare(t, 0.36, false);
              return 'hit';
            }
            if (s === 2 || s === 7 || s === 14) {
              this.synthHiHat(t, 0.05, 0.16, 9500);
            }
          } else {
            // Glitchy broken-machine percussion
            if (s === 0 || s === 5 || s === 9 || s === 14) {
              this.synthZap(t, s % 2 === 0 ? 180 : 95, 42, 0.12, 0.26);
              return 'hit';
            }
          }
          return null;
        }

        case 'vineria': {
          // Organic shakers & maraca groove
          if (!horror) {
            const accent = s % 4 === 2 ? 0.22 : s % 2 === 0 ? 0.12 : 0.07;
            this.synthShaker(t, accent, 5800 + (s % 4) * 500);
            if (s % 4 === 2) return 'sway';
          } else {
            // Creepy rustling whispers/rattles
            if (s % 4 === 0 || s === 14) {
              this.synthShaker(t, 0.22, 2400);
              return 'sway';
            }
          }
          return null;
        }

        /* ==================== EFFECTS & BASS ==================== */
        case 'gray': {
          // Deep pulsing sub bassline
          if (!horror) {
            if (s === 0 || s === 3 || s === 6 || s === 8 || s === 12 || s === 14) {
              const oct = s === 6 || s === 14 ? 12 : 0;
              this.synthSubBass(t, mtof(root + oct), 0.24, 0.44, false);
              return 'hit';
            }
          } else {
            // Menacing rumbling reese drone
            if (s === 0 || s === 8) {
              this.synthSubBass(t, mtof(root - 12), 0.85, 0.48, true);
              return 'hit';
            }
          }
          return null;
        }

        case 'brud': {
          // Goofy wooden bucket / cowbell syncopation
          if (!horror) {
            const pattern = [0, 3, 6, 10, 12];
            if (pattern.includes(s)) {
              const pitch = s === 3 || s === 10 ? 520 : 380;
              this.synthBucket(t, pitch, 0.14, 0.26);
              return 'hit';
            }
          } else {
            if (s === 0 || s === 7 || s === 11) {
              this.synthBucket(t, s === 7 ? 210 : 165, 0.22, 0.3);
              return 'hit';
            }
          }
          return null;
        }

        case 'garnold': {
          // Funky filtered sawtooth bass/synth riff
          if (!horror) {
            const riff = { 0: 0, 2: 0, 4: 7, 6: 12, 8: 0, 10: 7, 12: 10, 14: 12 };
            if (riff[s] !== undefined) {
              this.synthFunkBass(t, mtof(root + 12 + riff[s]), 0.17, 0.24, false);
              return 'sway';
            }
          } else {
            if (s === 0 || s === 6 || s === 12) {
              this.synthFunkBass(t, mtof(root + (s === 6 ? 6 : 0)), 0.35, 0.28, true);
              return 'sway';
            }
          }
          return null;
        }

        case 'owakcx': {
          // Wild glitchy acid zap / laser fx
          if (!horror) {
            if (s === 2 || s === 7 || s === 11 || s === 15) {
              const fStart = 550 + ((step * 173) % 900);
              this.synthZap(t, fStart, 130, 0.11, 0.18);
              return 'hit';
            }
          } else {
            if (s === 1 || s === 6 || s === 9 || s === 15) {
              const fStart = 1200 + ((step * 311) % 1400);
              this.synthZap(t, fStart, 70, 0.18, 0.24);
              return 'hit';
            }
          }
          return null;
        }

        case 'sky': {
          // Sweet sparkling celesta / music box arpeggio
          if (!horror) {
            const chords = [
              [N.A5, N.E5, N.C5, N.E5],
              [N.A5, N.F5, N.C5, N.F5],
              [N.G5, N.E5, N.C5, N.E5],
              [N.G5, N.D5, N.B4, N.D5],
            ];
            if (s % 2 === 0) {
              const note = chords[bar][(s / 2) % 4];
              this.synthMusicBox(t, mtof(note), 0.38, 0.18, false);
              if (s % 4 === 0) return 'sway';
            }
          } else {
            // Classic creepy detuned horror music box
            const creepy = [
              [N.A5, null, N.C6, null, N.Eb5, null, N.A5, null],
              [N.Bb5, null, N.F5, null, N.E5, null, N.D5, null],
              [N.Eb5, null, N.C5, null, N.A5, null, N.Eb5, null],
              [N.E5, null, N.Gs5, null, N.F5, null, N.E5, null],
            ];
            if (s % 2 === 0) {
              const note = creepy[bar][s / 2];
              if (note) {
                this.synthMusicBox(t, mtof(note), 0.72, 0.22, true);
                return 'sway';
              }
            }
          }
          return null;
        }

        /* ==================== MELODIES ==================== */
        case 'mrsun': {
          // Bright sunny marimba/piano chords
          if (!horror) {
            const chords = [
              [N.A3, N.C4, N.E4, N.A4],
              [N.F3, N.A3, N.C4, N.F4],
              [N.C4, N.E4, N.G4, N.C5],
              [N.G3, N.B3, N.D4, N.G4],
            ];
            if (s === 0 || s === 6 || s === 12) {
              this.synthChordStab(t, chords[bar], 0.34, 0.22, 'triangle', false);
              return 'sway';
            }
          } else {
            // Eerie dissonant sustained bell-clusters
            const chords = [
              [N.A3, N.C4, N.Eb4],
              [N.Bb3, N.D4, N.E4],
              [N.A3, N.Eb4, N.Fs4],
              [N.E3, N.Gs3, N.F4],
            ];
            if (s === 0 || s === 8) {
              this.synthChordStab(t, chords[bar], 0.9, 0.22, 'sawtooth', true);
              return 'sway';
            }
          }
          return null;
        }

        case 'durple': {
          // Warm brassy horn stabs
          if (!horror) {
            const notes = [N.A3, N.F3, N.C4, N.G3];
            if (s === 0 || s === 10) {
              this.synthBrass(t, mtof(notes[bar]), s === 0 ? 0.5 : 0.28, 0.24, false);
              return 'sing';
            }
          } else {
            // Low foghorn dread blast
            const notes = [N.A2, N.Bb2, N.Eb2 || 39, N.E2];
            if (s === 0) {
              this.synthBrass(t, mtof(notes[bar]), 1.3, 0.32, true);
              return 'sing';
            }
          }
          return null;
        }

        case 'mrtree': {
          // Cheerful retro organ / accordion bounce
          if (!horror) {
            const chords = [
              [N.A4, N.C5, N.E5],
              [N.F4, N.A4, N.C5],
              [N.C4, N.E4, N.G4],
              [N.G4, N.B4, N.D5],
            ];
            if (s === 2 || s === 6 || s === 10 || s === 14) {
              this.synthOrgan(t, chords[bar], 0.22, 0.16, false);
              return 'sway';
            }
          } else {
            // Haunted pipe organ drone
            const chords = [
              [N.A3, N.E4, N.A4],
              [N.Bb3, N.F4, N.Bb4],
              [N.Eb3, N.A3, N.C4],
              [N.E3, N.Gs3, N.D4],
            ];
            if (s === 0) {
              this.synthOrgan(t, chords[bar], 1.6, 0.2, true);
              return 'sway';
            }
          }
          return null;
        }

        case 'simon': {
          // Catchy energetic 8-bit chiptune arp lead
          if (!horror) {
            const melody = [
              [N.E5, null, N.C5, N.E5, N.A5, null, N.G5, N.E5, N.C5, null, N.D5, N.E5, N.C5, null, N.A4, null],
              [N.F5, null, N.C5, N.F5, N.A5, null, N.G5, N.F5, N.C5, null, N.A4, N.C5, N.F5, null, N.E5, null],
              [N.G5, null, N.E5, N.G5, N.C6, null, N.B5, N.G5, N.E5, null, N.G5, N.E5, N.D5, null, N.C5, null],
              [N.D5, null, N.G5, N.B5, N.G5, null, N.D5, N.B4, N.G4, null, N.B4, N.D5, N.G5, null, N.E5, null],
            ];
            const note = melody[bar][s];
            if (note) {
              this.synthChiptune(t, mtof(note), 0.14, 0.16, false);
              return 'sing';
            }
          } else {
            // Frantic screeching horror square arps
            const melody = [
              [N.A5, N.Bb5, null, N.A5, N.Eb5, null, N.E5, null, N.A5, null, N.C6, N.Bb5, N.A5, null, N.Eb5, null],
              [N.Bb5, null, N.F5, N.E5, N.Bb5, null, N.D5, null, N.F5, N.E5, null, N.D5, N.Bb4, null, null, null],
              [N.Eb5, N.E5, null, N.Eb5, N.A4, null, N.C5, null, N.Eb5, null, N.Fs5, N.Eb5, N.C5, null, null, null],
              [N.E5, N.F5, N.Gs5, null, N.B5, null, N.F5, N.E5, N.Gs4, null, N.B4, N.F5, N.E5, null, null, null],
            ];
            const note = melody[bar][s];
            if (note) {
              this.synthChiptune(t, mtof(note), 0.16, 0.16, true);
              return 'sing';
            }
          }
          return null;
        }

        case 'tunner': {
          // Iconic melodic western whistle synth (with smooth portamento vibrato!)
          if (!horror) {
            const whistle = [
              { 0: N.E5, 3: N.G5, 6: N.A5, 10: N.G5, 12: N.E5 },
              { 0: N.F5, 4: N.A5, 8: N.G5, 12: N.F5 },
              { 0: N.E5, 3: N.G5, 6: N.C6, 10: N.G5, 12: N.E5 },
              { 0: N.D5, 4: N.G5, 8: N.B5, 12: N.G5 },
            ];
            const note = whistle[bar][s];
            if (note) {
              this.synthWhistle(t, mtof(note), 0.36, 0.2, false);
              return 'sing';
            }
          } else {
            // Lonely haunted detuned whistle
            const whistle = [
              { 0: N.E5, 8: N.Eb5 },
              { 0: N.F5, 10: N.D5 },
              { 0: N.Eb5, 8: N.C5 },
              { 0: N.E5, 8: N.Gs5 },
            ];
            const note = whistle[bar][s];
            if (note) {
              this.synthWhistle(t, mtof(note), 0.85, 0.2, true);
              return 'sing';
            }
          }
          return null;
        }

        /* ==================== VOCALS & SPECIAL ==================== */
        case 'funcomputer': {
          // Cute vocaloid/robotic melodic beep-singing
          if (!horror) {
            const notes = [
              { 0: [N.A4, 'e'], 4: [N.C5, 'a'], 8: [N.E5, 'i'], 12: [N.C5, 'o'] },
              { 0: [N.F4, 'a'], 4: [N.A4, 'e'], 8: [N.C5, 'i'], 12: [N.A4, 'o'] },
              { 0: [N.G4, 'e'], 4: [N.C5, 'a'], 8: [N.E5, 'i'], 12: [N.G5, 'o'] },
              { 0: [N.G4, 'o'], 4: [N.B4, 'e'], 8: [N.D5, 'a'], 12: [N.B4, 'u'] },
            ];
            const item = notes[bar][s];
            if (item) {
              this.synthFormantVoice(t, mtof(item[0]), item[1], 0.28, 0.24, 'square', false);
              return 'sing';
            }
          } else {
            // Corrupted warning robot voice
            if (s === 0 || s === 4 || s === 8) {
              const p = s === 8 ? N.Eb4 : N.A3;
              this.synthFormantVoice(t, mtof(p), s === 4 ? 'a' : 'e', 0.34, 0.24, 'sawtooth', true);
              return 'sing';
            }
          }
          return null;
        }

        case 'wenda': {
          // Rhythmic energetic "Hey! / Hey!" cat vocal chant
          if (!horror) {
            if (s === 4 || s === 12 || (bar === 3 && s === 14)) {
              const pitch = bar === 2 ? N.C5 : N.A4;
              this.synthFormantVoice(t, mtof(pitch), 'e', 0.18, 0.26, 'sawtooth', false);
              return 'sing';
            }
          } else {
            // Creepy rapid staggered laughter/shrieks
            if (s === 3 || s === 6 || s === 11 || s === 14) {
              const pitch = s % 2 === 0 ? N.Eb5 : N.A5;
              this.synthFormantVoice(t, mtof(pitch), 'i', 0.16, 0.22, 'sawtooth', true);
              return 'sing';
            }
          }
          return null;
        }

        case 'pinki': {
          // Sweet soaring soprano choir ("Ahh - Ooo")
          if (!horror) {
            const notes = [
              { 0: [N.E5, 'a'], 8: [N.C5, 'o'] },
              { 0: [N.F5, 'a'], 8: [N.C5, 'u'] },
              { 0: [N.G5, 'a'], 8: [N.E5, 'o'] },
              { 0: [N.G5, 'e'], 8: [N.D5, 'u'] },
            ];
            const item = notes[bar][s];
            if (item) {
              this.synthFormantVoice(t, mtof(item[0]), item[1], 0.85, 0.24, 'sawtooth', false);
              return 'sing';
            }
          } else {
            // Ghostly lamenting wail
            const notes = [
              { 0: [N.E5, 'u'] },
              { 0: [N.F5, 'o'] },
              { 0: [N.Eb5, 'a'] },
              { 0: [N.E5, 'u'] },
            ];
            const item = notes[bar][s];
            if (item) {
              this.synthFormantVoice(t, mtof(item[0]), item[1], 1.7, 0.24, 'sawtooth', true);
              return 'sing';
            }
          }
          return null;
        }

        case 'jevin': {
          // Deep resonant bass choir ("Mmm - Ohh")
          if (!horror) {
            const notes = [N.A2, N.F2, N.C3, N.G2];
            if (s === 0 || s === 8) {
              this.synthFormantVoice(t, mtof(notes[bar]), s === 0 ? 'o' : 'u', 0.9, 0.34, 'sawtooth', false);
              return 'sing';
            }
          } else {
            // Ominous cathedral doom chant
            const notes = [N.A2, N.Bb2, N.A2, N.E2];
            if (s === 0) {
              this.synthFormantVoice(t, mtof(notes[bar]), 'o', 1.85, 0.38, 'sawtooth', true);
              return 'sing';
            }
          }
          return null;
        }

        case 'black': {
          // Deep abyssal horror drone + eerie sub pulse
          const notes = [N.A2 - 12, N.Bb2 - 12, N.A2 - 12, N.E2 - 12];
          if (s === 0) {
            this.synthAbyssDrone(t, mtof(notes[bar]), 2.1, 0.34);
            return 'sing';
          }
          if (s === 8) {
            this.synthKick(t, 75, 26, 0.45, 0.65, true);
            return 'hit';
          }
          return null;
        }

        /* ==================== CUSTOM FRIENDS ==================== */
        case 'connor': {
          // Energetic trap hi-hat rolls + melodic floor-tom fills
          if (!horror) {
            if (s === 3 || s === 7 || s === 11 || s === 14 || s === 15) {
              this.synthHiHat(t, 0.04, 0.22, 11000);
              if (s === 14 || s === 15) {
                // Fast double-time trap hi-hat roll
                this.synthHiHat(t + 0.06, 0.035, 0.16, 12000);
              }
            }
            if (s === 0 || s === 6 || s === 10 || (bar === 3 && (s === 12 || s === 14))) {
              const tomPitch = s === 0 ? 155 : s === 6 ? 195 : s === 10 ? 130 : 175;
              this.synthTom(t, tomPitch, 0.18, 0.42, false);
              return 'hit';
            }
          } else {
            // Distorted war-tom thunder & frantic metallic hats
            if (s === 0 || s === 5 || s === 10 || s === 13) {
              this.synthTom(t, s === 0 ? 115 : 88, 0.28, 0.5, true);
              return 'hit';
            }
            if (s % 2 === 1) {
              this.synthHiHat(t, 0.06, 0.18, 6500);
            }
          }
          return null;
        }

        case 'allison': {
          // Shimmering dreamy plucked harp arpeggios
          if (!horror) {
            const arps = [
              [N.A4, N.C5, N.E5, N.A5, N.E5, N.C5, N.E5, N.G5],
              [N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.C5, N.E5],
              [N.C4, N.E4, N.G4, N.C5, N.G4, N.E4, N.G4, N.B4],
              [N.G4, N.B4, N.D5, N.G5, N.D5, N.B4, N.D5, N.F5],
            ];
            if (s % 2 === 0) {
              const note = arps[bar][s / 2];
              this.synthHarpPluck(t, mtof(note), 0.65, 0.22, false);
              if (s % 4 === 0) return 'sway';
            }
          } else {
            // Haunted detuned descending minor/tritone harp
            const creepyArps = [
              [N.A5, N.E5, N.Eb5, N.C5, N.A4, null, N.Eb5, null],
              [N.Bb5, N.F5, N.D5, N.Bb4, N.E5, null, N.D5, null],
              [N.Eb5, N.C5, N.A4, N.Eb4, N.C5, null, N.A4, null],
              [N.E5, N.F5, N.Gs4, N.B4, N.E5, null, N.F5, null],
            ];
            if (s % 2 === 0) {
              const note = creepyArps[bar][s / 2];
              if (note) {
                this.synthHarpPluck(t, mtof(note), 0.95, 0.24, true);
                return 'sway';
              }
            }
          }
          return null;
        }

        case 'doug': {
          // Soulful baritone vocal groove ("Bum-ba-da-ohh!")
          if (!horror) {
            const phrases = [
              { 0: [N.A3, 'u'], 3: [N.C4, 'a'], 6: [N.E4, 'o'], 10: [N.C4, 'a'], 12: [N.A3, 'o'] },
              { 0: [N.F3, 'u'], 3: [N.A3, 'a'], 6: [N.C4, 'o'], 10: [N.A3, 'e'], 12: [N.F3, 'o'] },
              { 0: [N.G3, 'u'], 3: [N.C4, 'a'], 6: [N.E4, 'o'], 10: [N.D4, 'a'], 12: [N.C4, 'o'] },
              { 0: [N.G3, 'o'], 3: [N.B3, 'a'], 6: [N.D4, 'e'], 10: [N.B3, 'o'], 12: [N.G3, 'u'] },
            ];
            const item = phrases[bar][s];
            if (item) {
              this.synthFormantVoice(t, mtof(item[0]), item[1], s === 6 || s === 12 ? 0.34 : 0.2, 0.3, 'sawtooth', false);
              return 'sing';
            }
          } else {
            // Deep eerie baritone Phrygian doom hum
            const phrases = [
              { 0: [N.A2, 'u'], 8: [N.Eb3, 'o'] },
              { 0: [N.Bb2, 'o'], 8: [N.F3, 'u'] },
              { 0: [N.Eb3, 'a'], 8: [N.A2, 'u'] },
              { 0: [N.E2, 'o'], 8: [N.F2, 'u'] },
            ];
            const item = phrases[bar][s];
            if (item) {
              this.synthFormantVoice(t, mtof(item[0]), item[1], 0.9, 0.35, 'sawtooth', true);
              return 'sing';
            }
          }
          return null;
        }

        case 'aqua': {
          // If Aqua is somehow active in horror/normal, still plays crisp sonar + acid sub
          if (s === 0) {
            this.synthSonarPing(t, horror ? mtof(N.Eb5) : mtof(N.E5), 0.75, 0.25);
            return 'sway';
          }
          if (s === 4 || s === 10 || s === 14) {
            this.synthAcid303(t, mtof(root), 0.16, 0.25, s === 10);
            return 'hit';
          }
          return null;
        }

        case 'drift': {
          // Signature 808 Phonk Cowbell riff if Drift is active in another theme
          const cb = { 0: N.A5, 3: N.C6, 6: N.E5, 10: N.A5, 12: N.G5 };
          if (cb[s]) {
            this.synthPhonkCowbell(t, mtof(horror ? cb[s] - 1 : cb[s]), 0.16, 0.28);
            return 'hit';
          }
          return null;
        }

        default:
          return null;
      }
    }

    /* ----------------------------------------------------------------------
       UNDERWATER TECHNO MODE (128 BPM · A Dorian / Deep Acid Techno)
       Chord progression: Am - Fmaj7 - G - Em
       ---------------------------------------------------------------------- */
    triggerUnderwaterSound(id, step, t, bar, s) {
      const roots = [N.A2, N.F2, N.G2, N.E2];
      const root = roots[bar];

      switch (id) {
        case 'oren': {
          // Driving 4-on-the-floor deep techno kick
          if (s % 4 === 0) {
            this.synthKick(t, 138, 42, 0.22, 0.92, false);
            return 'hit';
          }
          return null;
        }
        case 'raddy': {
          // Crisp 909 techno clap on 2 & 4 + ghost syncopation
          if (s === 4 || s === 12) {
            this.synthSnare(t, 0.56, false);
            return 'hit';
          }
          if (bar === 3 && s === 15) {
            this.synthSnare(t, 0.32, false);
            return 'hit';
          }
          return null;
        }
        case 'clukr': {
          // Pumping offbeat open techno hats + 16th-note pulse
          if (s === 2 || s === 6 || s === 10 || s === 14) {
            this.synthHiHat(t, 0.16, 0.3, 7200);
            return 'hit';
          }
          if (s % 2 === 0) {
            this.synthHiHat(t, 0.04, 0.12, 9600);
          }
          return null;
        }
        case 'funbot': {
          // Syncopated liquid techno breakbeat
          if (s === 0 || s === 10) {
            this.synthKick(t, 165, 50, 0.16, 0.55, false);
            return 'hit';
          }
          if (s === 3 || s === 7 || s === 11 || s === 15) {
            this.synthHiHat(t, 0.05, 0.18, 6200);
          }
          if (s === 12) {
            this.synthSnare(t, 0.35, false);
            return 'hit';
          }
          return null;
        }
        case 'vineria': {
          // Bubbling submerged 16th shaker wave
          const cutoff = 2800 + Math.sin((step / 16) * Math.PI * 2) * 1400;
          this.synthShaker(t, s % 4 === 2 ? 0.2 : 0.1, cutoff);
          if (s % 4 === 2) return 'sway';
          return null;
        }
        case 'connor': {
          // Rolling techno hi-hat triplets + deep resonant tom groove
          if (s === 3 || s === 7 || s === 11 || s === 14 || s === 15) {
            this.synthHiHat(t, 0.04, 0.2, 8400);
            if (s === 14) this.synthHiHat(t + 0.055, 0.035, 0.15, 9200);
          }
          if (s === 2 || s === 8 || s === 13) {
            this.synthTom(t, s === 2 ? 145 : s === 8 ? 175 : 120, 0.18, 0.42, false);
            return 'hit';
          }
          return null;
        }
        case 'gray': {
          // Deep rolling sidechained techno sub bass (pumping on offbeats!)
          if (s === 2 || s === 3 || s === 6 || s === 10 || s === 11 || s === 14) {
            this.synthSubBass(t, mtof(root), 0.18, 0.48, false);
            return 'hit';
          }
          return null;
        }
        case 'brud': {
          // Submerged dub rimshot / sonar woodblock echo
          if (s === 3 || s === 9 || s === 14) {
            this.synthBucket(t, s === 9 ? 620 : 440, 0.12, 0.24);
            return 'hit';
          }
          return null;
        }
        case 'garnold': {
          // Classic squelchy TB-303 acid bassline!
          const acid = [0, null, 0, 12, null, 7, 10, null, 0, null, 12, 7, 10, null, 15, 12];
          const semi = acid[s];
          if (semi !== null) {
            const accent = s === 3 || s === 10 || s === 14;
            this.synthAcid303(t, mtof(root + semi), 0.15, accent ? 0.3 : 0.22, accent);
            return 'sway';
          }
          return null;
        }
        case 'owakcx': {
          // Bubbling liquid FM synth zaps
          if (s === 2 || s === 5 || s === 11 || s === 15) {
            const f1 = 420 + ((step * 211) % 1100);
            this.synthZap(t, f1, 180, 0.13, 0.18);
            return 'hit';
          }
          return null;
        }
        case 'sky': {
          // Sparkling bioluminescent underwater chime arp
          const chimes = [
            [N.A5, N.E5, N.G5, N.C6],
            [N.A5, N.F5, N.E5, N.C6],
            [N.B5, N.G5, N.D5, N.G5],
            [N.B5, N.G5, N.E5, N.B4],
          ];
          if (s % 2 === 0) {
            this.synthMusicBox(t, mtof(chimes[bar][(s / 2) % 4]), 0.45, 0.19, false);
            if (s % 4 === 0) return 'sway';
          }
          return null;
        }
        case 'mrsun': {
          // Euphoric Berlin dub-techno filtered chord stabs
          const chords = [
            [N.A3, N.C4, N.E4, N.G4],
            [N.F3, N.A3, N.C4, N.E4],
            [N.G3, N.B3, N.D4, N.G4],
            [N.E3, N.G3, N.B3, N.D4],
          ];
          if (s === 0 || s === 3 || s === 6 || s === 10 || s === 14) {
            this.synthTechnoStab(t, chords[bar], 0.24, 0.26);
            return 'sway';
          }
          return null;
        }
        case 'durple': {
          // Deep resonant underwater sub-brass swell
          if (s === 0 || s === 8) {
            this.synthBrass(t, mtof(root + 12), 0.55, 0.24, false);
            return 'sing';
          }
          return null;
        }
        case 'mrtree': {
          // Lush deep-house organ pad pulses
          const chords = [
            [N.A4, N.C5, N.E5],
            [N.F4, N.A4, N.E5],
            [N.G4, N.B4, N.D5],
            [N.E4, N.G4, N.B4],
          ];
          if (s === 2 || s === 6 || s === 10 || s === 14) {
            this.synthOrgan(t, chords[bar], 0.22, 0.16, false);
            return 'sway';
          }
          return null;
        }
        case 'simon': {
          // Driving 16th-note trance/techno lead arp
          const arp = [
            [N.A4, N.C5, N.E5, N.G5, N.A5, N.G5, N.E5, N.C5],
            [N.F4, N.A4, N.C5, N.E5, N.F5, N.E5, N.C5, N.A4],
            [N.G4, N.B4, N.D5, N.G5, N.A5, N.G5, N.D5, N.B4],
            [N.E4, N.G4, N.B4, N.D5, N.E5, N.D5, N.B4, N.G4],
          ];
          const note = arp[bar][s % 8];
          this.synthChiptune(t, mtof(note), 0.11, 0.15, false);
          if (s % 2 === 0) return 'sing';
          return null;
        }
        case 'tunner': {
          // Floating liquid underwater synth whistle hook
          const hook = [
            { 0: N.E5, 6: N.G5, 10: N.A5 },
            { 0: N.E5, 6: N.C5, 12: N.A4 },
            { 0: N.D5, 6: N.G5, 10: N.B5 },
            { 0: N.G5, 6: N.E5, 12: N.D5 },
          ];
          const note = hook[bar][s];
          if (note) {
            this.synthWhistle(t, mtof(note), 0.42, 0.2, false);
            return 'sing';
          }
          return null;
        }
        case 'allison': {
          // Cascading aquatic neon harp arpeggios
          const arps = [
            [N.A4, N.E5, N.G5, N.A5, N.C6, N.A5, N.G5, N.E5],
            [N.F4, N.C5, N.E5, N.A5, N.C6, N.A5, N.E5, N.C5],
            [N.G4, N.D5, N.G5, N.B5, N.D5, N.B4, N.G4, N.D5],
            [N.E4, N.B4, N.E5, N.G5, N.B5, N.G5, N.E5, N.B4],
          ];
          if (s % 2 === 0) {
            this.synthHarpPluck(t, mtof(arps[bar][s / 2]), 0.55, 0.22, false);
            if (s % 4 === 0) return 'sway';
          }
          return null;
        }
        case 'funcomputer': {
          // Robotic vocoder techno melody
          const vox = [
            { 0: [N.A4, 'e'], 3: [N.C5, 'i'], 6: [N.E5, 'a'], 10: [N.G5, 'o'], 14: [N.E5, 'e'] },
            { 0: [N.F4, 'a'], 3: [N.A4, 'e'], 6: [N.C5, 'i'], 10: [N.E5, 'o'], 14: [N.C5, 'u'] },
            { 0: [N.G4, 'e'], 3: [N.B4, 'a'], 6: [N.D5, 'i'], 10: [N.G5, 'o'], 14: [N.D5, 'e'] },
            { 0: [N.E4, 'o'], 3: [N.G4, 'e'], 6: [N.B4, 'a'], 10: [N.D5, 'i'], 14: [N.B4, 'u'] },
          ];
          const item = vox[bar][s];
          if (item) {
            this.synthFormantVoice(t, mtof(item[0]), item[1], 0.22, 0.24, 'square', false);
            return 'sing';
          }
          return null;
        }
        case 'wenda': {
          // Chopped house vocal stabs ("Hey! / Go!")
          if (s === 4 || s === 10 || s === 14) {
            this.synthFormantVoice(t, mtof(bar % 2 === 0 ? N.A4 : N.G4), 'e', 0.14, 0.26, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'pinki': {
          // Ethereal deep-sea siren soprano vocals
          const siren = [
            { 0: [N.E5, 'a'], 8: [N.G5, 'o'] },
            { 0: [N.E5, 'u'], 8: [N.C5, 'a'] },
            { 0: [N.D5, 'e'], 8: [N.G5, 'o'] },
            { 0: [N.E5, 'a'], 8: [N.B4, 'u'] },
          ];
          const item = siren[bar][s];
          if (item) {
            this.synthFormantVoice(t, mtof(item[0]), item[1], 0.8, 0.24, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'jevin': {
          // Deep pulsing ocean bass choir
          if (s === 0 || s === 8) {
            this.synthFormantVoice(t, mtof(root), s === 0 ? 'o' : 'u', 0.75, 0.34, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'doug': {
          // Syncopated deep-house baritone vocal groove
          const groove = [
            { 0: [N.A3, 'u'], 6: [N.C4, 'o'], 10: [N.E4, 'a'], 14: [N.C4, 'u'] },
            { 0: [N.F3, 'u'], 6: [N.A3, 'o'], 10: [N.C4, 'a'], 14: [N.A3, 'e'] },
            { 0: [N.G3, 'u'], 6: [N.B3, 'o'], 10: [N.D4, 'a'], 14: [N.B3, 'o'] },
            { 0: [N.E3, 'u'], 6: [N.G3, 'o'], 10: [N.B3, 'a'], 14: [N.G3, 'u'] },
          ];
          const item = groove[bar][s];
          if (item) {
            this.synthFormantVoice(t, mtof(item[0]), item[1], 0.24, 0.3, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'black': {
          // Deep abyssal sub-bass pulse
          if (s === 0 || s === 8) {
            this.synthAbyssDrone(t, mtof(root - 12), 0.9, 0.3);
            return 'sing';
          }
          return null;
        }
        case 'aqua': {
          // Signature Underwater Techno Lead: Submarine Sonar Ping + Rolling 303 Acid Pulse!
          if (s === 0 || (bar % 2 === 1 && s === 10)) {
            const pingNotes = [N.E6, N.C6, N.D6 || 86, N.B5];
            this.synthSonarPing(t, mtof(pingNotes[bar]), 0.7, 0.26);
            return 'sway';
          }
          if (s === 2 || s === 6 || s === 8 || s === 12 || s === 14) {
            const off = s === 6 || s === 14 ? 12 : s === 12 ? 7 : 0;
            this.synthAcid303(t, mtof(root + off), 0.16, 0.28, s === 6 || s === 14);
            return 'sing';
          }
          return null;
        }
        case 'drift': {
          // Phonk cowbell counter-groove in underwater techno
          if (s === 3 || s === 9 || s === 14) {
            this.synthPhonkCowbell(t, mtof(s === 9 ? N.C6 : N.A5), 0.14, 0.24);
            return 'hit';
          }
          return null;
        }
        default:
          return null;
      }
    }

    /* ----------------------------------------------------------------------
       DRIFT PHONK MODE (136 BPM · A Minor / Dark Memphis Phonk)
       Progression: Am - Am - F - E (with iconic 808 Cowbells & Clipped 808s!)
       ---------------------------------------------------------------------- */
    triggerPhonkSound(id, step, t, bar, s) {
      const roots = [N.A2, N.A2, N.F2, N.E2];
      const root = roots[bar];

      switch (id) {
        case 'oren': {
          // Heavy punchy clipped Phonk kick
          if (s === 0 || s === 3 || s === 6 || s === 10 || (bar === 3 && s === 14)) {
            this.synthKick(t, 155, 36, 0.24, 0.95, true);
            return 'hit';
          }
          return null;
        }
        case 'raddy': {
          // Hard Memphis phonk snare & clap on 3 (half-time: step 8) + snare rolls!
          if (s === 4 || s === 12) {
            this.synthSnare(t, 0.65, false);
            return 'hit';
          }
          if (bar === 3 && (s === 14 || s === 15)) {
            this.synthSnare(t, 0.42, true);
            return 'hit';
          }
          return null;
        }
        case 'clukr': {
          // Crisp 16th-note dark phonk hi-hats + metallic open accents
          if (s === 2 || s === 6 || s === 10 || s === 14) {
            this.synthHiHat(t, 0.11, 0.26, 9200);
            return 'hit';
          }
          if (s % 2 === 0) {
            this.synthHiHat(t, 0.035, 0.16, 11000);
          }
          return null;
        }
        case 'funbot': {
          // Rapid gritty Memphis break-percussion
          if (s === 0 || s === 7 || s === 10) {
            this.synthKick(t, 165, 44, 0.16, 0.58, true);
            return 'hit';
          }
          if (s === 4 || s === 12) {
            this.synthSnare(t, 0.4, false);
            return 'hit';
          }
          return null;
        }
        case 'vineria': {
          // Dark lo-fi cassette shaker pulse
          if (s % 2 === 0 || s === 15) {
            this.synthShaker(t, s % 4 === 2 ? 0.2 : 0.11, 4600);
            if (s % 4 === 2) return 'sway';
          }
          return null;
        }
        case 'connor': {
          // Signature rapid-fire Drift Phonk 32nd-note hi-hat rolls & booming toms!
          this.synthHiHat(t, 0.032, s % 2 === 0 ? 0.2 : 0.12, 10800);
          if (s === 6 || s === 14 || s === 15) {
            this.synthHiHat(t + 0.055, 0.03, 0.18, 12200);
          }
          if (s === 0 || s === 10 || (bar === 3 && s === 13)) {
            this.synthTom(t, s === 0 ? 135 : 105, 0.2, 0.46, true);
            return 'hit';
          }
          return null;
        }
        case 'gray': {
          // Massive distorted sliding Drift Phonk 808 Sub Bass!
          if (s === 0 || s === 6 || s === 10) {
            const slideTo = s === 10 ? mtof(root + 7) : null;
            this.synthPhonk808(t, mtof(root - 12), s === 0 ? 0.55 : 0.34, 0.54, slideTo);
            return 'hit';
          }
          return null;
        }
        case 'brud': {
          // Secondary rhythmic 808 Phonk cowbell stabs!
          const hits = { 0: N.A5, 4: N.A5, 6: N.C6, 10: N.A5, 14: N.G5 };
          if (hits[s]) {
            this.synthPhonkCowbell(t, mtof(hits[s] - 12), 0.14, 0.26);
            return 'hit';
          }
          return null;
        }
        case 'garnold': {
          // Aggressive overdriven reese/acid phonk synth bass
          if (s === 0 || s === 3 || s === 8 || s === 11 || s === 14) {
            const semi = s === 3 || s === 11 ? 3 : s === 14 ? 7 : 0;
            this.synthAcid303(t, mtof(root + semi), 0.16, 0.28, s === 0 || s === 8);
            return 'sway';
          }
          return null;
        }
        case 'owakcx': {
          // Tape-stop laser / drift screech zaps
          if (s === 2 || s === 7 || s === 15) {
            this.synthZap(t, s === 15 ? 1600 : 720, 95, 0.14, 0.2);
            return 'hit';
          }
          return null;
        }
        case 'sky': {
          // Dark eerie Memphis music-box bell motif
          const bells = [
            [N.A5, N.C6, N.E5, N.A5],
            [N.A5, N.B5, N.G5, N.E5],
            [N.F5, N.A5, N.C6, N.F5],
            [N.E5, N.Gs5, N.B5, N.E5],
          ];
          if (s % 4 === 0) {
            this.synthMusicBox(t, mtof(bells[bar][s / 4]), 0.5, 0.2, true);
            return 'sway';
          }
          return null;
        }
        case 'mrsun': {
          // Dark moody minor phonk synth chord hits
          const chords = [
            [N.A3, N.C4, N.E4],
            [N.A3, N.C4, N.E4],
            [N.F3, N.A3, N.C4],
            [N.E3, N.Gs3, N.B3],
          ];
          if (s === 0 || s === 6 || s === 12) {
            this.synthChordStab(t, chords[bar], 0.32, 0.24, 'sawtooth', true);
            return 'sway';
          }
          return null;
        }
        case 'durple': {
          // Heavy distorted trap brass hits!
          if (s === 0 || s === 10) {
            this.synthBrass(t, mtof(root), 0.42, 0.32, true);
            return 'sing';
          }
          return null;
        }
        case 'mrtree': {
          // Gritty vintage Memphis dark organ chords
          const chords = [
            [N.A3, N.E4, N.A4],
            [N.A3, N.C4, N.E4],
            [N.F3, N.C4, N.F4],
            [N.E3, N.B3, N.Gs4],
          ];
          if (s === 0 || s === 8) {
            this.synthOrgan(t, chords[bar], 0.65, 0.2, true);
            return 'sway';
          }
          return null;
        }
        case 'simon': {
          // Hypnotic fast minor-key phonk synth arp
          const arp = [
            [N.A4, N.C5, N.E5, N.A5, N.E5, N.C5, N.B4, N.E5],
            [N.A4, N.C5, N.E5, N.G5, N.E5, N.C5, N.A4, N.G4],
            [N.F4, N.A4, N.C5, N.F5, N.C5, N.A4, N.G4, N.C5],
            [N.E4, N.Gs4, N.B4, N.E5, N.B4, N.Gs4, N.F4, N.E4],
          ];
          if (s % 2 === 0) {
            this.synthChiptune(t, mtof(arp[bar][s / 2]), 0.12, 0.16, false);
            if (s % 4 === 0) return 'sing';
          }
          return null;
        }
        case 'tunner': {
          // Menacing midnight street whistle melody
          const w = [
            { 0: N.E5, 6: N.A5, 12: N.G5 },
            { 0: N.E5, 8: N.C5 },
            { 0: N.F5, 6: N.A5, 12: N.G5 },
            { 0: N.E5, 6: N.Gs5, 12: N.B5 },
          ];
          const note = w[bar][s];
          if (note) {
            this.synthWhistle(t, mtof(note), 0.36, 0.2, true);
            return 'sing';
          }
          return null;
        }
        case 'allison': {
          // Dark shimmering minor phonk harp plucks
          const harp = [
            [N.A4, N.E5, N.C5, N.A5, N.E5, N.C5, N.A4, N.E5],
            [N.A4, N.E5, N.G5, N.E5, N.C5, N.A4, N.G4, N.E4],
            [N.F4, N.C5, N.A5, N.C5, N.A4, N.F4, N.C5, N.A4],
            [N.E4, N.B4, N.Gs5, N.E5, N.B4, N.Gs4, N.E4, N.B4],
          ];
          if (s % 2 === 0) {
            this.synthHarpPluck(t, mtof(harp[bar][s / 2]), 0.42, 0.22, false);
            if (s % 4 === 0) return 'sway';
          }
          return null;
        }
        case 'funcomputer': {
          // Chopped pitched-down robotic phonk vocal sample
          if (s === 0 || s === 3 || s === 6 || s === 10 || s === 12) {
            const p = s === 6 ? N.C4 : s === 12 ? N.G3 : N.A3;
            this.synthFormantVoice(t, mtof(p), s % 2 === 0 ? 'o' : 'a', 0.14, 0.26, 'square', false);
            return 'sing';
          }
          return null;
        }
        case 'wenda': {
          // Classic Memphis "Yuh! / Hey!" rhythmic chant chops
          if (s === 4 || s === 12 || (bar % 2 === 1 && s === 14)) {
            this.synthFormantVoice(t, mtof(N.A3), 'a', 0.13, 0.3, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'pinki': {
          // Haunting chopped dark choir pad
          const choir = [
            { 0: [N.E5, 'a'], 8: [N.C5, 'o'] },
            { 0: [N.E5, 'u'], 8: [N.B4, 'o'] },
            { 0: [N.F5, 'a'], 8: [N.C5, 'u'] },
            { 0: [N.E5, 'o'], 8: [N.Gs4, 'a'] },
          ];
          const item = choir[bar][s];
          if (item) {
            this.synthFormantVoice(t, mtof(item[0]), item[1], 0.7, 0.22, 'sawtooth', true);
            return 'sing';
          }
          return null;
        }
        case 'jevin': {
          // Ultra-deep pitched-down Memphis vocal bass chant
          if (s === 0 || s === 6 || s === 10) {
            this.synthFormantVoice(t, mtof(root), s === 6 ? 'a' : 'o', 0.28, 0.38, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'doug': {
          // Chopped & screwed Memphis rap-cadence formant vocal riff!
          const flow = { 0: 'o', 2: 'a', 4: 'u', 6: 'o', 8: 'a', 10: 'e', 12: 'o', 14: 'u' };
          if (flow[s]) {
            const p = s === 6 || s === 14 ? root + 3 : root;
            this.synthFormantVoice(t, mtof(p), flow[s], 0.13, 0.3, 'sawtooth', false);
            return 'sing';
          }
          return null;
        }
        case 'black': {
          // Dark sub-rumble drift drone
          if (s === 0) {
            this.synthAbyssDrone(t, mtof(root - 12), 1.3, 0.32);
            return 'sing';
          }
          return null;
        }
        case 'aqua': {
          // Midnight sonar fx ping
          if (s === 0 || s === 10) {
            this.synthSonarPing(t, mtof(s === 0 ? N.A5 : N.E6), 0.5, 0.22);
            return 'sway';
          }
          return null;
        }
        case 'drift': {
          // ICONIC DRIFT PHONK 808 COWBELL MELODY LEAD!
          const cowbellMelody = [
            { 0: N.A5, 2: N.A5, 3: N.C6, 6: N.E6, 8: N.A5, 10: N.G5, 12: N.E5, 14: N.G5 },
            { 0: N.A5, 3: N.C6, 6: N.D6 || 86, 8: N.C6, 10: N.A5, 12: N.G5, 14: N.E5 },
            { 0: N.F5, 2: N.F5, 3: N.A5, 6: N.C6, 8: N.A5, 10: N.G5, 12: N.F5, 14: N.E5 },
            { 0: N.E5, 3: N.Gs5, 6: N.B5, 8: N.E6, 10: N.B5, 12: N.Gs5, 14: N.A5 },
          ];
          const note = cowbellMelody[bar][s];
          if (note) {
            this.synthPhonkCowbell(t, mtof(note), s === 6 || s === 8 ? 0.22 : 0.15, 0.36);
            return 'hit';
          }
          return null;
        }
        default:
          return null;
      }
    }

    /* ----------------------------------------------------------------------
       Synthesizer Primitives
       ---------------------------------------------------------------------- */
    synthKick(t, fStart, fEnd, dur, vol, distorted) {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = distorted ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(fStart, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(20, fEnd), t + 0.08);
      osc.frequency.exponentialRampToValueAtTime(Math.max(18, fEnd * 0.8), t + dur);

      gain.gain.setValueAtTime(vol, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);

      if (distorted) {
        const shaper = this.makeDistortion(40);
        osc.connect(shaper);
        shaper.connect(gain);
      } else {
        osc.connect(gain);
      }
      gain.connect(this.compressor);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    synthSnare(t, vol, industrial) {
      // Noise burst
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = industrial ? 'bandpass' : 'highpass';
      filter.frequency.setValueAtTime(industrial ? 1100 : 1800, t);
      filter.Q.value = industrial ? 2.5 : 0.8;

      const ng = this.ctx.createGain();
      ng.gain.setValueAtTime(vol, t);
      ng.gain.exponentialRampToValueAtTime(0.001, t + (industrial ? 0.28 : 0.16));

      src.connect(filter);
      filter.connect(ng);
      ng.connect(this.compressor);
      src.start(t);
      src.stop(t + 0.3);

      // Punchy body tone
      const osc = this.ctx.createOscillator();
      const og = this.ctx.createGain();
      osc.type = industrial ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(industrial ? 140 : 210, t);
      osc.frequency.exponentialRampToValueAtTime(80, t + 0.09);
      og.gain.setValueAtTime(vol * 0.6, t);
      og.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      osc.connect(og);
      og.connect(this.compressor);
      osc.start(t);
      osc.stop(t + 0.11);
    }

    synthHiHat(t, dur, vol, cutoff) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const hp = this.ctx.createBiquadFilter();
      hp.type = 'highpass';
      hp.frequency.setValueAtTime(cutoff, t);
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(hp);
      hp.connect(g);
      g.connect(this.compressor);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    synthCymbal(t, dur, vol, metallicHorror) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(metallicHorror ? 2200 : 6200, t);
      bp.Q.value = metallicHorror ? 6.0 : 1.5;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.compressor);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    synthShaker(t, vol, freq) {
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      const bp = this.ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq, t);
      bp.Q.value = 3.0;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.075);
      src.connect(bp);
      bp.connect(g);
      g.connect(this.compressor);
      src.start(t);
      src.stop(t + 0.09);
    }

    synthSubBass(t, freq, dur, vol, reese) {
      const osc1 = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc1.type = reese ? 'sawtooth' : 'triangle';
      osc1.frequency.setValueAtTime(freq, t);
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(reese ? 260 : 340, t);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(lp);
      if (reese) {
        const osc2 = this.ctx.createOscillator();
        osc2.type = 'sawtooth';
        osc2.frequency.setValueAtTime(freq * 1.012, t);
        osc2.connect(lp);
        osc2.start(t);
        osc2.stop(t + dur + 0.03);
      }
      lp.connect(g);
      g.connect(this.compressor);
      osc1.start(t);
      osc1.stop(t + dur + 0.03);
    }

    synthBucket(t, freq, dur, vol) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const bp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc1.type = 'square';
      osc2.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 1.48, t);
      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq * 1.2, t);
      bp.Q.value = 3.2;

      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(bp);
      osc2.connect(bp);
      bp.connect(g);
      g.connect(this.compressor);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.02);
      osc2.stop(t + dur + 0.02);
    }

    synthFunkBass(t, freq, dur, vol, dark) {
      const osc = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      lp.type = 'lowpass';
      lp.Q.value = dark ? 7 : 4.5;
      lp.frequency.setValueAtTime(dark ? 950 : 1800, t);
      lp.frequency.exponentialRampToValueAtTime(dark ? 160 : 320, t + dur);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    synthZap(t, fStart, fEnd, dur, vol) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(fStart, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, fEnd), t + dur);
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    synthMusicBox(t, freq, dur, vol, creepy) {
      const osc = this.ctx.createOscillator();
      const overtone = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      overtone.type = 'triangle';
      const detune = creepy ? (Math.random() - 0.5) * 32 : 0;
      osc.frequency.setValueAtTime(freq, t);
      osc.detune.value = detune;
      overtone.frequency.setValueAtTime(freq * 2.0, t);
      overtone.detune.value = detune * 1.4;

      const ovGain = this.ctx.createGain();
      ovGain.gain.value = 0.25;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(g);
      overtone.connect(ovGain);
      ovGain.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc.start(t);
      overtone.start(t);
      osc.stop(t + dur + 0.02);
      overtone.stop(t + dur + 0.02);
    }

    synthChordStab(t, midiNotes, dur, vol, wave, horror) {
      const perNoteVol = vol / midiNotes.length;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(horror ? 1200 : 2800, t);
      lp.frequency.exponentialRampToValueAtTime(horror ? 300 : 900, t + dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(1.0, t + 0.015);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      lp.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      midiNotes.forEach((m) => {
        const osc = this.ctx.createOscillator();
        const ng = this.ctx.createGain();
        osc.type = wave;
        osc.frequency.setValueAtTime(mtof(m), t);
        if (horror) osc.detune.value = (Math.random() - 0.5) * 28;
        ng.gain.value = perNoteVol;
        osc.connect(ng);
        ng.connect(lp);
        osc.start(t);
        osc.stop(t + dur + 0.03);
      });
    }

    synthBrass(t, freq, dur, vol, horror) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * (horror ? 1.015 : 1.005), t);

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(horror ? 180 : 320, t);
      lp.frequency.linearRampToValueAtTime(horror ? 900 : 1900, t + 0.08);
      lp.frequency.exponentialRampToValueAtTime(horror ? 240 : 650, t + dur);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.03);
      osc2.stop(t + dur + 0.03);
    }

    synthOrgan(t, midiNotes, dur, vol, horror) {
      const perVol = vol / midiNotes.length;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(1.0, t + 0.02);
      g.gain.setValueAtTime(0.9, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = horror ? 950 : 2100;
      lp.connect(g);
      g.connect(this.compressor);

      midiNotes.forEach((m) => {
        const osc = this.ctx.createOscillator();
        const ng = this.ctx.createGain();
        osc.type = horror ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(mtof(m), t);
        ng.gain.value = perVol;
        osc.connect(ng);
        ng.connect(lp);
        osc.start(t);
        osc.stop(t + dur + 0.02);
      });
    }

    synthChiptune(t, freq, dur, vol, horror) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, t);
      if (horror) {
        osc.frequency.linearRampToValueAtTime(freq * 0.94, t + dur);
      }
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = horror ? 2600 : 3200;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    synthWhistle(t, freq, dur, vol, horror) {
      const osc = this.ctx.createOscillator();
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * 0.96, t);
      osc.frequency.exponentialRampToValueAtTime(freq, t + 0.05);
      if (horror) {
        osc.frequency.linearRampToValueAtTime(freq * 0.93, t + dur);
      }

      // Expressive vibrato
      lfo.frequency.value = horror ? 4.2 : 5.8;
      lfoGain.gain.value = horror ? 14 : 7;
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.045);
      g.gain.setValueAtTime(vol * 0.85, t + dur * 0.7);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc.start(t);
      lfo.start(t);
      osc.stop(t + dur + 0.03);
      lfo.stop(t + dur + 0.03);
    }

    synthFormantVoice(t, freq, vowel, dur, vol, wave, horror) {
      const [f1, f2] = VOWELS[vowel] || VOWELS.a;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      osc1.type = wave;
      osc2.type = wave;
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * (horror ? 1.014 : 1.004), t);

      // Vibrato
      const lfo = this.ctx.createOscillator();
      const lfoGain = this.ctx.createGain();
      lfo.frequency.value = horror ? 6.5 : 5.0;
      lfoGain.gain.value = horror ? freq * 0.025 : freq * 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(osc1.frequency);

      // Dual parallel bandpass formant filters
      const bp1 = this.ctx.createBiquadFilter();
      bp1.type = 'bandpass';
      bp1.frequency.setValueAtTime(f1, t);
      bp1.Q.value = 5.5;

      const bp2 = this.ctx.createBiquadFilter();
      bp2.type = 'bandpass';
      bp2.frequency.setValueAtTime(f2, t);
      bp2.Q.value = 6.5;

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + Math.min(0.08, dur * 0.25));
      g.gain.setValueAtTime(vol * 0.88, t + dur * 0.72);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(bp1);
      osc1.connect(bp2);
      osc2.connect(bp1);
      osc2.connect(bp2);
      bp1.connect(g);
      bp2.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc1.start(t);
      osc2.start(t);
      lfo.start(t);
      osc1.stop(t + dur + 0.04);
      osc2.stop(t + dur + 0.04);
      lfo.stop(t + dur + 0.04);
    }

    synthAbyssDrone(t, freq, dur, vol) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(Math.max(28, freq), t);
      osc2.frequency.setValueAtTime(Math.max(28, freq * 1.505), t);

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(220, t);
      lp.Q.value = 3.5;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.25);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(lp);
      osc2.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.05);
      osc2.stop(t + dur + 0.05);
    }

    synthTom(t, startFreq, dur, vol, distorted) {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = distorted ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(startFreq, t);
      osc.frequency.exponentialRampToValueAtTime(Math.max(42, startFreq * 0.46), t + dur);

      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      if (distorted) {
        const shaper = this.makeDistortion(32);
        osc.connect(shaper);
        shaper.connect(g);
      } else {
        osc.connect(g);
      }
      g.connect(this.compressor);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    }

    synthHarpPluck(t, freq, dur, vol, horror) {
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc1.type = 'triangle';
      osc2.type = 'sine';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 2.0, t);
      if (horror) {
        osc1.detune.value = (Math.random() - 0.5) * 34;
        osc2.detune.value = (Math.random() - 0.5) * 42;
      }

      const o2Gain = this.ctx.createGain();
      o2Gain.gain.value = 0.22;

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(horror ? 2200 : 4200, t);
      lp.frequency.exponentialRampToValueAtTime(horror ? 420 : 900, t + dur);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(lp);
      osc2.connect(o2Gain);
      o2Gain.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.03);
      osc2.stop(t + dur + 0.03);
    }

    synthAcid303(t, freq, dur, vol, accent) {
      const osc = this.ctx.createOscillator();
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      lp.type = 'lowpass';
      lp.Q.value = accent ? 13 : 8;
      lp.frequency.setValueAtTime(accent ? 3400 : 1900, t);
      lp.frequency.exponentialRampToValueAtTime(220, t + dur);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);
      osc.start(t);
      osc.stop(t + dur + 0.03);
    }

    synthSonarPing(t, freq, dur, vol) {
      const osc = this.ctx.createOscillator();
      const harmonic = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      const hGain = this.ctx.createGain();

      osc.type = 'sine';
      harmonic.type = 'sine';
      osc.frequency.setValueAtTime(freq, t);
      harmonic.frequency.setValueAtTime(freq * 1.5, t);
      hGain.gain.value = 0.2;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(g);
      harmonic.connect(hGain);
      hGain.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc.start(t);
      harmonic.start(t);
      osc.stop(t + dur + 0.04);
      harmonic.stop(t + dur + 0.04);
    }

    synthTechnoStab(t, midiNotes, dur, vol) {
      const perVol = vol / midiNotes.length;
      const lp = this.ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.Q.value = 4.2;
      lp.frequency.setValueAtTime(2600, t);
      lp.frequency.exponentialRampToValueAtTime(340, t + dur);

      const g = this.ctx.createGain();
      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(1.0, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      lp.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      midiNotes.forEach((m, idx) => {
        const osc = this.ctx.createOscillator();
        const ng = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(mtof(m), t);
        osc.detune.value = (idx % 2 === 0 ? -7 : 7);
        ng.gain.value = perVol;
        osc.connect(ng);
        ng.connect(lp);
        osc.start(t);
        osc.stop(t + dur + 0.03);
      });
    }

    synthPhonkCowbell(t, freq, dur, vol) {
      // Iconic TR-808 Drift Phonk pitched metallic cowbell (dual square + bandpass + warm overdrive)
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const bp = this.ctx.createBiquadFilter();
      const shaper = this.makeDistortion(28);
      const g = this.ctx.createGain();

      osc1.type = 'square';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(freq, t);
      osc2.frequency.setValueAtTime(freq * 1.498, t);

      bp.type = 'bandpass';
      bp.frequency.setValueAtTime(freq * 1.15, t);
      bp.Q.value = 2.8;

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.004);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc1.connect(bp);
      osc2.connect(bp);
      bp.connect(shaper);
      shaper.connect(g);
      g.connect(this.compressor);
      g.connect(this.delayNode);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + dur + 0.02);
      osc2.stop(t + dur + 0.02);
    }

    synthPhonk808(t, freq, dur, vol, slideToFreq) {
      // Massive clipped Drift Phonk 808 bass with optional pitch glide
      const osc = this.ctx.createOscillator();
      const shaper = this.makeDistortion(55);
      const lp = this.ctx.createBiquadFilter();
      const g = this.ctx.createGain();

      osc.type = 'sine';
      const safeFreq = Math.max(28, freq);
      osc.frequency.setValueAtTime(safeFreq * 1.35, t);
      osc.frequency.exponentialRampToValueAtTime(safeFreq, t + 0.035);
      if (slideToFreq) {
        osc.frequency.exponentialRampToValueAtTime(Math.max(28, slideToFreq), t + dur * 0.85);
      }

      lp.type = 'lowpass';
      lp.frequency.setValueAtTime(420, t);

      g.gain.setValueAtTime(0.001, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.01);
      g.gain.setValueAtTime(vol * 0.88, t + dur * 0.65);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);

      osc.connect(shaper);
      shaper.connect(lp);
      lp.connect(g);
      g.connect(this.compressor);

      osc.start(t);
      osc.stop(t + dur + 0.03);
    }

    makeDistortion(amount) {
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2) / 256 - 1;
        curve[i] = ((3 + amount) * x * 20 * (Math.PI / 180)) / (Math.PI + amount * Math.abs(x));
      }
      const ws = this.ctx.createWaveShaper();
      ws.curve = curve;
      ws.oversample = '2x';
      return ws;
    }

    /* ----------------------------------------------------------------------
       Recording Support (Exports .webm audio of your live mix)
       ---------------------------------------------------------------------- */
    toggleRecording(onFinished) {
      this.init();
      if (!this.mediaDest || typeof MediaRecorder === 'undefined') {
        return { supported: false, recording: false };
      }

      if (!this.isRecording) {
        this.recordedChunks = [];
        try {
          this.mediaRecorder = new MediaRecorder(this.mediaDest.stream);
        } catch (err) {
          return { supported: false, recording: false };
        }
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.recordedChunks, { type: 'audio/webm' });
          if (onFinished) onFinished(blob);
        };
        this.mediaRecorder.start();
        this.isRecording = true;
        return { supported: true, recording: true };
      } else {
        this.mediaRecorder.stop();
        this.isRecording = false;
        return { supported: true, recording: false };
      }
    }

    getFrequencyData(targetArray) {
      if (!this.analyser) return false;
      this.analyser.getByteFrequencyData(targetArray);
      return true;
    }
  }

  global.SprunkiAudioEngine = SprunkiAudioEngine;
})(window);
