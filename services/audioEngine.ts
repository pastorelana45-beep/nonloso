import { SCALES } from '../constants';

export class AudioEngine {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private oscillator: OscillatorNode | null = null;
  private gainNode: GainNode | null = null;
  
  private onMidiNote: (midi: number | null) => void;
  private sequence: { midi: number, time: number }[] = [];
  
  private isAutotune: boolean = true;
  private currentScale: number[] = SCALES[0].intervals;
  private octaveShift: number = 0;
  private sensitivity: number = 0.015;
  private isRunning: boolean = false;

  constructor(onMidiNote: (midi: number | null) => void) {
    this.onMidiNote = onMidiNote;
  }

  async initAudio() {
    if (this.audioContext) return;
    const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    this.analyser = this.audioContext.createAnalyser();
    this.gainNode = this.audioContext.createGain();
    this.gainNode.connect(this.audioContext.destination);
  }

  getAnalyser() { return this.analyser; }
  getSequence() { return this.sequence; }

  async startMic(mode: 'live' | 'recording') {
    if (!this.audioContext) await this.initAudio();
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.microphone = this.audioContext!.createMediaStreamSource(stream);
    this.microphone.connect(this.analyser!);
    
    this.isRunning = true;
    this.sequence = []; // Reset sequenza per nuova registrazione
    
    this.oscillator = this.audioContext!.createOscillator();
    this.oscillator.type = 'sawtooth';
    this.oscillator.connect(this.gainNode!);
    this.oscillator.start();
    
    this.startPitchDetection(mode);
  }

  private startPitchDetection(mode: 'live' | 'recording') {
    const buffer = new Float32Array(this.analyser!.fftSize);
    const detect = () => {
      if (!this.isRunning) return;
      this.analyser!.getFloatTimeDomainData(buffer);
      const frequency = this.autoCorrelate(buffer, this.audioContext!.sampleRate);

      if (frequency !== -1) {
        let midi = 12 * Math.log2(frequency / 440) + 69;
        if (this.isAutotune) midi = this.snapToScale(midi);
        midi += (this.octaveShift * 12);
        
        const freq = 440 * Math.pow(2, (midi - 69) / 12);
        this.oscillator!.frequency.setTargetAtTime(freq, this.audioContext!.currentTime, 0.05);

        // LIVE: senti audio | RECORDING: silenzio (gain 0)
        const targetGain = mode === 'live' ? 0.3 : 0;
        this.gainNode!.gain.setTargetAtTime(targetGain, this.audioContext!.currentTime, 0.05);

        this.onMidiNote(Math.round(midi));
        this.sequence.push({ midi: Math.round(midi), time: this.audioContext!.currentTime });
      } else {
        this.gainNode!.gain.setTargetAtTime(0, this.audioContext!.currentTime, 0.1);
        this.onMidiNote(null);
      }
      requestAnimationFrame(detect);
    };
    detect();
  }

  previewSequence(onProgress: (percent: number) => void) {
    if (this.sequence.length === 0) return;
    const now = this.audioContext!.currentTime;
    const startRecTime = this.sequence[0].time;
    const duration = this.sequence[this.sequence.length - 1].time - startRecTime;

    this.sequence.forEach((note, index) => {
      const offset = note.time - startRecTime;
      const playTime = now + offset;
      
      const osc = this.audioContext!.createOscillator();
      const g = this.audioContext!.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440 * Math.pow(2, (note.midi - 69) / 12), playTime);
      
      osc.connect(g);
      g.connect(this.audioContext!.destination);
      
      g.gain.setValueAtTime(0, playTime);
      g.gain.linearRampToValueAtTime(0.2, playTime + 0.02);
      g.gain.linearRampToValueAtTime(0, playTime + 0.1);
      
      osc.start(playTime);
      osc.stop(playTime + 0.12);

      // Aggiorna barra progresso
      setTimeout(() => {
        onProgress((offset / duration) * 100);
        this.onMidiNote(note.midi); // Illumina tastiera durante play
        if (index === this.sequence.length - 1) {
            setTimeout(() => { onProgress(0); this.onMidiNote(null); }, 200);
        }
      }, offset * 1000);
    });
  }

  private autoCorrelate(buf: Float32Array, sampleRate: number) {
    let rms = 0;
    for (let i = 0; i < buf.length; i++) rms += buf[i] * buf[i];
    if (Math.sqrt(rms / buf.length) < this.sensitivity) return -1;
    // ... (resto dell'algoritmo autoCorrelate come prima)
    let c = new Array(buf.length).fill(0);
    for (let i = 0; i < buf.length; i++)
      for (let j = 0; j < buf.length - i; j++)
        c[i] = c[i] + buf[j] * buf[j + i];
    let d = 0; while (c[d] > c[d + 1]) d++;
    let maxval = -1, maxpos = -1;
    for (let i = d; i < buf.length; i++) if (c[i] > maxval) { maxval = c[i]; maxpos = i; }
    return sampleRate / maxpos;
  }

  private snapToScale(midi: number): number {
    const note = Math.round(midi) % 12;
    const octave = Math.floor(Math.round(midi) / 12);
    let closest = this.currentScale[0];
    let minDiff = Math.abs(note - closest);
    for (const interval of this.currentScale) {
      if (Math.abs(note - interval) < minDiff) { minDiff = Math.abs(note - interval); closest = interval; }
    }
    return (octave * 12) + closest;
  }

  stopMic() {
    this.isRunning = false;
    this.oscillator?.stop();
    this.microphone?.disconnect();
    this.gainNode!.gain.value = 0;
    this.onMidiNote(null);
  }

  setAutotune(e: boolean) { this.isAutotune = e; }
  setScale(s: number[]) { this.currentScale = s; }
  setSensitivity(v: number) { this.sensitivity = v; }
  setOctaveShift(v: number) { this.octaveShift = v; }
}
