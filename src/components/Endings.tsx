import React, { useEffect, useState } from 'react';
import { EndingType, BehaviorProfile } from '../types/game';
import { sound } from '../audio/soundEngine';
import { RotateCcw, Award, AlertOctagon, Sparkles, CheckCircle2 } from 'lucide-react';

interface EndingsProps {
  ending: EndingType;
  loopCount: number;
  anomalyLevel: number;
  behaviorProfile: BehaviorProfile;
  onPlayAgain: () => void;
}

export const Endings: React.FC<EndingsProps> = ({
  ending,
  loopCount,
  anomalyLevel,
  behaviorProfile,
  onPlayAgain,
}) => {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    sound.playEnding();
    // Staged cinematic sequence
    const t1 = setTimeout(() => setStage(1), 1200);
    const t2 = setTimeout(() => setStage(2), 2400);
    const t3 = setTimeout(() => setStage(3), 3600);
    const t4 = setTimeout(() => setStage(4), 4800);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [ending]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 bg-black text-neutral-100 overflow-y-auto select-none">
      {/* Background effects according to ending */}
      {ending === 'escape' && (
        <div className="absolute inset-0 bg-radial-gradient from-cyan-950/20 via-black to-black pointer-events-none" />
      )}
      {ending === 'trapped' && (
        <div className="absolute inset-0 bg-radial-gradient from-rose-950/30 via-black to-black pointer-events-none animate-pulse" />
      )}
      {ending === 'secret' && (
        <div className="absolute inset-0 bg-radial-gradient from-purple-950/30 via-black to-black pointer-events-none" />
      )}

      <div className="relative z-10 max-w-xl w-full flex flex-col items-center text-center space-y-6">
        {/* CINEMATIC TERMINAL BREAKDOWN FOR ESCAPE */}
        {ending === 'escape' && (
          <>
            <div className="space-y-2 font-mono text-xs uppercase tracking-widest text-neutral-400">
              {stage >= 1 && <div className="text-cyan-400 animate-fadeIn">SYSTEM OVERRIDE</div>}
              {stage >= 2 && <div className="text-purple-400 animate-fadeIn">PATTERN BROKEN</div>}
              {stage >= 3 && <div className="text-rose-400 animate-fadeIn">LOOP TERMINATED</div>}
            </div>

            {stage >= 4 && (
              <div className="space-y-6 animate-fadeIn">
                <div className="w-16 h-16 rounded-full bg-cyan-950/40 border border-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-400/20">
                  <CheckCircle2 className="w-8 h-8 text-cyan-400" />
                </div>

                <h1 className="text-3xl md:text-5xl font-serif font-black tracking-widest text-cyan-100">
                  YOU ESCAPED.
                </h1>

                <p className="text-sm md:text-base font-serif italic text-cyan-300/90 leading-relaxed max-w-md mx-auto">
                  "YOU ESCAPED BECAUSE YOU STOPPED BEING PREDICTABLE."
                </p>
              </div>
            )}
          </>
        )}

        {/* ENDING 2: TRAPPED */}
        {ending === 'trapped' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-rose-950/40 border border-rose-500 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              <AlertOctagon className="w-8 h-8 text-rose-500" />
            </div>

            <div className="font-mono text-xs text-rose-400 tracking-widest">
              LOOP: ∞ · PREDICTION ACCURACY: 100%
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-widest text-rose-100">
              ETERNALLY TRAPPED.
            </h1>

            <p className="text-sm md:text-base font-serif italic text-rose-300/90 leading-relaxed max-w-md mx-auto">
              "THE ROOM KNOWS YOU BETTER THAN YOU KNOW YOURSELF."
            </p>
          </div>
        )}

        {/* ENDING 3: SECRET */}
        {ending === 'secret' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-purple-950/40 border border-purple-400 flex items-center justify-center mx-auto shadow-lg shadow-purple-400/20">
              <Sparkles className="w-8 h-8 text-purple-400" />
            </div>

            <div className="font-mono text-xs text-purple-400 tracking-widest">
              ARCHITECT INTEGRATION: COMPLETE
            </div>

            <h1 className="text-3xl md:text-5xl font-serif font-black tracking-widest text-purple-100">
              THE ARCHITECT.
            </h1>

            <p className="text-sm md:text-base font-serif italic text-purple-300/90 leading-relaxed max-w-md mx-auto">
              "THE ROOM WAS NEVER THE PRISON. YOU WERE NEVER THE VISITOR."
            </p>
          </div>
        )}

        {/* BEHAVIOR PROFILE SUMMARY CARD */}
        {stage >= 4 && (
          <div className="w-full bg-neutral-950/90 border border-neutral-800 rounded-2xl p-6 text-left space-y-4 font-mono shadow-2xl backdrop-blur-md animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
              <div className="flex items-center gap-2 text-neutral-400 text-xs">
                <Award className="w-4 h-4 text-cyan-400" />
                <span className="uppercase tracking-widest">SUBJECT PSYCHOMETRIC REPORT</span>
              </div>
              <span className="text-xs text-neutral-500">CYCLES: {loopCount}</span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-neutral-900/60 rounded-lg">
                <span className="text-neutral-500 block text-[10px]">DOMINANT TRAIT</span>
                <span className="text-cyan-300 font-bold text-sm uppercase">{behaviorProfile.dominantTrait}</span>
              </div>
              <div className="p-3 bg-neutral-900/60 rounded-lg">
                <span className="text-neutral-500 block text-[10px]">PREDICTABILITY INDEX</span>
                <span className="text-purple-300 font-bold text-sm">{behaviorProfile.predictabilityScore}%</span>
              </div>
            </div>

            {/* Trait bars */}
            <div className="space-y-1.5 pt-2 text-[11px]">
              {(['rusher', 'explorer', 'repeater', 'collector', 'observer'] as const).map(trait => (
                <div key={trait} className="flex items-center justify-between gap-3 text-neutral-400">
                  <span className="uppercase w-20">{trait}</span>
                  <div className="flex-1 bg-neutral-900 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-cyan-500/80 h-full rounded-full"
                      style={{ width: `${behaviorProfile[trait]}%` }}
                    />
                  </div>
                  <span className="w-8 text-right font-mono text-neutral-300">{behaviorProfile[trait]}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* PLAY AGAIN / SECOND RUN BUTTON */}
        {stage >= 4 && (
          <button
            onClick={() => {
              sound.playClick();
              onPlayAgain();
            }}
            className="px-8 py-3.5 bg-neutral-950 hover:bg-neutral-900 border border-neutral-700 hover:border-cyan-500 text-neutral-200 hover:text-white rounded-xl font-mono text-xs uppercase tracking-[0.2em] transition shadow-lg active:scale-98 animate-fadeIn"
          >
            <span className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              SECOND RUN?
            </span>
          </button>
        )}
      </div>
    </div>
  );
};
