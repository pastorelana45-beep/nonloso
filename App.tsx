import React, { useState, useEffect, useRef } from 'react';
import { Header } from './components/Header';
import { Visualizer } from './components/Visualizer';
import { InstrumentGrid } from './components/InstrumentGrid';
import { MidiKeyboard } from './components/MidiKeyboard';
import { AudioEngine } from './services/audioEngine';
import { INSTRUMENTS, SCALES } from './constants';
import { PlayCircle, Square, Mic, Volume2 } from 'lucide-react';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'idle' | 'recording' | 'live'>('idle');
  const [activeMidi, setActiveMidi] = useState<number | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [isEngineInitialized, setIsEngineInitialized] = useState(false);
  const audioEngineRef = useRef<AudioEngine | null>(null);

  useEffect(() => {
    audioEngineRef.current = new AudioEngine((midi) => setActiveMidi(midi));
  }, []);

  const handleStartLive = async () => {
    await audioEngineRef.current?.startMic('live');
    setAppState('live');
    setPlaybackProgress(0);
  };

  const handleStartRecording = async () => {
    await audioEngineRef.current?.startMic('recording');
    setAppState('recording');
    setPlaybackProgress(0);
  };

  const handleStop = () => {
    audioEngineRef.current?.stopMic();
    setAppState('idle');
  };

  const handlePlayPreview = () => {
    audioEngineRef.current?.previewSequence((progress) => {
      setPlaybackProgress(progress);
    });
  };

  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col">
      <Header onGeneratePromo={() => {}} />
      
      <main className="flex-1 max-w-7xl mx-auto w-full p-6 space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-8">
            <Visualizer 
              analyser={audioEngineRef.current && typeof audioEngineRef.current.getAnalyser === 'function' 
                ? audioEngineRef.current.getAnalyser() : null} 
              isActive={appState !== 'idle'} 
            />
            <MidiKeyboard activeMidi={activeMidi} activeColor="text-purple-500" />
          </div>

          <div className="bg-white/5 p-8 rounded-[3rem] border border-white/5 space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30">Workstation</h3>

            {/* Barra di Progresso Playback */}
            {playbackProgress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase text-purple-400">
                  <span>Playback</span>
                  <span>{Math.round(playbackProgress)}%</span>
                </div>
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 transition-all duration-100" style={{ width: `${playbackProgress}%` }} />
                </div>
              </div>
            )}

            <div className="space-y-3">
              {appState === 'idle' ? (
                <>
                  <div className="flex gap-3">
                    <button onClick={handleStartLive} className="flex-1 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase">Live</button>
                    <button onClick={handleStartRecording} className="flex-1 py-4 bg-purple-600 text-white rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2">
                      <Mic className="w-3 h-3" /> Record
                    </button>
                  </div>
                  
                  {audioEngineRef.current && audioEngineRef.current.getSequence().length > 0 && (
                    <button onClick={handlePlayPreview} className="w-full py-4 border border-white/10 rounded-2xl font-black text-[10px] uppercase flex items-center justify-center gap-2 hover:bg-white/5 transition-colors">
                      <PlayCircle className="w-4 h-4" /> Riproduci Registrazione
                    </button>
                  )}
                </>
              ) : (
                <button onClick={handleStop} className="w-full py-4 bg-red-600 rounded-2xl font-black text-[10px] uppercase animate-pulse flex items-center justify-center gap-2">
                  <Square className="w-3 h-3" /> Stop
                </button>
              )}
            </div>
          </div>
        </div>
        
        <InstrumentGrid selectedId="synth_1" onSelect={(id) => audioEngineRef.current?.setOctaveShift(0)} isLoading={false} />
      </main>
    </div>
  );
};

export default App;
