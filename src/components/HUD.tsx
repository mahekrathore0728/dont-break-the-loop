import React from 'react';
import { Volume2, VolumeX, RotateCcw, Hourglass, Eye } from 'lucide-react';

interface HUDProps {
  loopCount: number;
  anomalyLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetLoop: () => void;
  onWaitAction: () => void;
  predictedActionNotice?: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  loopCount,
  anomalyLevel,
  isMuted,
  onToggleMute,
  onResetLoop,
  onWaitAction,
  predictedActionNotice,
}) => {
  const isHighAnomaly = anomalyLevel >= 70;

  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none select-none">
      {/* Top Left: Minimal Loop Indicator & Wait / Observe Action */}
      <div className="flex items-center gap-3 pointer-events-auto">
        <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-neutral-800/80 shadow-lg shadow-black/50 transition-all duration-300">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500/80 animate-pulse" />
          <span className={`font-mono text-[11px] uppercase tracking-widest ${isHighAnomaly ? 'text-rose-400' : 'text-neutral-400'}`}>
            CYCLE
          </span>
          <span className={`font-mono font-semibold text-sm tracking-wider ${isHighAnomaly ? 'text-rose-300 animate-pulse' : 'text-neutral-200'}`}>
            {loopCount < 10 ? `0${loopCount}` : loopCount}
          </span>
        </div>

        {/* Minimal Wait & Observe button */}
        <button
          onClick={onWaitAction}
          title="Stand still and listen to the room"
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-black/60 hover:bg-neutral-900/80 active:scale-95 border border-neutral-800/80 hover:border-amber-700/60 text-neutral-400 hover:text-amber-200 transition-all backdrop-blur-md text-[11px] font-mono tracking-wider shadow-lg"
        >
          <Hourglass className="w-3 h-3 text-amber-500/80" />
          <span className="hidden sm:inline">OBSERVE</span>
        </button>
      </div>

      {/* Top Center: Ominous Prediction Whisper (Contextual) */}
      {predictedActionNotice && (
        <div className="pointer-events-auto hidden md:flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-950/60 border border-purple-900/60 backdrop-blur-md text-purple-300/90 font-mono text-[11px] tracking-wider animate-pulse shadow-lg">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span>{predictedActionNotice}</span>
        </div>
      )}

      {/* Top Right: Audio & Reset Loop */}
      <div className="flex items-center gap-2 pointer-events-auto">
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute procedural audio' : 'Mute audio'}
          className="p-2.5 rounded-full bg-black/60 hover:bg-neutral-900/80 active:scale-95 border border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-all backdrop-blur-md shadow-lg"
        >
          {isMuted ? (
            <VolumeX className="w-3.5 h-3.5 text-neutral-500" />
          ) : (
            <Volume2 className="w-3.5 h-3.5 text-amber-400/80" />
          )}
        </button>

        <button
          onClick={onResetLoop}
          title="Reset this loop"
          className="p-2.5 rounded-full bg-black/60 hover:bg-neutral-900/80 active:scale-95 border border-neutral-800/80 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 transition-all backdrop-blur-md shadow-lg"
        >
          <RotateCcw className="w-3.5 h-3.5 text-neutral-400" />
        </button>
      </div>
    </header>
  );
};
