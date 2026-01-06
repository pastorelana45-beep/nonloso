import { SCALES } from '../constants';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  private onMidiNote: (midi: number | null) => void;
  private sequence: { midi: number, time: number }[] = [];
  private isRunning: boolean = false;
  private currentInstrumentType: OscillatorType = 'sawtooth';

  constructor(onMidiNote: (midi: number | null) => void) {
    this.onMidiNote = onMidiNote;
    // Inizializzazione sicura
    if (typeof window !== 'undefined') {
      const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass();
      this.analyser = this.audioContext.createAnalyser();
    }
  }

  // Questa funzione DEVE esistere per il Visualizer
  public getAnalyser() {
    return this.analyser;
  }

  public getSequence() {
    return this.sequence;
  }

  async startMic(mode: 'live' | 'recording') {
    if (this.audioContext?.state === 'suspended') await this.audioContext.resume();
    
    try {
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
      
      this.loopDetection(mode);
    } catch (e) {
      console.error("Errore microfono:", e);
    }
  }

  private loopDetection(mode: 'live' | 'recording') {
    const buffer = new Float32Array(this.analyser!.fftSize);
    const action = () => {
      if (!this.isRunning) return;
      this.analyser!.getFloatTimeDomainData(buffer);
      
      // Pitch detection super semplificata per evitare errori
      let max = 0;
      for(let i=0; i<buffer.length; i++) if(buffer[i] > max) max = buffer[i];
      
      if (max > 0.1) { // Se c'è suono
        const midi = 60; // Nota fissa C4 per test
        this.oscillator!.frequency.setTargetAtTime(261.63, this.audioContext!.currentTime, 0.05);
        this.gainNode!.gain.setTargetAtTime(mode === 'live' ? 0.3 : 0, this.audioContext!.currentTime, 0.05);
        this.onMidiNote(midi);
        if (mode === 'recording') this.sequence.push({ midi, time: this.audioContext!.currentTime });
      } else {
        this.gainNode!.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.1);
        this.onMidiNote(null);
      }
      requestAnimationFrame(action);
    };
    action();
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
        if (i === this.sequence.length - 1) setTimeout(() => onProgress(0), 200);
      }, delay);
    });
  }
}
