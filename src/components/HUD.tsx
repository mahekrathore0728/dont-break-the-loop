import React from 'react';
import { Volume2, VolumeX, Eye, AlertTriangle, RotateCcw } from 'lucide-react';
import { sound } from '../audio/soundEngine';

interface HUDProps {
  loopCount: number;
  anomalyLevel: number;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetLoop: () => void;
  predictedActionNotice?: string | null;
}

export const HUD: React.FC<HUDProps> = ({
  loopCount,
  anomalyLevel,
  isMuted,
  onToggleMute,
  onResetLoop,
  predictedActionNotice,
}) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-4 pointer-events-none select-none">
      {/* Left: Loop Counter */}
      <div className="flex items-center gap-3 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 rounded-lg px-4 py-2 pointer-events-auto shadow-lg shadow-black/50">
        <span className="text-xs uppercase tracking-widest text-neutral-400 font-mono">CYCLE</span>
        <span className="text-lg font-mono font-bold tracking-wider text-cyan-400">
          LOOP: {loopCount < 10 ? `0${loopCount}` : loopCount}
        </span>
      </div>

      {/* Center: Prediction Notice if room is reading player */}
      {predictedActionNotice && (
        <div className="hidden sm:flex items-center gap-2 bg-purple-950/70 border border-purple-800/60 rounded-full px-4 py-1.5 backdrop-blur-md animate-pulse">
          <Eye className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-xs font-mono tracking-wider text-purple-300">
            {predictedActionNotice}
          </span>
        </div>
      )}

      {/* Right: Anomaly Meter & Audio/Controls */}
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Subtle Anomaly Indicator */}
        <div className="flex items-center gap-2.5 bg-neutral-950/80 backdrop-blur-md border border-neutral-800/80 rounded-lg px-3.5 py-2 shadow-lg shadow-black/50">
          <div className="relative flex items-center justify-center">
            <AlertTriangle className={`w-4 h-4 ${
              anomalyLevel > 75 
                ? 'text-rose-500 animate-pulse' 
                : anomalyLevel > 40 
                ? 'text-amber-400' 
                : 'text-neutral-400'
            }`} />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center justify-between gap-3 text-[10px] font-mono uppercase tracking-wider text-neutral-400">
              <span>ANOMALY</span>
              <span className={anomalyLevel > 75 ? 'text-rose-400 font-bold' : 'text-neutral-300'}>
                {anomalyLevel}%
              </span>
            </div>
            <div className="w-20 h-1 bg-neutral-800 rounded-full overflow-hidden mt-1">
              <div 
                className={`h-full transition-all duration-700 ease-out ${
                  anomalyLevel > 75 
                    ? 'bg-rose-500' 
                    : anomalyLevel > 40 
                    ? 'bg-amber-400' 
                    : 'bg-cyan-500'
                }`}
                style={{ width: `${anomalyLevel}%` }}
              />
            </div>
          </div>
        </div>

        {/* Audio Mute Button */}
        <button
          onClick={onToggleMute}
          title={isMuted ? 'Unmute procedural audio' : 'Mute audio'}
          className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800/80 active:scale-95 transition border border-neutral-800/80 rounded-lg text-neutral-300 hover:text-white"
        >
          {isMuted ? <VolumeX className="w-4 h-4 text-neutral-500" /> : <Volume2 className="w-4 h-4 text-cyan-400" />}
        </button>

        {/* Restart Current Loop */}
        <button
          onClick={onResetLoop}
          title="Restart Loop"
          className="p-2.5 bg-neutral-950/80 hover:bg-neutral-800/80 active:scale-95 transition border border-neutral-800/80 rounded-lg text-neutral-400 hover:text-neutral-200"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
