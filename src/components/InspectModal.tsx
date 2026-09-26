import React, { useState, useEffect } from 'react';
import { 
  RoomObjectKey, 
  RoomState, 
  InventoryItem, 
  BehaviorProfile, 
  InventoryItemId 
} from '../types/game';
import { 
  X, 
  Key, 
  Lock, 
  Unlock, 
  Clock as ClockIcon, 
  Lightbulb, 
  Check, 
  Eye, 
  Zap,
  ChevronRight,
  Sparkles,
  AlertTriangle
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { getLoopClueText, getFinalPuzzleRequirement } from '../engine/roomEngine';

interface InspectModalProps {
  inspectTarget: RoomObjectKey | null;
  inspectedItem: InventoryItem | null;
  loopCount: number;
  anomalyLevel: number;
  roomState: RoomState;
  inventory: InventoryItem[];
  behaviorProfile: BehaviorProfile;
  selectedItem: InventoryItem | null;
  onClose: () => void;
  onTakeItem: (itemId: InventoryItemId) => void;
  onRemoveItem: (itemId: InventoryItemId) => void;
  onUpdateRoomState: (updater: (prev: RoomState) => RoomState) => void;
  onDoorEscapeAttempt: () => void;
  onTriggerSecretEnding: () => void;
  onTriggerTrappedEnding: () => void;
  onActionFeedback: (msg: string, isGlitch?: boolean) => void;
}

export const InspectModal: React.FC<InspectModalProps> = ({
  inspectTarget,
  inspectedItem,
  loopCount,
  anomalyLevel,
  roomState,
  inventory,
  behaviorProfile,
  onClose,
  onTakeItem,
  onRemoveItem,
  onUpdateRoomState,
  onDoorEscapeAttempt,
  onTriggerSecretEnding,
  onTriggerTrappedEnding,
  onActionFeedback,
}) => {
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState(false);
  const [mirrorWaitSeconds, setMirrorWaitSeconds] = useState(0);
  const [gearPosition, setGearPosition] = useState(0);
  const [revealStep, setRevealStep] = useState(0);

  useEffect(() => {
    setPinCode('');
    setPinError(false);
    setMirrorWaitSeconds(0);
    setRevealStep(0);
  }, [inspectTarget, inspectedItem]);

  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (inspectTarget === 'mirror' && loopCount === 8 && !roomState.lampOn) {
      timer = setInterval(() => {
        setMirrorWaitSeconds(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [inspectTarget, loopCount, roomState.lampOn]);

  if (!inspectTarget && !inspectedItem) return null;

  const hasItem = (id: InventoryItemId) => inventory.some(i => i.id === id);

  const handleKeypadPress = (digit: string) => {
    sound.playClick();
    if (pinCode.length < 3) {
      const nextCode = pinCode + digit;
      setPinCode(nextCode);
      if (nextCode.length === 3) {
        if (nextCode === '481') {
          sound.playDoorOpen();
          onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true, enteredDoorCode: '481' }));
          onActionFeedback('The heavy mechanical tumblers click into place. The door unlocks.');
        } else {
          sound.playGlitch();
          setPinError(true);
          setTimeout(() => {
            setPinCode('');
            setPinError(false);
          }, 600);
        }
      }
    }
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      sound.playClick();
      onClose();
    }
  };

  /* Cinematic style helpers */
  const isHighAnomaly = anomalyLevel >= 70;
  const isGlitchLoop = loopCount >= 7;
  const panelBorder = isGlitchLoop
    ? 'border-[#7f1d1d]/50 shadow-[0_0_60px_rgba(127,29,29,0.15)]'
    : isHighAnomaly
    ? 'border-[#78350f]/50 shadow-[0_0_60px_rgba(120,53,15,0.12)]'
    : 'border-[#3a2e1a]/60 shadow-[0_0_80px_rgba(0,0,0,0.95)]';

  const btnBrass = 'px-5 py-2.5 bg-[#1c1508] hover:bg-[#2a1f0e] active:scale-95 border border-[#6b4c1a]/60 text-[#c9a96e] font-mono text-xs uppercase tracking-wider rounded transition-all duration-200';
  const btnDanger = 'px-5 py-2.5 bg-[#150808] hover:bg-[#200e0e] active:scale-95 border border-[#7f1d1d]/60 text-[#fca5a5] font-mono text-xs uppercase tracking-wider rounded transition-all duration-200';
  const btnSuccess = 'px-5 py-2.5 bg-[#0a1a0a] hover:bg-[#0e220e] active:scale-95 border border-[#166534]/60 text-[#86efac] font-mono text-xs uppercase tracking-wider rounded transition-all duration-200';
  const btnGhost = 'px-5 py-2.5 bg-transparent hover:bg-[#1a1508]/60 active:scale-95 border border-[#5a3e1a]/40 text-[#a37840] font-mono text-xs uppercase tracking-wider rounded transition-all duration-200';
  const btnPrimary = 'w-full py-3 bg-[#1a1508] hover:bg-[#241c0a] active:scale-98 border border-[#8a6030]/70 text-[#d4a853] font-mono text-sm uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(212,168,83,0.08)] transition-all duration-300';
  const btnSecret = 'px-6 py-3 bg-[#150a24] hover:bg-[#1e1030] active:scale-95 border border-[#5b21b6]/60 text-[#c4b5fd] font-mono text-xs uppercase tracking-widest rounded-lg shadow-[0_0_20px_rgba(91,33,182,0.15)] transition-all duration-200';

  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-6 bg-black/80 backdrop-blur-sm"
    >
      <div
        className={`relative w-full max-w-md mx-auto overflow-hidden text-neutral-300 select-none rounded-t-2xl sm:rounded-2xl border ${panelBorder}`}
        style={{ background: 'radial-gradient(ellipse at 50% 0%, #13110d 0%, #070809 100%)' }}
      >
        {/* Top accent line */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#8a6030]/50 to-transparent" />

        {/* Close button */}
        <button
          onClick={() => { sound.playClick(); onClose(); }}
          className="absolute top-3.5 right-3.5 p-1.5 rounded text-[#5a4820]/80 hover:text-[#c9a96e] transition-colors duration-200 z-10"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Content area */}
        <div className="px-6 pt-5 pb-4 space-y-4">

          {/* INSPECTING INVENTORY ITEM */}
          {inspectedItem && (
            <div className="flex flex-col items-center text-center space-y-3 py-3">
              <div className="w-14 h-14 rounded-full bg-[#1a1005] border border-[#6b4c1a]/40 flex items-center justify-center">
                <Key className="w-7 h-7 text-[#c9a96e]" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">{inspectedItem.name}</h2>
              <p className="text-sm font-serif text-neutral-400 max-w-xs leading-relaxed">{inspectedItem.description}</p>
            </div>
          )}

          {/* KEY ITEM (DIRECT ACCESS) */}
          {inspectTarget === 'keyItem' && (
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-[#1a1005] border border-[#6b4c1a]/40 flex items-center justify-center">
                <Key className="w-7 h-7 text-[#c9a96e]" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Small Brass Key</h2>
              <p className="text-sm font-serif text-neutral-400 max-w-xs leading-relaxed">
                An old brass key, cold to the touch. Crafted for the writing desk compartment.
              </p>
              {!hasItem('brass_key') ? (
                <button onClick={() => { sound.playClick(); onTakeItem('brass_key'); onActionFeedback('You pick up the Small Brass Key.'); onClose(); }} className={btnBrass}>
                  Take Brass Key
                </button>
              ) : (
                <p className="text-xs text-[#5a4820] font-mono">Already in your possession.</p>
              )}
            </div>
          )}

          {/* OBJECT 1: DOOR */}
          {inspectTarget === 'door' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Visual glyph */}
              <div className="flex flex-col items-center gap-1">
                <div className="w-10 h-14 border-2 border-[#4a3820]/70 rounded-sm flex items-center justify-center bg-[#0d0b08]">
                  {roomState.doorUnlocked
                    ? <Unlock className="w-5 h-5 text-[#86efac]" />
                    : <Lock className="w-5 h-5 text-[#6b4c1a]" />}
                </div>
                <div className="w-1 h-3 bg-[#3a2e1a]/50 rounded-full" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Heavy Iron Door</h2>

              {/* Loop 1: Pin Pad */}
              {loopCount === 1 && (
                <div className="w-full flex flex-col items-center space-y-4">
                  <p className="text-xs font-mono text-[#5a4820] tracking-widest">
                    {roomState.doorUnlocked ? '[ UNLOCKED ]' : 'A mechanical combination lock. 3 digits.'}
                  </p>
                  {/* Pin display */}
                  <div className={`w-32 h-11 rounded border flex items-center justify-center font-mono text-2xl tracking-[0.3em] ${pinError ? 'border-[#7f1d1d]/80 text-[#fca5a5] animate-shake' : 'border-[#4a3820]/50 text-[#d4b896]'} bg-[#0a0800]`}>
                    {pinCode.padEnd(3, '\u00b7')}
                  </div>
                  {!roomState.doorUnlocked && (
                    <div className="grid grid-cols-3 gap-1.5 w-44">
                      {['1','2','3','4','5','6','7','8','9','C','0','\u232b'].map((b) => (
                        <button
                          key={b}
                          onClick={() => {
                            if (b === 'C') { sound.playClick(); setPinCode(''); }
                            else if (b === '\u232b') { sound.playClick(); setPinCode(prev => prev.slice(0, -1)); }
                            else { handleKeypadPress(b); }
                          }}
                          className="py-2.5 bg-[#0e0c09] hover:bg-[#181408] active:scale-95 border border-[#3a2e1a]/50 rounded font-mono text-sm text-[#a37840] hover:text-[#c9a96e] transition"
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Loop 2: Silver Keyhole */}
              {loopCount === 2 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.doorUnlocked
                      ? 'The silver key is turned in the lock. The latch rests open.'
                      : 'The keypad is dead. A slender silver keyhole has emerged in the iron.'}
                  </p>
                  {!roomState.doorUnlocked && (
                    <button
                      onClick={() => {
                        if (hasItem('silver_key')) {
                          sound.playDoorOpen();
                          onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                          onActionFeedback('The silver key turns with a satisfying heavy click. Door unlocked.');
                        } else {
                          sound.playClick();
                          onActionFeedback('The silver keyhole requires a slender key. Search beneath what you tread upon.');
                        }
                      }}
                      className={hasItem('silver_key') ? btnBrass : btnGhost}
                    >
                      {hasItem('silver_key') ? 'Insert Silver Key' : 'Requires Silver Key'}
                    </button>
                  )}
                </div>
              )}

              {/* Loop 3: Ornate Dial */}
              {loopCount === 3 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.doorUnlocked
                      ? 'The astrological dial is locked in alignment with the frame.'
                      : 'A circular recess marked with gear teeth. Something circular belongs here.'}
                  </p>
                  {!roomState.doorUnlocked && (
                    <button
                      onClick={() => {
                        if (hasItem('ornate_dial')) {
                          sound.playDoorOpen();
                          onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                          onActionFeedback('The ornate dial locks into the teeth and rotates. The door unseals.');
                        } else {
                          sound.playClick();
                          onActionFeedback('You need the ornate dial from the grandfather clock.');
                        }
                      }}
                      className={hasItem('ornate_dial') ? btnBrass : btnGhost}
                    >
                      {hasItem('ornate_dial') ? 'Insert Ornate Dial' : 'Requires Ornate Dial'}
                    </button>
                  )}
                </div>
              )}

              {/* Loop 4: Habit Trap */}
              {loopCount === 4 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {!roomState.loop4HabitNeutralized
                      ? 'The iron handle is scalding hot. The room anticipated your rush.'
                      : 'The handle has cooled. The counter-action neutralized the lock.'}
                  </p>
                  {!roomState.loop4HabitNeutralized ? (
                    <div className="p-3 border border-[#7f1d1d]/40 rounded bg-[#110606]/60">
                      <p className="text-xs font-mono text-[#fca5a5] leading-relaxed">
                        "YOU ALWAYS CHECK THE DOOR FIRST." Touch something you normally ignore ? mirror, lamp, or floor tile ? to break the pattern.
                      </p>
                    </div>
                  ) : (
                    <button
                      onClick={() => {
                        sound.playDoorOpen();
                        onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                        onActionFeedback('The cooled handle turns smoothly. Door unlocked.');
                      }}
                      className={btnSuccess}
                    >
                      Turn Cooled Handle
                    </button>
                  )}
                </div>
              )}

              {/* Loop 5: Deception Lock */}
              {loopCount === 5 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.doorUnlocked
                      ? 'The prism core glows steadily. The heavy lock is disengaged.'
                      : 'The keyhole is sealed behind a hexagonal stone iris. It does not accept ordinary keys.'}
                  </p>
                  {hasItem('decoy_key') && !roomState.doorUnlocked && (
                    <button
                      onClick={() => {
                        sound.playGlitch();
                        onActionFeedback('A familiar habit. The lock refuses the decoy key. The room deceived you.', true);
                      }}
                      className={btnDanger}
                    >
                      Try Gleaming Key
                    </button>
                  )}
                </div>
              )}

              {/* Loop 6: Prediction Lock */}
              {loopCount === 6 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.doorUnlocked
                      ? 'The prediction error crashed the security layer. The latch is open.'
                      : 'The door vibrates faintly. Locked by an algorithmic predictive lock.'}
                  </p>
                  {!roomState.doorUnlocked && (
                    <p className="text-xs font-mono text-[#a78bfa]/70">
                      Glitch count: {roomState.loop6GlitchCount} / 3 &mdash; Break the room's predictions.
                    </p>
                  )}
                </div>
              )}

              {/* Loop 8: Final Pattern Break */}
              {loopCount === 8 && (
                <div className="w-full flex flex-col items-center space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.loop8PatternBroken
                      ? 'The loop has fractured. The doorway opens into pure white light.'
                      : `LOCKED BY ARCHETYPE: ${behaviorProfile.dominantTrait.toUpperCase()}. Break your dominant instinct.`}
                  </p>
                  {!roomState.loop8PatternBroken && (
                    <p className="text-xs font-mono text-[#c9a96e]/60 leading-relaxed text-center max-w-xs">
                      {getFinalPuzzleRequirement(behaviorProfile.dominantTrait).instruction}
                    </p>
                  )}
                </div>
              )}

              {/* Escape Button */}
              {(roomState.doorUnlocked || loopCount === 7 || (loopCount === 8 && roomState.loop8PatternBroken)) && (
                <button
                  onClick={() => { sound.playDoorOpen(); onDoorEscapeAttempt(); }}
                  className={btnPrimary}
                >
                  {loopCount === 8 ? '\u25b6  Step Into Freedom' : '\u25b6  Open Door & Escape'}
                </button>
              )}
            </div>
          )}

          {/* OBJECT 2: CLOCK */}
          {inspectTarget === 'clock' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Clock face visual */}
              <div className="flex flex-col items-center gap-1 opacity-80">
                <div className="font-mono text-3xl tracking-[0.15em] text-[#c9a96e]/80" style={{fontVariantNumeric:'tabular-nums'}}>
                  {loopCount === 1 ? '04:08:01' : loopCount === 2 ? '10:85:10' : loopCount >= 8 ? '??:??:??' : `0${loopCount}:${(loopCount * 13) % 60}:${(loopCount * 7) % 60}`.replace(/\b(\d)\b/g,'0$1')}
                </div>
                <div className="w-20 h-px bg-gradient-to-r from-transparent via-[#6b4c1a]/40 to-transparent" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Grandfather Clock</h2>

              {loopCount === 1 && (
                <div className="space-y-2">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    The ornate brass hands are frozen at exactly <span className="font-mono text-[#c9a96e]">04:08:01</span>.
                  </p>
                  <p className="text-xs font-mono text-[#5a4820]">Hours: 4 &bull; Minutes: 8 &bull; Seconds: 1</p>
                </div>
              )}

              {loopCount === 2 && (
                <div className="space-y-2">
                  <p className="text-sm font-mono text-[#fca5a5]">"TIME IS RUNNING BACKWARD."</p>
                  <p className="text-xs font-serif text-neutral-500 leading-relaxed">
                    The hands shudder in reverse. The pendulum swings backwards with an uncanny rhythm.
                  </p>
                </div>
              )}

              {loopCount === 3 && (
                <div className="space-y-3 w-full">
                  <p className="text-sm font-serif text-neutral-400">Three Roman numeral gear slots line the pendulum housing.</p>
                  <div className="flex justify-center gap-2 py-1">
                    {['III', 'VI', 'IX'].map((numeral, idx) => (
                      <button
                        key={numeral}
                        onClick={() => {
                          sound.playClick();
                          setGearPosition(idx);
                          if (idx === 2) {
                            sound.playChime(1);
                            onUpdateRoomState(prev => ({ ...prev, clockSecretFound: true }));
                            if (!hasItem('ornate_dial')) {
                              onTakeItem('ornate_dial');
                              onActionFeedback('The pendulum clicks into alignment. An Ornate Dial drops into your hands.');
                            }
                          }
                        }}
                        className={`px-4 py-2 border rounded font-mono text-xs transition-all duration-200 ${
                          gearPosition === idx
                            ? 'bg-[#1a1005] border-[#8a6030]/70 text-[#c9a96e]'
                            : 'bg-[#0a0800] border-[#3a2e1a]/40 text-[#5a4820] hover:text-[#a37840]'
                        }`}
                      >
                        Slot {numeral}
                      </button>
                    ))}
                  </div>
                  {hasItem('ornate_dial') && (
                    <p className="text-xs font-mono text-[#86efac]/70">&check; Ornate Dial retrieved from pendulum compartment.</p>
                  )}
                </div>
              )}

              {loopCount >= 4 && loopCount < 8 && (
                <div className="space-y-2">
                  <p className="text-sm font-serif text-neutral-500">The clock hands spin erratically. A low chime resonates through the floorboards.</p>
                  <p className="text-[11px] font-mono text-[#5a4820]">Anomaly resonance: {anomalyLevel}%</p>
                </div>
              )}

              {loopCount === 8 && behaviorProfile.dominantTrait === 'rusher' && (
                <div className="w-full p-4 border border-[#1d4ed8]/30 rounded bg-[#060c18]/60 space-y-2">
                  <p className="text-xs font-mono text-[#93c5fd] uppercase tracking-widest">Stillness Trial</p>
                  <p className="text-xs font-serif text-neutral-400">
                    Silence elapsed: {roomState.loop8WaitingSeconds} / 10 seconds. Stand still.
                  </p>
                  <div className="w-full bg-[#0c0e14] h-1 rounded-full overflow-hidden">
                    <div
                      className="bg-[#3b82f6] h-full transition-all duration-300"
                      style={{ width: `${(roomState.loop8WaitingSeconds / 10) * 100}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* OBJECT 4: DRAWER */}
          {inspectTarget === 'drawer' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Drawer visual */}
              <div className="w-24 h-8 border border-[#4a3820]/50 rounded-sm bg-[#0d0b08] flex items-center justify-center">
                <div className="w-4 h-1.5 rounded-full bg-[#6b4c1a]/50" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Desk Drawer</h2>

              {loopCount === 1 && (
                <div className="space-y-3">
                  {!roomState.drawerOpen ? (
                    <>
                      <p className="text-sm font-serif text-neutral-400">A dark oak drawer with an aged brass handle. It looks closed.</p>
                      <button
                        onClick={() => {
                          sound.playDrawerSlide();
                          onUpdateRoomState(prev => ({ ...prev, drawerOpen: true }));
                          onActionFeedback('You slide open the drawer. Something catches the light inside.');
                        }}
                        className={btnBrass}
                      >
                        Slide Open Drawer
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-serif text-neutral-400">
                        Something catches the light inside. An old brass key rests on the dark wood lining.
                      </p>
                      {!hasItem('brass_key') ? (
                        <button
                          onClick={() => { sound.playClick(); onTakeItem('brass_key'); onActionFeedback('You take the Small Brass Key.'); }}
                          className={btnBrass}
                        >
                          Take Brass Key
                        </button>
                      ) : (
                        <p className="text-xs font-mono text-[#5a4820]">The drawer is now empty.</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {loopCount === 2 && (
                <div className="space-y-2">
                  <p className="text-sm font-serif text-neutral-500">The drawer is hollow and empty. The key you found in the previous cycle is not here.</p>
                  <p className="text-xs font-mono text-[#5a4820]">Deep scratch marks score the bottom lining, pointing downwards.</p>
                </div>
              )}

              {loopCount === 3 && (
                <div className="space-y-2">
                  <p className="text-sm font-serif text-neutral-500">Heavy iron brackets reinforce the drawer face. Bolted from within.</p>
                  <p className="text-xs font-mono text-[#5a4820]">The room adapts to your habits.</p>
                </div>
              )}

              {loopCount === 5 && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400">
                    A gleaming, ornate golden key rests on velvet. It radiates an impossible, seductive glow.
                  </p>
                  {!hasItem('decoy_key') ? (
                    <button
                      onClick={() => { sound.playClick(); onTakeItem('decoy_key'); onActionFeedback('You pick up the gleaming key. It feels surprisingly light.', true); }}
                      className={btnBrass}
                    >
                      Take Gleaming Key
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#c9a96e]/60">You possess the gleaming key. But does it actually belong to the door?</p>
                  )}
                </div>
              )}

              {loopCount === 8 && behaviorProfile.dominantTrait === 'collector' && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400">Deposit your possessions here to break your collector habit.</p>
                  {inventory.length > 0 ? (
                    <button
                      onClick={() => {
                        sound.playDrawerSlide();
                        inventory.forEach(i => onRemoveItem(i.id));
                        onUpdateRoomState(prev => ({ ...prev, loop8PatternBroken: true }));
                        onActionFeedback('You empty all items into the drawer. PATTERN BROKEN: COLLECTOR.');
                      }}
                      className={btnBrass}
                    >
                      Deposit All Inventory Items
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#86efac]/70">&check; Your hands are empty. The room recognizes your sacrifice.</p>
                  )}
                </div>
              )}

              {loopCount !== 1 && loopCount !== 2 && loopCount !== 3 && loopCount !== 5 && !(loopCount === 8 && behaviorProfile.dominantTrait === 'collector') && (
                <p className="text-sm font-serif text-neutral-500">The drawer slides smoothly, revealing nothing but faint dust motes.</p>
              )}
            </div>
          )}

          {/* OBJECT 5: DESK */}
          {inspectTarget === 'desk' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-28 h-6 bg-[#0d0b08] border border-[#4a3820]/40 rounded-sm" />
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Writing Desk</h2>

              {loopCount === 1 && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    {roomState.deskUnlocked
                      ? 'The desktop compartment sits unlocked. The Strange Note has been taken.'
                      : 'A small brass keyhole secures the desktop compartment. The key might fit.'}
                  </p>
                  {!roomState.deskUnlocked ? (
                    <button
                      onClick={() => {
                        if (hasItem('brass_key')) {
                          sound.playClick();
                          onUpdateRoomState(prev => ({ ...prev, deskUnlocked: true }));
                          onTakeItem('strange_note');
                          onActionFeedback('The key fits! The lock turns with a satisfying snap. Inside lies a Strange Note.');
                        } else {
                          sound.playClick();
                          onActionFeedback('Locked. You need a brass key to open this compartment.');
                        }
                      }}
                      className={hasItem('brass_key') ? btnBrass : btnGhost}
                    >
                      {hasItem('brass_key') ? 'Unlock with Brass Key' : 'Requires Brass Key'}
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#5a4820] leading-relaxed">Note retrieved: "Escape should be simple. The code is written in the hours: 4-8-1."</p>
                  )}
                </div>
              )}

              {loopCount === 2 && (
                <div className="space-y-2">
                  <p className="text-sm font-serif text-neutral-500">Fresh claw-like scratches point downwards toward the floorboards.</p>
                  <p className="text-xs font-mono text-[#5a4820]">"Look beneath what you tread upon."</p>
                </div>
              )}

              {loopCount === 5 && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400">A hexagonal carved indentation in the center of the desk.</p>
                  {hasItem('prism_token') && !roomState.doorUnlocked && (
                    <button
                      onClick={() => {
                        sound.playClick();
                        onRemoveItem('prism_token');
                        onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true, deskPrismSlotFilled: true }));
                        onActionFeedback('The Prism Token locks into the desk. The heavy door seals disengage.');
                      }}
                      className={btnBrass}
                    >
                      Place Prism Token in Indentation
                    </button>
                  )}
                  {roomState.doorUnlocked && (
                    <p className="text-xs font-mono text-[#86efac]/70">&check; Prism Token in place. Door unsealed.</p>
                  )}
                </div>
              )}

              {loopCount !== 1 && loopCount !== 2 && loopCount !== 5 && (
                <p className="text-sm font-serif text-neutral-500">The weathered mahogany surface holds ink stains that refuse to dry.</p>
              )}
            </div>
          )}

          {/* OBJECT 6: STRANGE NOTE */}
          {inspectTarget === 'note' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">
                {getLoopClueText(loopCount, behaviorProfile).title}
              </h2>
              <div className="w-full p-4 rounded border border-[#6b4c1a]/30 bg-[#0f0c06] font-serif text-sm text-[#d4c4a0]/90 leading-relaxed whitespace-pre-line text-left shadow-inner">
                {getLoopClueText(loopCount, behaviorProfile).body}
              </div>
              <p className="text-[10px] font-mono text-[#3a2e1a]">The ink shifts when you blink.</p>
            </div>
          )}

          {/* OBJECT 7: LAMP */}
          {inspectTarget === 'lamp' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Lamp glyph */}
              <div className="relative">
                <Lightbulb className={`w-10 h-10 ${roomState.lampOn ? (roomState.lampUV ? 'text-[#a78bfa]' : 'text-[#c9a96e]') : 'text-[#3a2e1a]'} transition-colors duration-500`} />
                {roomState.lampOn && (
                  <div className={`absolute inset-0 blur-xl rounded-full opacity-30 ${roomState.lampUV ? 'bg-purple-400' : 'bg-amber-400'}`} />
                )}
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Brass Desk Lamp</h2>
              <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                {roomState.lampOn
                  ? (roomState.lampUV ? 'Emitting an eerie ultraviolet blacklight across the room.' : 'Casting warm golden-amber light over the desk.')
                  : 'The lamp is switched off. Deep shadows stretch across the study.'}
              </p>
              <div className="flex gap-3 flex-wrap justify-center">
                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdateRoomState(prev => ({ ...prev, lampOn: !prev.lampOn }));
                    onActionFeedback(roomState.lampOn ? 'You click the lamp off.' : 'You click the lamp on.');
                  }}
                  className={btnBrass}
                >
                  {roomState.lampOn ? 'Turn Off' : 'Turn On'}
                </button>
                {loopCount >= 3 && roomState.lampOn && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onUpdateRoomState(prev => ({ ...prev, lampUV: !prev.lampUV }));
                      onActionFeedback(roomState.lampUV ? 'Standard illumination restored.' : 'UV Mode Activated. Hidden ink fluoresces on the wall.');
                    }}
                    className="px-5 py-2.5 bg-[#150a24] hover:bg-[#1e1030] active:scale-95 border border-[#5b21b6]/60 text-[#c4b5fd] font-mono text-xs uppercase tracking-wider rounded transition-all duration-200"
                  >
                    {roomState.lampUV ? 'Normal Light' : 'UV Blacklight'}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* OBJECT 8: MIRROR */}
          {inspectTarget === 'mirror' && (
            <div className="flex flex-col items-center text-center space-y-4">
              {/* Mirror glyph */}
              <div className="relative w-10 h-14 border border-[#4a3820]/40 rounded-sm bg-[#0d0b0e] flex items-center justify-center overflow-hidden">
                <Eye className={`w-5 h-5 ${loopCount >= 3 ? 'text-[#c9a96e]/60' : 'text-[#3a2e1a]'}`} />
                <div className="absolute inset-0 bg-gradient-to-br from-[#c9a96e]/5 to-transparent" />
              </div>
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Tall Wall Mirror</h2>

              {loopCount < 3 && (
                <p className="text-sm font-serif text-neutral-500">You see your own reflection in the dim room. Nothing appears unusual.</p>
              )}

              {loopCount >= 3 && loopCount < 7 && loopCount !== 5 && (
                <div className="space-y-2">
                  <p className="text-sm font-mono text-[#c9a96e]/70">"YOU ARE NOT THE ONLY ONE WATCHING."</p>
                  <p className="text-xs font-serif text-neutral-500 leading-relaxed">
                    Your reflection blinks half a second after you do. It watches you with subtle, unsettling divergence.
                  </p>
                </div>
              )}

              {loopCount === 5 && (
                <div className="space-y-2">
                  <p className="text-sm font-mono text-[#c9a96e]/70">"DO NOT TRUST WHAT GLITTERS."</p>
                  <p className="text-xs font-serif text-neutral-400 leading-relaxed">
                    Your reflection does not copy your movement. It stands with arm outstretched, pointing directly downward toward the loose floor tile.
                  </p>
                </div>
              )}

              {loopCount === 8 && (
                <div className="w-full space-y-3">
                  {!roomState.lampOn ? (
                    <div className="p-4 border border-[#5b21b6]/30 rounded bg-[#0d0818]/70 space-y-3">
                      <p className="text-xs font-mono text-[#a78bfa] uppercase tracking-widest">
                        Darkness Ritual: {mirrorWaitSeconds}s / 6s
                      </p>
                      <p className="text-xs font-serif text-neutral-400 leading-relaxed">
                        In total darkness, your reflection ceases to mimic you. It turns around, offering a pulsing relic from within the glass.
                      </p>
                      {mirrorWaitSeconds >= 6 && !hasItem('architect_core') && (
                        <button
                          onClick={() => {
                            sound.playMirrorResonance();
                            onTakeItem('architect_core');
                            onActionFeedback("You reach into the icy glass and retrieve the Architect's Core.");
                          }}
                          className={btnSecret + ' animate-pulse w-full'}
                        >
                          Take Architect's Core
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs font-serif text-neutral-500">The mirror is completely reflective. Perhaps darkness would reveal what lurks beneath.</p>
                  )}
                  {behaviorProfile.dominantTrait === 'explorer' && (
                    <button
                      onClick={() => {
                        sound.playMirrorResonance();
                        onUpdateRoomState(prev => ({ ...prev, loop8PatternBroken: true }));
                        onActionFeedback('You step decisively into the mirror without touching anything else. PATTERN BROKEN: EXPLORER.');
                      }}
                      className={btnBrass}
                    >
                      Step Into Mirror (Singular Action)
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* OBJECT 9: FLOOR TILE */}
          {inspectTarget === 'tile' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-10 h-10 border border-[#4a3820]/40 bg-[#0d0b08] rotate-45 transform" />
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Loose Floor Tile</h2>

              {loopCount === 2 && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    You lift the loose wooden floorboard. In the hollow space beneath rests a slender Silver Key.
                  </p>
                  {!hasItem('silver_key') ? (
                    <button
                      onClick={() => { sound.playClick(); onTakeItem('silver_key'); onActionFeedback('You retrieve the Silver Key from beneath the floor.'); }}
                      className={btnBrass}
                    >
                      Take Silver Key
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#5a4820]">The cavity is empty.</p>
                  )}
                </div>
              )}

              {loopCount === 5 && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-neutral-400 leading-relaxed">
                    Hidden deep within the floor cavity lies a dark crystal Prism Token ? the real key, untainted by the room's bait.
                  </p>
                  {!hasItem('prism_token') && !roomState.doorUnlocked ? (
                    <button
                      onClick={() => { sound.playClick(); onTakeItem('prism_token'); onActionFeedback('You take the Prism Token.'); }}
                      className={btnBrass}
                    >
                      Take Prism Token
                    </button>
                  ) : (
                    <p className="text-xs font-mono text-[#5a4820]">The cavity is empty.</p>
                  )}
                </div>
              )}

              {loopCount === 8 && hasItem('architect_core') && (
                <div className="space-y-3">
                  <p className="text-sm font-serif text-[#c4b5fd]/80 leading-relaxed">
                    A circular cavity matching the Architect's Core pulses beneath the floorboards.
                  </p>
                  <button
                    onClick={() => { sound.playEnding(); onTriggerSecretEnding(); }}
                    className={btnSecret + ' w-full animate-pulse'}
                  >
                    Insert Architect's Core &mdash; Secret Ending
                  </button>
                </div>
              )}

              {loopCount !== 2 && loopCount !== 5 && !(loopCount === 8 && hasItem('architect_core')) && (
                <p className="text-sm font-serif text-neutral-500">A square floor tile that rattles slightly underfoot. Nothing else is hidden here right now.</p>
              )}
            </div>
          )}

          {/* OBJECT 3: OIL PAINTING */}
          {inspectTarget === 'painting' && (
            <div className="flex flex-col items-center text-center space-y-4">
              <h2 className="font-serif text-lg tracking-[0.12em] text-[#c9a96e] uppercase">Oil Portrait</h2>

              {loopCount === 1 && (
                <p className="text-sm font-serif text-neutral-500 leading-relaxed">
                  A dark Victorian oil painting depicting an empty corridor with a single illuminated door at the far end.
                </p>
              )}

              {loopCount >= 2 && loopCount < 7 && (
                <div className="space-y-2">
                  <p className="text-sm font-mono text-[#c9a96e]/70">"YOU KEEP RETURNING HERE."</p>
                  <p className="text-xs font-serif text-neutral-500 leading-relaxed">
                    The corridor in the painting now features subtle chalk tally marks matching your completed cycles ({loopCount}).
                  </p>
                </div>
              )}

              {/* LOOP 7: CINEMATIC PSYCHOLOGICAL REVEAL */}
              {loopCount === 7 && (
                <div className="w-full space-y-4 text-left">
                  <div className="p-4 border border-[#5b21b6]/30 rounded bg-[#0d0818]/70 space-y-4 font-mono">
                    <div className="flex items-center justify-between text-[10px] text-[#a78bfa]/60 border-b border-[#5b21b6]/20 pb-2">
                      <span className="tracking-widest">ANALYSIS OF RECORDED BEHAVIOR</span>
                      <span>BEAT {revealStep + 1} / 5</span>
                    </div>

                    {revealStep === 0 && (
                      <div className="space-y-2 animate-fadeIn">
                        <p className="text-[10px] text-[#5a4820] uppercase tracking-widest">Initial Instinct:</p>
                        <p className="text-base text-[#93c5fd]">
                          YOU CHECKED THE DOOR FIRST: {behaviorProfile.doorFirstCount} TIMES.
                        </p>
                        <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                          Every cycle began with the assumption that exit was immediate.
                        </p>
                      </div>
                    )}

                    {revealStep === 1 && (
                      <div className="space-y-2 animate-fadeIn">
                        <p className="text-[10px] text-[#5a4820] uppercase tracking-widest">Gravitational Bias:</p>
                        <p className="text-base text-[#c9a96e]">
                          MOST VISITED OBJECT: {(behaviorProfile.mostVisitedObject ?? 'CLOCK').toUpperCase()}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                          Your attention continuously returned to this single coordinate.
                        </p>
                      </div>
                    )}

                    {revealStep === 2 && (
                      <div className="space-y-2 animate-fadeIn">
                        <p className="text-[10px] text-[#5a4820] uppercase tracking-widest">Recursive Rhythm:</p>
                        <p className="text-base text-[#c4b5fd]">
                          MOST REPEATED SEQUENCE: {behaviorProfile.mostRepeatedSequence ?? 'DOOR ? CLOCK ? DRAWER'}
                        </p>
                        <p className="text-[11px] text-neutral-500 font-sans leading-relaxed">
                          You performed this exact sequence across multiple loops without realization.
                        </p>
                      </div>
                    )}

                    {revealStep === 3 && (
                      <div className="space-y-2 animate-fadeIn">
                        <p className="text-[10px] text-[#5a4820] uppercase tracking-widest">Psychometric Profile:</p>
                        <p className="text-xl text-[#fca5a5]">
                          {behaviorProfile.dominantTrait.toUpperCase()} ({behaviorProfile[behaviorProfile.dominantTrait]}%)
                        </p>
                        <p className="text-[11px] text-neutral-400 font-sans leading-relaxed">
                          Predictability Score: {behaviorProfile.predictabilityScore}%. The room did not trap you ? it anticipated you.
                        </p>
                      </div>
                    )}

                    {revealStep === 4 && (
                      <div className="space-y-3 animate-fadeIn">
                        <p className="text-sm text-neutral-200 font-serif italic leading-relaxed">
                          "YOU WERE NEVER TRAPPED BY THE ROOM. YOU WERE TRAPPED BY YOUR PATTERN."
                        </p>
                        <p className="text-xs text-[#c9a96e] tracking-widest">
                          TO ESCAPE: STOP PLAYING LIKE YOURSELF.
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end">
                    {revealStep < 4 ? (
                      <button
                        onClick={() => { sound.playClick(); setRevealStep(prev => prev + 1); }}
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#150a24] hover:bg-[#1e1030] border border-[#5b21b6]/40 text-[#c4b5fd] rounded font-mono text-xs uppercase tracking-wider transition"
                      >
                        <span>Continue</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          sound.playDoorOpen();
                          onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                          onActionFeedback('The revelation echoes in your mind. The passage to Loop 8 unlocks.');
                          onClose();
                        }}
                        className={btnPrimary}
                      >
                        Acknowledge &amp; Unlock Final Door
                      </button>
                    )}
                  </div>
                </div>
              )}

              {loopCount === 8 && (
                <p className="text-sm font-serif text-neutral-600 leading-relaxed">
                  The canvas is completely blank. The portrait has dissolved into running black varnish.
                </p>
              )}
            </div>
          )}

        </div>{/* end content area */}

        {/* Bottom accent line + ESC hint */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#3a2e1a]/40 to-transparent" />
        <div className="px-6 py-3 text-center">
          <p className="text-[10px] font-mono text-white/10 tracking-[0.2em]">ESC &middot; click outside to step back</p>
        </div>
      </div>
    </div>
  );
};
