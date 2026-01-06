
import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header.tsx';
import { Visualizer } from './components/Visualizer.tsx';
import { InstrumentGrid } from './components/InstrumentGrid.tsx';
import { MidiKeyboard } from './components/MidiKeyboard.tsx';
import { AudioEngine } from './services/audioEngine.ts';
import { INSTRUMENTS, SCALES } from './constants.ts';
import { downloadBlob, exportMidi } from './services/midiExport.ts';
import { 
  Mic, Square, Volume2, PlayCircle, Download, Settings, AlertCircle, Zap
} from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
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
    return () => audioEngineRef.current?.stopMic();
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
    if (!audioEngineRef.current) return;
    try {
      await audioEngineRef.current.startMic('live');
      setAppState('live');
    } catch (e) {
      setError("Impossibile avviare il microfono.");
    }
  };

  const handleStartRecording = async () => {
    if (!isEngineInitialized) await initializeApp();
    if (!audioEngineRef.current) return;
    try {
      await audioEngineRef.current.startMic('recording');
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

  const handleGenerateCinema = () => {
    // Cinema engine mock - feature always unlocked
    alert("Analisi Cinema in corso... (Feature sbloccata per tutti)");
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#050507]">
      <Header onGeneratePromo={handleGenerateCinema} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 space-y-12">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold uppercase tracking-widest animate-pulse">
            <AlertCircle className="w-5 h-5" /> {error}
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-12">
          <div className="xl:col-span-2 space-y-8">
            <Visualizer 
              analyser={audioEngineRef.current?.getAnalyser() || null} 
              isActive={appState !== 'idle'} 
              activeColor="text-purple-500"
            />
            
            <MidiKeyboard 
              activeMidi={activeMidi} 
              activeColor="text-purple-500"
            />
          </div>

          <div className="glass p-8 rounded-[3rem] border-white/5 space-y-8 h-fit sticky top-32 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">Control Center</h3>
              <Settings className="w-4 h-4 text-white/10" />
            </div>

            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Pitch Sensitivity</label>
                  <span className="text-[10px] font-mono text-purple-400">{(sensitivity * 1000).toFixed(0)}ms</span>
                </div>
                <input 
                  type="range" min="0.005" max="0.05" step="0.001" 
                  value={sensitivity}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setSensitivity(v);
                    audioEngineRef.current?.setSensitivity(v);
                  }}
                  className="w-full h-1 bg-white/5 rounded-full appearance-none cursor-pointer accent-purple-500" 
                />
              </div>

              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Octave Shift</label>
                <div className="flex gap-2">
                  {[-2, -1, 0, 1, 2].map(o => (
                    <button 
                      key={o}
                      onClick={() => {
                        setOctaveShift(o);
                        audioEngineRef.current?.setOctaveShift(o);
                      }}
                      className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all border ${
                        octaveShift === o ? 'bg-purple-600 border-purple-500 text-white' : 'bg-white/5 border-white/5 text-white/40'
                      }`}
                    >
                      {o > 0 ? `+${o}` : o}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <Zap className={`w-4 h-4 ${autotune ? 'text-purple-400' : 'text-white/20'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Auto-Tune</span>
                </div>
                <button 
                  onClick={() => {
                    setAutotune(!autotune);
                    audioEngineRef.current?.setAutotune(!autotune);
                  }}
                  className={`w-10 h-5 rounded-full transition-all relative ${autotune ? 'bg-purple-600' : 'bg-zinc-800'}`}
                >
                  <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${autotune ? 'right-1' : 'left-1'}`} />
                </button>
              </div>

              <div className="space-y-3">
                <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Musical Scale</label>
                <select 
                  value={selectedScaleIdx}
                  onChange={(e) => {
                    const idx = parseInt(e.target.value);
                    setSelectedScaleIdx(idx);
                    audioEngineRef.current?.setScale(SCALES[idx].intervals);
                  }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest text-white/60 focus:outline-none focus:border-purple-500"
                >
                  {SCALES.map((s, i) => <option key={i} value={i}>{s.name}</option>)}
                </select>
              </div>
            </div>

            <div className="pt-4 space-y-3">
              {appState === 'idle' ? (
                <div className="flex gap-3">
                  <button 
                    onClick={handleStartLive}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 hover:text-white transition-all active:scale-95 shadow-xl"
                  >
                    <Volume2 className="w-4 h-4" /> Live
                  </button>
                  <button 
                    onClick={handleStartRecording}
                    className="flex-1 flex items-center justify-center gap-2 py-4 bg-purple-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-500 transition-all active:scale-95 shadow-xl shadow-purple-900/20"
                  >
                    <Mic className="w-4 h-4" /> Record
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleStop}
                  className="w-full flex items-center justify-center gap-2 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest animate-pulse transition-all active:scale-95"
                >
                  <Square className="w-4 h-4" /> Stop
                </button>
              )}

              {appState === 'idle' && audioEngineRef.current?.getSequence().length > 0 && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => audioEngineRef.current?.previewSequence()}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-white/10 transition-all"
                  >
                    <PlayCircle className="w-3 h-3" /> Play
                  </button>
                  <button 
                    onClick={handleExport}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest text-emerald-400 hover:bg-emerald-500/20 transition-all"
                  >
                    <Download className="w-3 h-3" /> Export
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        <InstrumentGrid 
          selectedId={selectedInstrument} 
          onSelect={handleInstrumentSelect}
          isLoading={loadingInstrumentId !== null}
        />
      </main>

      <footer className="py-12 px-8 border-t border-white/5 text-center opacity-20">
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">VocalSynth Pro © 2025 • AI-Powered Studio</p>
      </footer>
    </div>
  );
};

export default App;
