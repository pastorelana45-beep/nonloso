// services/audioEngine.ts
import { SCALES, INSTRUMENTS } from '../constants';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  private onMidiNote: (midi: number | null) => void;
  private sequence: { midi: number, time: number }[] = [];
  
  private isRunning: boolean = false;
  private currentScale: number[] = SCALES[0].intervals;
  private currentInstrumentType: OscillatorType = 'sawtooth';

  constructor(onMidiNote: (midi: number | null) => void) {
    this.onMidiNote = onMidiNote;
    // Inizializziamo l'analyser immediatamente per evitare l'errore undefined
    if (typeof window !== 'undefined') {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
    }
  }

  // Questa è la funzione che la console diceva mancare
  public getAnalyser(): AnalyserNode | null {
    return this.analyser;
  }

  public getSequence() {
    return this.sequence;
  }

  async startMic(mode: 'live' | 'recording') {
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
    
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.microphone = this.audioContext!.createMediaStreamSource(stream);
    
    this.gainNode = this.audioContext!.createGain();
    this.gainNode.connect(this.audioContext!.destination);
    
    this.microphone.connect(this.analyser!);
    
    this.isRunning = true;
    if (mode === 'recording') this.sequence = [];

    this.oscillator = this.audioContext!.createOscillator();
    this.oscillator.type = this.currentInstrumentType;
    this.oscillator.connect(this.gainNode);
    this.oscillator.start();
    
    this.runDetection(mode);
  }

  private runDetection(mode: 'live' | 'recording') {
    const buffer = new Float32Array(this.analyser!.fftSize);
    const detect = () => {
      if (!this.isRunning) return;
      this.analyser!.getFloatTimeDomainData(buffer);
      
      // Pitch detection semplificata per test
      const freq = this.simpleDetect(buffer, this.audioContext!.sampleRate);
      if (freq > 0) {
        const midi = Math.round(12 * Math.log2(freq / 440) + 69);
        const targetFreq = 440 * Math.pow(2, (midi - 69) / 12);
        
        this.oscillator!.frequency.setTargetAtTime(targetFreq, this.audioContext!.currentTime, 0.05);
        this.gainNode!.gain.setTargetAtTime(mode === 'live' ? 0.3 : 0, this.audioContext!.currentTime, 0.05);
        
        this.onMidiNote(midi);
        if (mode === 'recording') this.sequence.push({ midi, time: this.audioContext!.currentTime });
      } else {
        this.gainNode!.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.1);
        this.onMidiNote(null);
      }
      requestAnimationFrame(detect);
    };
    detect();
  }

  private simpleDetect(buf: Float32Array, sampleRate: number): number {
    // Algoritmo base di zero-crossing per test rapido
    let lastPos = 0;
    let crossCount = 0;
    for (let i = 0; i < buf.length; i++) {
      if (buf[i] > 0 && lastPos <= 0) crossCount++;
      lastPos = buf[i];
    }
    return crossCount > 0 ? (crossCount * sampleRate) / buf.length : -1;
  }

  stopMic() {
    this.isRunning = false;
    this.oscillator?.stop();
    this.microphone?.disconnect();
    this.onMidiNote(null);
  }

  previewSequence(onProgress: (p: number) => void) {
    if (this.sequence.length === 0) return;
    const startTime = this.sequence[0].time;
    const duration = this.sequence[this.sequence.length - 1].time - startTime;

    this.sequence.forEach((n, i) => {
      const delay = (n.time - startTime) * 1000;
      setTimeout(() => {
        onProgress(((n.time - startTime) / duration) * 100);
        this.onMidiNote(n.midi);
        if (i === this.sequence.length - 1) onProgress(0);
      }, delay);
    });
  }
}
