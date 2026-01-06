// 1. Import delle costanti (per scale e intervalli)
import { SCALES, INSTRUMENTS } from '../constants';

// 2. Definizione del tipo per la sequenza di note (opzionale ma consigliato)
interface MidiEvent {
  midi: number;
  time: number;
}

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  private onMidiNote: (midi: number | null) => void;
  private sequence: MidiEvent[] = [];
  
  private isAutotune: boolean = true;
  private currentScale: number[] = SCALES[0].intervals;
  private octaveShift: number = 0;
  private sensitivity: number = 0.015;
  private isRunning: boolean = false;

  constructor(onMidiNote: (midi: number | null) => void) {
    this.onMidiNote = onMidiNote;
  }

  // Inizializza il contesto audio solo dopo un'interazione utente
  async initAudio() {
    if (this.audioContext) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;

    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0;
    this.gainNode.connect(this.audioContext.destination);
  }

  getAnalyser() {
    return this.analyser;
  }

  async loadInstrument(id: string) {
    const inst = INSTRUMENTS.find(i => i.id === id);
    console.log("Strumento caricato:", inst?.name);
    return true;
  }

  async startMic(mode: 'live' | 'recording') {
    if (!this.audioContext) await this.initAudio();
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.microphone = this.audioContext!.createMediaStreamSource(stream);
      this.microphone.connect(this.analyser!);
      
      this.isRunning = true;
      this.startPitchDetection();
      
      this.oscillator = this.audioContext!.createOscillator();
      this.oscillator.type = 'sawtooth';
      this.oscillator.connect(this.gainNode!);
      this.oscillator.start();
    } catch (err) {
      console.error("Accesso negato al microfono", err);
      throw err;
    }
  }

  private startPitchDetection() {
    const buffer = new Float32Array(this.analyser!.fftSize);
    const detect = () => {
      if (!this.isRunning || !this.analyser || !this.audioContext) return;
      
      this.analyser.getFloatTimeDomainData(buffer);
      const frequency = this.autoCorrelate(buffer, this.audioContext.sampleRate);

      if (frequency !== -1) {
        let midi = 12 * Math.log2(frequency / 440) + 69;
        if (this.isAutotune) midi = this.snapToScale(midi);
        midi += (this.octaveShift * 12);
        
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        this.oscillator?.frequency.setTargetAtTime(freq, this.audioContext.currentTime, 0.05);
        this.gainNode?.gain.setTargetAtTime(0.3, this.audioContext.currentTime, 0.05);
        
        this.onMidiNote(Math.round(midi));
        this.sequence.push({ midi: Math.round(midi), time: this.audioContext.currentTime });
      } else {
        this.gainNode?.gain.setTargetAtTime(0, this.audioContext.currentTime, 0.1);
        this.onMidiNote(null);
      }
      requestAnimationFrame(detect);
    };
    detect();
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number) {
    let SIZE = buf.length;
    let rms = 0;
    for (let i = 0; i < SIZE; i++) rms += buf[i] * buf[i];
    rms = Math.sqrt(rms / SIZE);
    if (rms < this.sensitivity) return -1;

    let r1 = 0, r2 = SIZE - 1, thres = 0.2;
    for (let i = 0; i < SIZE / 2; i++) if (Math.abs(buf[i]) < thres) { r1 = i; break; }
    for (let i = 1; i < SIZE / 2; i++) if (Math.abs(buf[SIZE - i]) < thres) { r2 = SIZE - i; break; }
    buf = buf.slice(r1, r2);
    SIZE = buf.length;

    let c = new Array(SIZE).fill(0);
    for (let i = 0; i < SIZE; i++)
      for (let j = 0; j < SIZE - i; j++)
        c[i] = c[i] + buf[j] * buf[j + i];

    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < SIZE; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    return sampleRate / maxpos;
  }

  private snapToScale(midi: number): number {
    const note = Math.round(midi) % 12;
    const octave = Math.floor(Math.round(midi) / 12);
    let closest = this.currentScale[0];
    let minDiff = Math.abs(note - closest);
    for (const interval of this.currentScale) {
      if (Math.abs(note - interval) < minDiff) {
        minDiff = Math.abs(note - interval);
        closest = interval;
      }
    }
    return (octave * 12) + closest;
  }

  stopMic() {
    this.isRunning = false;
    this.oscillator?.stop();
    this.oscillator?.disconnect();
    this.microphone?.disconnect();
    if (this.gainNode) this.gainNode.gain.value = 0;
    this.onMidiNote(null);
  }

  setAutotune(enabled: boolean) { this.isAutotune = enabled; }
  setScale(intervals: number[]) { this.currentScale = intervals; }
  setSensitivity(val: number) { this.sensitivity = val; }
  setOctaveShift(val: number) { this.octaveShift = val; }
  getSequence() { return this.sequence; }
  previewSequence() { console.log("Riproduzione non implementata"); }
}
