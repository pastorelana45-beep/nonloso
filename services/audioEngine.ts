// Correzione: rimosso .ts e assicurati che il nome file sia identico (case-sensitive)
import { detectPitch, midiToNoteName } from './pitchDetection'; 
import { RecordedNote } from '../types';

export class AudioEngine {
  public audioCtx: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private instrumentCache: Map<string, any> = new Map();
  private currentInstrument: any = null;
  
  private isProcessing = false;
  private mode: 'live' | 'recording' | 'idle' = 'idle';
  private sequence: RecordedNote[] = [];
  private recordingStart: number = 0;
  
  private lastStableMidi: number | null = null;
  private candidateMidi: number | null = null;
  private candidateFrames: number = 0;
  private readonly STABILITY_THRESHOLD = 2; 
  private readonly MIN_NOTE_TIME = 0.05; 
  private lastNoteStartTime: number = 0;

  private activeLiveNote: any = null;
  private octaveShift: number = 0;
  private sensitivity: number = 0.015;
  
  // Pitch Core Settings
  private autotuneEnabled: boolean = true;
  private selectedScaleIntervals: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]; // Cromatica default

  private onNoteUpdate: (note: number | null, name: string | null) => void;

  constructor(onNoteUpdate: (note: number | null, name: string | null) => void) {
    this.onNoteUpdate = onNoteUpdate;
  }

  setOctaveShift(shift: number) { this.octaveShift = shift; }
  setSensitivity(val: number) { this.sensitivity = val; }
  setAutotune(enabled: boolean) { this.autotuneEnabled = enabled; }
  setScale(intervals: number[]) { this.selectedScaleIntervals = intervals; }

  public async initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ 
        sampleRate: 44100,
        latencyHint: 'interactive'
      });
      this.analyser = this.audioCtx.createAnalyser();
      this.analyser.fftSize = 2048;
    }
    if (this.audioCtx.state === 'suspended') {
      await this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  async loadInstrument(instrumentId: string): Promise<boolean> {
    await this.initAudio();
    
    if (this.instrumentCache.has(instrumentId)) {
      this.currentInstrument = this.instrumentCache.get(instrumentId);
      return true;
    }

    const Soundfont = (window as any).Soundfont;
    if (!Soundfont) return false;

    try {
      const inst = await Soundfont.instrument(this.audioCtx!, instrumentId, { 
        soundfont: 'FluidR3_GM',
        format: 'mp3',
        gain: 2.5,
        nameToUrl: (name: string, sf: string) => `https://gleitz.github.io/midi-js-soundfonts/${sf}/${name}-mp3.js`
      });
      
      this.instrumentCache.set(instrumentId, inst);
      this.currentInstrument = inst;
      return true;
    } catch (e) {
      console.warn(`Errore caricamento strumento ${instrumentId}:`, e);
      return false;
    }
  }

  async startMic(mode: 'live' | 'recording') {
    const ctx = await this.initAudio();
    this.mode = mode;
    this.lastStableMidi = null;
    this.candidateMidi = null;
    this.candidateFrames = 0;
    if (mode === 'recording') this.sequence = [];
    
    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({ 
        audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } 
      });
      this.source = ctx.createMediaStreamSource(this.micStream);
      this.source.connect(this.analyser!);
      
      this.recordingStart = ctx.currentTime;
      this.isProcessing = true;
      this.process();
    } catch (e) {
      this.mode = 'idle';
      throw e;
    }
  }

  stopMic() {
    this.isProcessing = false;
    this.mode = 'idle';
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    this.stopActiveNote();
    this.onNoteUpdate(null, null);
  }

  private stopActiveNote() {
    if (this.activeLiveNote) {
      try { 
        this.activeLiveNote.stop(this.audioCtx!.currentTime + 0.05); 
      } catch(e) {}
      this.activeLiveNote = null;
    }
  }

  previewSequence() {
    if (!this.currentInstrument || this.sequence.length === 0 || !this.audioCtx) return;
    const now = this.audioCtx.currentTime;
    this.sequence.forEach(note => {
      this.currentInstrument.play(note.midi, now + note.startTime, { 
        duration: note.duration, 
        gain: 0.8 
      });
    });
  }

  private process = () => {
    if (!this.isProcessing || !this.analyser || !this.audioCtx) return;
    
    const buf = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buf);
    
    const { pitch, clarity } = detectPitch(buf, this.audioCtx.sampleRate);
    
    let sum = 0;
    for (let i = 0; i < buf.length; i++) sum += buf[i] * buf[i];
    const volume = Math.sqrt(sum / buf.length);

    if (pitch > 0 && clarity > 0.8 && volume > this.sensitivity) {
      let rawMidi = Math.round(12 * Math.log2(pitch / 440) + 69) + (this.octaveShift * 12);
      let midi = rawMidi;

      if (this.autotuneEnabled) {
        midi = this.snapToScale(rawMidi);
      }

      midi = Math.max(0, Math.min(127, midi));

      if (midi !== this.lastStableMidi) {
        if (midi === this.candidateMidi) {
          this.candidateFrames++;
        } else {
          this.candidateMidi = midi;
          this.candidateFrames = 0;
        }

        const timeSinceLastNote = this.audioCtx.currentTime - this.lastNoteStartTime;
        if (this.candidateFrames >= this.STABILITY_THRESHOLD && timeSinceLastNote >= this.MIN_NOTE_TIME) {
          this.triggerNote(midi);
          this.lastStableMidi = midi;
          this.onNoteUpdate(midi, midiToNoteName(midi));
          this.lastNoteStartTime = this.audioCtx.currentTime;
        }
      }
    } else {
      if (this.lastStableMidi !== null) {
        this.stopActiveNote();
        if (this.mode === 'recording' && this.sequence.length > 0) {
           const last = this.sequence[this.sequence.length - 1];
           last.duration = (this.audioCtx.currentTime - this.recordingStart) - last.startTime;
        }
        this.lastStableMidi = null;
        this.onNoteUpdate(null, null);
      }
    }
    
    if (this.isProcessing) requestAnimationFrame(this.process);
  }

  private snapToScale(midi: number): number {
    const octave = Math.floor(midi / 12);
    const noteInOctave = midi % 12;
    
    let closest = this.selectedScaleIntervals[0];
    let minDiff = 12;

    for (const interval of this.selectedScaleIntervals) {
      const diff = Math.abs(interval - noteInOctave);
      if (diff < minDiff) {
        minDiff = diff;
        closest = interval;
      }
    }
    
    return (octave * 12) + closest;
  }

  private triggerNote(midi: number) {
    if (this.currentInstrument && this.audioCtx) {
      if (this.mode === 'live') {
        const prev = this.activeLiveNote;
        this.activeLiveNote = this.currentInstrument.play(midi, this.audioCtx.currentTime, { gain: 1.0 });
        if (prev) prev.stop(this.audioCtx.currentTime + 0.02);
      }

      if (this.mode === 'recording') {
        if (this.sequence.length > 0) {
           const last = this.sequence[this.sequence.length - 1];
           last.duration = (this.audioCtx.currentTime - this.recordingStart) - last.startTime;
        }
        this.sequence.push({ 
          midi, 
          startTime: this.audioCtx.currentTime - this.recordingStart, 
          duration: 0.2,
          pitchTrajectory: [] 
        });
      }
    }
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }
}
