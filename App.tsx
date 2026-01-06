import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { INSTRUMENTS, SCALES } from './constants';
import { downloadBlob, exportMidi } from './services/midiExport';
import { 
  Mic, Square, Volume2, PlayCircle, Download, Settings, AlertCircle, Zap 
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS?.[0]?.id || '');
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [octaveShift, setOctaveShift] = useState(0);
  const [sensitivity, setSensitivity] = useState(0.015);
  const [autotune, setAutotune] = useState(true);
  const [selectedScaleIdx, setSelectedScaleIdx] = useState(0);
  const [loadingInstrumentId, setLoadingInstrumentId] = useState<string | null>(null);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    const engine = new AudioEngine((midi) => setActiveMidi(midi));
    audioEngineRef.current = engine;
    return () => {
      audioEngineRef.current?.stopMic();
    };
  }, []);

  const initializeApp = async () => {
    if (!audioEngineRef.current) return;
    setError(null);
    setLoadingInstrumentId(selectedInstrument);
    try {
      await audioEngineRef.current.initAudio();
      const success = await audioEngineRef.current.loadInstrument(selectedInstrument);
      if (success) {
        setIsEngineInitialized(true);
        audioEngineRef.current.setAutotune(autotune);
        audioEngineRef.current.setScale(SCALES[selectedScaleIdx].intervals);
      } else {
        setError("Errore caricamento strumento.");
      }
    } catch (e) {
      setError("Permesso microfono negato o errore audio.");
    }
    setLoadingInstrumentId(null);
  };

  const handleStartLive = async () => {
    if (!isEngineInitialized) await initializeApp();
    try {
      await audioEngineRef.current?.startMic('live');
      setAppState('live');
    } catch (e) {
      setError("Impossibile avviare il microfono.");
    }
  };

  const handleStartRecording = async () => {
    if (!isEngineInitialized) await initializeApp();
    try {
      await audioEngineRef.current?.startMic('recording');
      setAppState('recording');
    } catch (e) {
      setError("Impossibile avviare la registrazione.");
    }
  };

  const handleStop = () => {
    audioEngineRef.current?.stopMic();
    setAppState('idle');
  };

  const handleInstrumentSelect = async (id: string) => {
    setSelectedInstrument(id);
    if (isEngineInitialized && audioEngineRef.current) {
      setLoadingInstrumentId(id);
      await audioEngineRef.current.loadInstrument(id);
      setLoadingInstrumentId(null);
    }
  };

  const handleExport = () => {
    if (!audioEngineRef.current) return;
    const sequence = audioEngineRef.current.getSequence();
    if (sequence.length === 0) {
      alert("Nessuna nota registrata!");
      return;
    }
    const inst = INSTRUMENTS.find(i => i.id === selectedInstrument);
    const blob = exportMidi(sequence, inst?.midiProgram || 0);
    downloadBlob(blob, `VocalSynth_${inst?.name}_${Date.now()}.mid`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050507] text-white">
      <Header onGeneratePromo={() => alert("Analisi Cinema in corso...")} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 space-y-12">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <Visualizer 
              // PROTEZIONE CONTRO IL CRASH:
              analyser={audioEngineRef.current && typeof audioEngineRef.current.getAnalyser === 'function' 
                ? audioEngineRef.current.getAnalyser() 
                : null} 
              isActive={appState !== 'idle'} 
              activeColor="text-purple-500"
            />
            
            <MidiKeyboard 
              activeMidi={activeMidi} 
              activeColor="text-purple-500"
            />
          </div>

          <div className="glass p-8 rounded-[3rem] border border-white/5 space-y-8 h-fit bg-white/5 shadow-2xl">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Control Center</h3>

            <div className="space-y-6">
              {/* Sensitivity */}
              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase text-white/40">Pitch Sensitivity</label>
                <input 
                  type="range" min="0.005" max="0.05" step="0.001" 
                  value={sensitivity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSensitivity(v);
                    audioEngineRef.current?.setSensitivity(v);
                  }}
                  className="w-full h-1 bg-white/10 rounded-full appearance-none accent-purple-500" 
                />
              </div>

              {/* Octave */}
              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase text-white/40">Octave Shift</label>
                <div className="flex gap-2">
                  {[-2, -1, 0, 1, 2].map(o => (
                    <button key={o} onClick={() => { setOctaveShift(o); audioEngineRef.current?.setOctaveShift(o); }}
                      className={`flex-1 py-2 rounded-xl text-[10px] border ${octaveShift === o ? 'bg-purple-600 border-purple-500' : 'bg-white/5 border-white/5'}`}>
                      {o > 0 ? `+${o}` : o}
                    </button>
                  ))}
                </div>
              </div>

              {/* Autotune */}
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                <span className="text-[10px] font-black uppercase">Auto-Tune</span>
                <button onClick={() => { setAutotune(!autotune); audioEngineRef.current?.setAutotune(!autotune); }}
                  className={`w-10 h-5 rounded-full relative transition-colors ${autotune ? 'bg-purple-600' : 'bg-zinc-800'}`}>
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autotune ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              {appState === 'idle' ? (
                <div className="flex gap-3">
                  <button onClick={handleStartLive} className="flex-1 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px]">Live</button>
                  <button onClick={handleStartRecording} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black uppercase text-[10px]">Record</button>
                </div>
              ) : (
                <button onClick={handleStop} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black uppercase text-[10px] animate-pulse">Stop</button>
              )}
            </div>
          </div>
        </div>

        <InstrumentGrid selectedId={selectedInstrument} onSelect={handleInstrumentSelect} isLoading={loadingInstrumentId !== null} />
      </main>
    </div>
  );
};

export default App;
