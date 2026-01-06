import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { INSTRUMENTS, SCALES } from './constants';
import { Play, Square, Mic, Volume2, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [selectedInstrument, setSelectedInstrument] = useState(INSTRUMENTS[0].id);
  
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine((midi) => setActiveMidi(midi));
  }, []);

  const handleStartLive = async () => {
    await audioEngineRef.current?.startMic('live');
    setAppState('live');
  };

  const handleStartRecording = async () => {
    await audioEngineRef.current?.startMic('recording');
    setAppState('recording');
  };

  const handleStop = () => {
    audioEngineRef.current?.stopMic();
    setAppState('idle');
  };

  const handlePlay = () => {
    audioEngineRef.current?.previewSequence((progress) => {
      setPlaybackProgress(progress);
    });
  };

  const onInstrumentChange = async (id: string) => {
    setSelectedInstrument(id);
    await audioEngineRef.current?.loadInstrument(id);
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col font-sans">
      <Header onGeneratePromo={() => {}} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 lg:p-12 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          
          <div className="lg:col-span-2 space-y-8">
            <Visualizer 
              analyser={audioEngineRef.current?.getAnalyser() || null} 
              isActive={appState !== 'idle'} 
            />
            <MidiKeyboard activeMidi={activeMidi} activeColor="text-purple-500" />
          </div>

          <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem] space-y-8 h-fit backdrop-blur-md">
            <div className="flex items-center justify-between">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-400">Control Panel</h3>
              {appState === 'recording' && <div className="flex items-center gap-2 text-red-500 text-[10px] font-bold animate-pulse"><Activity size={12}/> REC</div>}
            </div>

            {/* BARRA DI PROGRESSO */}
            {playbackProgress > 0 && (
              <div className="space-y-2">
                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-500 transition-all duration-100 ease-linear" 
                    style={{ width: `${playbackProgress}%` }}
                  />
                </div>
              </div>
            )}

            <div className="space-y-4">
              {appState === 'idle' ? (
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <button onClick={handleStartLive} className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[11px] uppercase hover:scale-[1.02] transition-transform">Live Mode</button>
                    <button onClick={handleStartRecording} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-purple-500 transition-colors">
                      <Mic size={14} /> Record
                    </button>
                  </div>
                  
                  {/* BOTTONE PLAY DOPO REGISTRAZIONE */}
                  {audioEngineRef.current && audioEngineRef.current.getSequence().length > 0 && (
                    <button 
                      onClick={handlePlay} 
                      className="w-full py-4 border border-purple-500/30 text-purple-400 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 hover:bg-purple-500/10 transition-colors"
                    >
                      <Play size={14} fill="currentColor" /> Play Recording
                    </button>
                  )}
                </div>
              ) : (
                <button onClick={handleStop} className="w-full py-4 bg-red-600 rounded-2xl font-black text-[11px] uppercase flex items-center justify-center gap-2 animate-pulse">
                  <Square size={14} fill="currentColor" /> Stop Engine
                </button>
              )}
            </div>
          </div>
        </div>
        
        <InstrumentGrid 
          selectedId={selectedInstrument} 
          onSelect={onInstrumentChange} 
          isLoading={false} 
        />
      </main>
    </div>
  );
};

export default App;
