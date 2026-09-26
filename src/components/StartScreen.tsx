import React from 'react';
import { Volume2, VolumeX, History, Sparkles } from 'lucide-react';
import { GameRunStats } from '../types/game';
import { sound } from '../audio/soundEngine';

interface StartScreenProps {
  onStartGame: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  secondRunUnlocked: boolean;
  runHistory: GameRunStats[];
}

export const StartScreen: React.FC<StartScreenProps> = ({
  onStartGame,
  isMuted,
  onToggleMute,
  secondRunUnlocked,
  runHistory,
}) => {
  const lastRun = runHistory[runHistory.length - 1];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#030408] via-[#070a12] to-[#040508] overflow-hidden select-none">
      {/* Background radial glow */}
      <div className="absolute w-[600px] h-[600px] rounded-full bg-purple-950/20 blur-[140px] pointer-events-none" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-cyan-950/20 blur-[100px] pointer-events-none" />

      {/* Audio toggle in corner */}
      <div className="absolute top-6 right-6">
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute procedural audio' : 'Mute audio'}
          className="p-3 bg-neutral-950/80 hover:bg-neutral-800/80 active:scale-95 transition border border-neutral-800/80 rounded-xl text-neutral-300 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-neutral-500" /> : <Volume2 className="w-5 h-5 text-cyan-400" />}
        </button>
      </div>

      <div className="relative z-10 flex flex-col items-center text-center max-w-2xl space-y-8 animate-fadeIn">
        {/* Title */}
        <div className="space-y-3">
          <h1 className="text-4xl md:text-6xl font-serif font-black tracking-widest text-neutral-100 uppercase drop-shadow-[0_0_25px_rgba(255,255,255,0.15)]">
            DON'T BREAK THE LOOP
          </h1>
          <p className="text-sm md:text-lg font-serif italic text-cyan-400/90 tracking-wider">
            "The room learns how you play."
          </p>
        </div>

        {/* Start / Second Run Button */}
        <div className="space-y-4 pt-4 flex flex-col items-center">
          <button
            onClick={() => {
              sound.ensureContext();
              sound.playClick();
              sound.startAmbience(10);
              onStartGame();
            }}
            className="group relative px-10 py-4 bg-neutral-950 hover:bg-neutral-900 border border-neutral-700/80 hover:border-cyan-500/80 rounded-xl text-neutral-200 hover:text-white font-mono text-sm uppercase tracking-[0.25em] transition-all duration-300 shadow-2xl hover:shadow-cyan-500/20 active:scale-98"
          >
            <span className="flex items-center gap-3">
              {secondRunUnlocked && <Sparkles className="w-4 h-4 text-purple-400 animate-spin" />}
              {secondRunUnlocked ? 'SECOND RUN?' : 'ENTER THE ROOM'}
            </span>
          </button>

          <p className="text-xs font-mono text-neutral-500 tracking-wider">
            {secondRunUnlocked ? 'The room remembers your face.' : 'Escape should be simple.'}
          </p>
        </div>

        {/* Previous Run History Card if available */}
        {lastRun && (
          <div className="mt-8 p-4 bg-neutral-950/70 border border-neutral-800/80 rounded-xl backdrop-blur-md max-w-sm w-full space-y-2 text-left text-xs font-mono">
            <div className="flex items-center gap-2 text-neutral-400 pb-1 border-b border-neutral-800">
              <History className="w-3.5 h-3.5 text-cyan-400" />
              <span className="uppercase tracking-widest text-[10px]">PREVIOUS RUN FILE</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>ENDING:</span>
              <span className="text-cyan-300 uppercase font-bold">{lastRun.ending}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>LOOPS TAKEN:</span>
              <span className="text-neutral-200">{lastRun.totalLoops}</span>
            </div>
            <div className="flex justify-between text-neutral-400">
              <span>DOMINANT TRAIT:</span>
              <span className="text-purple-400 uppercase">{lastRun.dominantTrait}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
