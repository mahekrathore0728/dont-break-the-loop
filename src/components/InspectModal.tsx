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
  KeyRound, 
  Sparkles, 
  Eye, 
  Compass, 
  Lock, 
  Unlock, 
  Clock as ClockIcon, 
  Lightbulb, 
  Check, 
  AlertCircle 
} from 'lucide-react';
import { sound } from '../audio/soundEngine';
import { getLoopClueText, getFinalPuzzleRequirement, INVENTORY_ITEMS_DEF } from '../engine/roomEngine';

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
  selectedItem,
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
  const [gearPosition, setGearPosition] = useState(0); // 0, 1, 2 for III, VI, IX

  useEffect(() => {
    setPinCode('');
    setPinError(false);
    setMirrorWaitSeconds(0);
  }, [inspectTarget, inspectedItem]);

  // Mirror secret timer in loop 8 darkness
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
          sound.playDoor(true);
          onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true, enteredDoorCode: '481' }));
          onActionFeedback('The heavy mechanical tumblers click. The door unlocks.');
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

  // Helper for closing on background click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      sound.playClick();
      onClose();
    }
  };

  return (
    <div 
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all animate-fadeIn"
    >
      <div className="relative w-full max-w-lg bg-neutral-950 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden p-6 text-neutral-200">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-lg bg-neutral-900/80 hover:bg-neutral-800 text-neutral-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* 1. INSPECTING INVENTORY ITEM */}
        {inspectedItem && (
          <div className="flex flex-col items-center text-center space-y-4 py-4">
            <div className="w-20 h-20 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/10">
              <Key className="w-10 h-10 text-cyan-400" />
            </div>
            <h3 className="text-xl font-serif font-bold text-cyan-300 tracking-wide">
              {inspectedItem.name}
            </h3>
            <p className="text-sm font-sans text-neutral-400 max-w-sm leading-relaxed">
              {inspectedItem.description}
            </p>
          </div>
        )}

        {/* 2. INSPECTING DOOR */}
        {inspectTarget === 'door' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              {roomState.doorUnlocked ? (
                <Unlock className="w-8 h-8 text-cyan-400" />
              ) : (
                <Lock className="w-8 h-8 text-neutral-400" />
              )}
            </div>

            <h3 className="text-xl font-serif font-bold text-neutral-100">
              HEAVY IRON DOOR
            </h3>

            {/* Loop 1: Pin Pad */}
            {loopCount === 1 && (
              <div className="w-full flex flex-col items-center space-y-4 pt-2">
                <p className="text-xs text-neutral-400 font-mono">
                  {roomState.doorUnlocked ? 'STATUS: UNLOCKED' : 'ENTER 3-DIGIT COMBINATION'}
                </p>

                <div className={`w-36 h-12 bg-black border rounded-lg flex items-center justify-center font-mono text-2xl tracking-widest ${
                  pinError ? 'border-rose-500 text-rose-500 animate-shake' : 'border-neutral-700 text-cyan-400'
                }`}>
                  {pinCode.padEnd(3, '·')}
                </div>

                {!roomState.doorUnlocked && (
                  <div className="grid grid-cols-3 gap-2 w-48 pt-2">
                    {['1','2','3','4','5','6','7','8','9','C','0','←'].map((b) => (
                      <button
                        key={b}
                        onClick={() => {
                          if (b === 'C') {
                            sound.playClick();
                            setPinCode('');
                          } else if (b === '←') {
                            sound.playClick();
                            setPinCode(prev => prev.slice(0, -1));
                          } else {
                            handleKeypadPress(b);
                          }
                        }}
                        className="py-2.5 bg-neutral-900 hover:bg-neutral-800 active:scale-95 border border-neutral-800 rounded font-mono text-sm text-neutral-300 hover:text-white transition"
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
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-neutral-400">
                  {roomState.doorUnlocked 
                    ? 'The silver key is turned in the lock. The latch rests open.' 
                    : 'The keypad is dead. A slender silver keyhole has emerged in the iron.'}
                </p>
                {!roomState.doorUnlocked && (
                  <button
                    onClick={() => {
                      if (hasItem('silver_key')) {
                        sound.playDoor(true);
                        onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                        onActionFeedback('The silver key turns with a satisfying heavy click. Door unlocked.');
                      } else {
                        sound.playClick();
                        onActionFeedback('The silver keyhole requires a slender key. Search the room.');
                      }
                    }}
                    className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono text-xs uppercase tracking-wider transition"
                  >
                    {hasItem('silver_key') ? 'Insert Silver Key' : 'Requires Silver Key'}
                  </button>
                )}
              </div>
            )}

            {/* Loop 3: Ornate Dial */}
            {loopCount === 3 && (
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-neutral-400">
                  {roomState.doorUnlocked 
                    ? 'The astrological dial is locked in alignment with the frame.' 
                    : 'A circular recess marked with gear teeth. Something circular belongs here.'}
                </p>
                {!roomState.doorUnlocked && (
                  <button
                    onClick={() => {
                      if (hasItem('ornate_dial')) {
                        sound.playDoor(true);
                        onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                        onActionFeedback('The ornate dial locks into the teeth and rotates. The door unseals.');
                      } else {
                        sound.playClick();
                        onActionFeedback('You need the ornate dial from the grandfather clock.');
                      }
                    }}
                    className="px-5 py-2.5 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 rounded-lg text-purple-300 font-mono text-xs uppercase tracking-wider transition"
                  >
                    {hasItem('ornate_dial') ? 'Insert Ornate Dial' : 'Requires Ornate Dial'}
                  </button>
                )}
              </div>
            )}

            {/* Loop 4: Habit-based Reaction */}
            {loopCount === 4 && (
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-neutral-300">
                  {!roomState.loop4HabitNeutralized
                    ? 'The iron handle is scalding hot. The room anticipated your rush.'
                    : 'The handle has cooled down. The counter-action neutralized the lock.'}
                </p>
                {!roomState.loop4HabitNeutralized ? (
                  <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-lg text-xs text-rose-300 font-mono">
                    "YOU ALWAYS CHECK THE DOOR FIRST." Break your habit by inspecting the mirror or lamp first.
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      sound.playDoor(true);
                      onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true }));
                      onActionFeedback('The cooled handle turns smoothly. Door unlocked.');
                    }}
                    className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono text-xs tracking-wider"
                  >
                    Turn Door Handle
                  </button>
                )}
              </div>
            )}

            {/* Loop 5: Prism Slot Unlocked */}
            {loopCount === 5 && (
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-neutral-300">
                  {roomState.doorUnlocked
                    ? 'The crystal resonance has released the door latches.'
                    : 'The door is bound by refractive seals. Place the Prism Token into the desk.'}
                </p>
              </div>
            )}

            {/* Loop 6: Prediction Override */}
            {loopCount === 6 && (
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-neutral-300">
                  {roomState.doorUnlocked
                    ? 'PREDICTION OVERRIDE: SUCCESS. The door latch is released.'
                    : 'PREDICTION SYSTEM: ARMED. The door will not open to a predictable sequence.'}
                </p>
                {!roomState.doorUnlocked && (
                  <div className="text-xs text-neutral-500 font-mono">
                    Interact with 3 unexpected objects to disrupt the room\'s anticipation.
                  </div>
                )}
              </div>
            )}

            {/* Loop 7: Shimmering Threshold */}
            {loopCount === 7 && (
              <div className="w-full flex flex-col items-center space-y-3 pt-2">
                <p className="text-sm text-purple-300 font-serif">
                  The door has dissolved into a shimmering void of fractured static.
                </p>
                <div className="text-xs text-neutral-400 font-mono">
                  "YOU WERE TRAPPED BY YOUR PATTERN. TO ESCAPE, DO SOMETHING YOU WOULD NEVER DO."
                </div>
              </div>
            )}

            {/* Loop 8: Final Puzzle Confrontation */}
            {loopCount === 8 && (
              <div className="w-full flex flex-col items-center space-y-4 pt-2">
                <div className="p-4 bg-purple-950/50 border border-purple-800/60 rounded-xl text-center space-y-2">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-purple-400">
                    DOMINANT PROFILE: {behaviorProfile.dominantTrait.toUpperCase()}
                  </span>
                  <p className="text-xs text-neutral-300 font-serif">
                    {getFinalPuzzleRequirement(behaviorProfile.dominantTrait).instruction}
                  </p>
                  <p className="text-[11px] text-neutral-400 font-sans">
                    {getFinalPuzzleRequirement(behaviorProfile.dominantTrait).subtext}
                  </p>
                </div>

                {roomState.loop8PatternBroken ? (
                  <div className="flex items-center gap-2 text-cyan-400 font-mono text-sm">
                    <Check className="w-4 h-4" /> PATTERN BROKEN. SYSTEM OVERRIDE READY.
                  </div>
                ) : (
                  <div className="text-xs text-rose-400 font-mono">
                    [Awaiting behavioral pattern violation]
                  </div>
                )}
              </div>
            )}

            {/* Escape / Open Button */}
            {(roomState.doorUnlocked || loopCount === 7 || (loopCount === 8 && roomState.loop8PatternBroken)) && (
              <button
                onClick={() => {
                  sound.playDoor();
                  onDoorEscapeAttempt();
                }}
                className="w-full mt-4 py-3 bg-cyan-600 hover:bg-cyan-500 active:scale-98 text-white font-mono text-sm uppercase tracking-widest rounded-xl shadow-lg shadow-cyan-600/30 transition"
              >
                {loopCount === 8 ? 'STEP INTO FREEDOM' : 'OPEN DOOR & ESCAPE'}
              </button>
            )}
          </div>
        )}

        {/* 3. INSPECTING CLOCK */}
        {inspectTarget === 'clock' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-amber-950/30 border border-amber-800/40 flex items-center justify-center">
              <ClockIcon className="w-8 h-8 text-amber-400" />
            </div>

            <h3 className="text-xl font-serif font-bold text-amber-200">
              GRANDFATHER CLOCK
            </h3>

            {loopCount === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  The ornate brass hands are frozen at exactly <span className="font-mono text-amber-400 font-bold">4:08:01</span>.
                </p>
                <p className="text-xs text-neutral-400 font-mono">
                  The ticking mechanism is locked. Hours: 4, Minutes: 8, Seconds: 1.
                </p>
              </div>
            )}

            {loopCount === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-rose-300 font-mono">
                  "TIME IS NOT RESETTING."
                </p>
                <p className="text-xs text-neutral-400">
                  The hands are jittering in reverse. The pendulum swings backwards with an uncanny rhythm.
                </p>
              </div>
            )}

            {loopCount === 3 && (
              <div className="space-y-3 w-full">
                <p className="text-sm text-neutral-300">
                  Three Roman numeral gear slots line the pendulum housing.
                </p>
                <div className="flex justify-center gap-3 py-2">
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
                      className={`px-4 py-2 border rounded font-mono text-xs ${
                        gearPosition === idx 
                          ? 'bg-purple-900 border-purple-400 text-white' 
                          : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                      }`}
                    >
                      Slot {numeral}
                    </button>
                  ))}
                </div>
                {hasItem('ornate_dial') && (
                  <p className="text-xs text-cyan-400 font-mono">
                    ✓ Ornate Dial retrieved from pendulum compartment.
                  </p>
                )}
              </div>
            )}

            {loopCount >= 4 && loopCount < 8 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-400 font-serif">
                  The clock hands spin erratically. A low chime resonates through the floorboards.
                </p>
                <p className="text-xs text-neutral-500 font-mono">
                  Ticks recorded this run: {anomalyLevel}
                </p>
              </div>
            )}

            {loopCount === 8 && behaviorProfile.dominantTrait === 'rusher' && (
              <div className="p-4 bg-cyan-950/40 border border-cyan-800/60 rounded-xl space-y-2">
                <span className="text-xs font-mono text-cyan-400 uppercase">STILLNESS TEST</span>
                <p className="text-xs text-neutral-300">
                  Silence elapsed: {roomState.loop8WaitingSeconds} / 10 seconds.
                </p>
                <div className="w-full bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-400 h-full transition-all duration-300"
                    style={{ width: `${(roomState.loop8WaitingSeconds / 10) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. INSPECTING DRAWER */}
        {inspectTarget === 'drawer' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-xl font-serif font-bold text-neutral-100">
              DESK DRAWER
            </h3>

            {/* Loop 1: Brass Key is here */}
            {loopCount === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  You slide open the wooden drawer. Inside lies a heavy brass key.
                </p>
                {!hasItem('brass_key') ? (
                  <button
                    onClick={() => {
                      sound.playDrawer();
                      onTakeItem('brass_key');
                      onActionFeedback('You take the Brass Key.');
                    }}
                    className="px-6 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-mono text-xs uppercase tracking-wider transition"
                  >
                    Take Brass Key
                  </button>
                ) : (
                  <p className="text-xs text-neutral-500 font-mono">
                    The drawer is now empty.
                  </p>
                )}
              </div>
            )}

            {/* Loop 2: Empty */}
            {loopCount === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-400">
                  The drawer is hollow and empty. The key you found last time is not here.
                </p>
                <p className="text-xs text-neutral-500 font-mono">
                  Deep scratch marks score the bottom lining.
                </p>
              </div>
            )}

            {/* Loop 5: Decoy Trap */}
            {loopCount === 5 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  A gleaming, ornate golden key rests on velvet. It shines almost too brightly.
                </p>
                <button
                  onClick={() => {
                    sound.playGlitch();
                    onUpdateRoomState(prev => ({ ...prev, activeDecoyTriggered: true }));
                    onActionFeedback('PREDICTABLE. The bait was taken. The room resets your lights.', true);
                  }}
                  className="px-5 py-2 bg-rose-950/80 hover:bg-rose-900 border border-rose-500/60 rounded-lg text-rose-300 font-mono text-xs uppercase tracking-wider"
                >
                  Take Gleaming Key (Bait)
                </button>
              </div>
            )}

            {/* Loop 8: Collector Deposit */}
            {loopCount === 8 && behaviorProfile.dominantTrait === 'collector' && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  Deposit your possessions here to break your collector habit.
                </p>
                {inventory.length > 0 ? (
                  <button
                    onClick={() => {
                      sound.playDrawer();
                      inventory.forEach(i => onRemoveItem(i.id));
                      onUpdateRoomState(prev => ({ ...prev, loop8PatternBroken: true }));
                      onActionFeedback('You empty all items into the drawer. PATTERN BROKEN: COLLECTOR.');
                    }}
                    className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono text-xs uppercase tracking-wider"
                  >
                    Deposit All Inventory Items
                  </button>
                ) : (
                  <p className="text-xs text-cyan-400 font-mono">
                    ✓ Your hands are empty. The room recognizes your sacrifice.
                  </p>
                )}
              </div>
            )}

            {loopCount !== 1 && loopCount !== 2 && loopCount !== 5 && loopCount !== 8 && (
              <p className="text-sm text-neutral-400">
                The drawer slides smoothly, revealing nothing but faint dust motes.
              </p>
            )}
          </div>
        )}

        {/* 5. INSPECTING DESK */}
        {inspectTarget === 'desk' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-xl font-serif font-bold text-neutral-100">
              WRITING DESK
            </h3>

            {/* Loop 1: Locked desk drawer/compartment */}
            {loopCount === 1 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  {roomState.deskUnlocked 
                    ? 'The desktop compartment sits open, revealing the Strange Note.' 
                    : 'A brass keyhole secures the desktop compartment.'}
                </p>
                {!roomState.deskUnlocked ? (
                  <button
                    onClick={() => {
                      if (hasItem('brass_key')) {
                        sound.playClick();
                        onUpdateRoomState(prev => ({ ...prev, deskUnlocked: true }));
                        onTakeItem('strange_note');
                        onActionFeedback('The Brass Key unlocks the compartment. You retrieve the Strange Note.');
                      } else {
                        sound.playClick();
                        onActionFeedback('Locked. You need a brass key to open this compartment.');
                      }
                    }}
                    className="px-5 py-2.5 bg-amber-950/80 hover:bg-amber-900 border border-amber-500/60 rounded-lg text-amber-300 font-mono text-xs uppercase tracking-wider"
                  >
                    {hasItem('brass_key') ? 'Unlock with Brass Key' : 'Requires Brass Key'}
                  </button>
                ) : (
                  <p className="text-xs text-neutral-400 font-mono">
                    Note retrieved: "Escape should be simple. 4-8-1."
                  </p>
                )}
              </div>
            )}

            {/* Loop 2: Scratched arrows */}
            {loopCount === 2 && (
              <div className="space-y-2">
                <p className="text-sm text-neutral-300 font-serif">
                  Fresh claw-like scratches point downwards toward the floorboards.
                </p>
                <p className="text-xs text-neutral-500 font-mono">
                  "Look beneath what you tread upon."
                </p>
              </div>
            )}

            {/* Loop 5: Prism Slot */}
            {loopCount === 5 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  A hexagonal carved indentation in the center of the desk.
                </p>
                {hasItem('prism_token') && !roomState.doorUnlocked && (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onRemoveItem('prism_token');
                      onUpdateRoomState(prev => ({ ...prev, doorUnlocked: true, deskPrismSlotFilled: true }));
                      onActionFeedback('The Prism Token locks into the desk. The door seals disengage.');
                    }}
                    className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono text-xs uppercase tracking-wider"
                  >
                    Place Prism Token in Indentation
                  </button>
                )}
                {roomState.doorUnlocked && (
                  <p className="text-xs text-cyan-400 font-mono">
                    ✓ Prism Token in place. Door unsealed.
                  </p>
                )}
              </div>
            )}

            {loopCount !== 1 && loopCount !== 2 && loopCount !== 5 && (
              <p className="text-sm text-neutral-400">
                The weathered oak surface holds ink stains that refuse to dry.
              </p>
            )}
          </div>
        )}

        {/* 6. INSPECTING STRANGE NOTE */}
        {inspectTarget === 'note' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-xl font-serif font-bold text-amber-200">
              {getLoopClueText(loopCount, behaviorProfile).title}
            </h3>
            <div className="w-full p-4 bg-amber-950/20 border border-amber-800/40 rounded-xl font-serif text-sm md:text-base text-amber-100/90 leading-relaxed whitespace-pre-line text-left">
              {getLoopClueText(loopCount, behaviorProfile).body}
            </div>
            <p className="text-[11px] text-neutral-500 font-mono">
              The ink shifts when you blink.
            </p>
          </div>
        )}

        {/* 7. INSPECTING LAMP */}
        {inspectTarget === 'lamp' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
              <Lightbulb className={`w-8 h-8 ${roomState.lampOn ? (roomState.lampUV ? 'text-purple-400' : 'text-amber-400') : 'text-neutral-600'}`} />
            </div>

            <h3 className="text-xl font-serif font-bold text-neutral-100">
              BRASS DESK LAMP
            </h3>

            <p className="text-sm text-neutral-300">
              {roomState.lampOn 
                ? (roomState.lampUV ? 'Emitting an eerie ultraviolet glow across the room.' : 'Casting warm amber light over the desk.')
                : 'The bulb is dark. Shadows lengthen.'}
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  onUpdateRoomState(prev => ({ ...prev, lampOn: !prev.lampOn }));
                  onActionFeedback(roomState.lampOn ? 'You switch the lamp off.' : 'You switch the lamp on.');
                }}
                className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 rounded-lg font-mono text-xs uppercase tracking-wider"
              >
                {roomState.lampOn ? 'Turn Off' : 'Turn On'}
              </button>

              {loopCount >= 3 && roomState.lampOn && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onUpdateRoomState(prev => ({ ...prev, lampUV: !prev.lampUV }));
                    onActionFeedback(roomState.lampUV ? 'Lamp toggled to Standard Light.' : 'UV Mode Activated. Invisible ink glows on walls.');
                  }}
                  className="px-4 py-2 bg-purple-950/80 hover:bg-purple-900 border border-purple-500/60 rounded-lg text-purple-300 font-mono text-xs uppercase tracking-wider"
                >
                  {roomState.lampUV ? 'Normal Bulb' : 'UV Mode'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* 8. INSPECTING MIRROR */}
        {inspectTarget === 'mirror' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-cyan-950/30 border border-cyan-800/40 flex items-center justify-center">
              <Eye className="w-8 h-8 text-cyan-400" />
            </div>

            <h3 className="text-xl font-serif font-bold text-cyan-200">
              TALL WALL MIRROR
            </h3>

            {loopCount < 3 && (
              <p className="text-sm text-neutral-400">
                You see your own reflection in the dim room. Nothing appears unusual.
              </p>
            )}

            {loopCount >= 3 && loopCount < 7 && (
              <div className="space-y-2">
                <p className="text-sm text-cyan-300 font-serif">
                  "YOU ARE NOT THE ONLY ONE WATCHING."
                </p>
                <p className="text-xs text-neutral-400">
                  Your reflection blinks half a second after you do. It watches you with subtle divergence.
                </p>
              </div>
            )}

            {loopCount === 5 && (
              <p className="text-xs text-cyan-400 font-mono">
                The reflection points its finger downward behind you, indicating the loose floor tile.
              </p>
            )}

            {loopCount === 8 && (
              <div className="w-full space-y-3">
                {!roomState.lampOn ? (
                  <div className="p-4 bg-purple-950/60 border border-purple-800/80 rounded-xl space-y-3">
                    <span className="text-xs font-mono text-purple-300 uppercase tracking-wider">
                      DARKNESS RITUAL: {mirrorWaitSeconds}s / 6s
                    </span>
                    <p className="text-xs text-neutral-300 font-serif">
                      In total darkness, your reflection ceases to mimic you. It turns its back, offering a glowing relic.
                    </p>

                    {mirrorWaitSeconds >= 6 && !hasItem('architect_core') && (
                      <button
                        onClick={() => {
                          sound.playMirror();
                          onTakeItem('architect_core');
                          onActionFeedback('You touch the reflection\'s outstretched hand and take the Architect\'s Core.');
                        }}
                        className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg font-mono text-xs uppercase tracking-widest animate-pulse"
                      >
                        Take Architect's Core
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-xs text-neutral-400">
                    The mirror is completely reflective. Perhaps darkness would reveal what lurks beneath.
                  </p>
                )}

                {behaviorProfile.dominantTrait === 'explorer' && (
                  <button
                    onClick={() => {
                      sound.playMirror();
                      onUpdateRoomState(prev => ({ ...prev, loop8PatternBroken: true }));
                      onActionFeedback('You step decisively toward the mirror without touching anything else. PATTERN BROKEN: EXPLORER.');
                    }}
                    className="px-5 py-2.5 bg-cyan-950/80 hover:bg-cyan-900 border border-cyan-500/60 rounded-lg text-cyan-300 font-mono text-xs uppercase tracking-wider"
                  >
                    Step Into Mirror (Singular Action)
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 9. INSPECTING FLOOR TILE */}
        {inspectTarget === 'tile' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-xl font-serif font-bold text-neutral-100">
              LOOSE FLOOR TILE
            </h3>

            {/* Loop 2: Silver Key */}
            {loopCount === 2 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  You lift the loose wooden floorboard. In the hollow dirt beneath rests a slender Silver Key.
                </p>
                {!hasItem('silver_key') ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onTakeItem('silver_key');
                      onActionFeedback('You retrieve the Silver Key from beneath the floorboard.');
                    }}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs uppercase tracking-wider"
                  >
                    Take Silver Key
                  </button>
                ) : (
                  <p className="text-xs text-neutral-500 font-mono">The cavity is empty.</p>
                )}
              </div>
            )}

            {/* Loop 5: Prism Token */}
            {loopCount === 5 && (
              <div className="space-y-3">
                <p className="text-sm text-neutral-300">
                  Hidden deep within the floor cavity lies a dark crystal Prism Token, unaffected by the room\'s bait.
                </p>
                {!hasItem('prism_token') && !roomState.doorUnlocked ? (
                  <button
                    onClick={() => {
                      sound.playClick();
                      onTakeItem('prism_token');
                      onActionFeedback('You take the Prism Token.');
                    }}
                    className="px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-mono text-xs uppercase tracking-wider"
                  >
                    Take Prism Token
                  </button>
                ) : (
                  <p className="text-xs text-neutral-500 font-mono">The cavity is empty.</p>
                )}
              </div>
            )}

            {/* Loop 8: Secret ending socket */}
            {loopCount === 8 && hasItem('architect_core') && (
              <div className="space-y-3">
                <p className="text-sm text-purple-300 font-serif">
                  A circular cavity matching the Architect\'s Core pulses beneath the floorboards.
                </p>
                <button
                  onClick={() => {
                    sound.playEnding();
                    onTriggerSecretEnding();
                  }}
                  className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-mono text-xs uppercase tracking-widest animate-pulse shadow-lg shadow-purple-600/40"
                >
                  Insert Architect's Core (Secret Ending)
                </button>
              </div>
            )}

            {loopCount !== 2 && loopCount !== 5 && !(loopCount === 8 && hasItem('architect_core')) && (
              <p className="text-sm text-neutral-400">
                A square floor tile that rattles slightly underfoot. Nothing else is hidden here right now.
              </p>
            )}
          </div>
        )}

        {/* 10. INSPECTING PAINTING */}
        {inspectTarget === 'painting' && (
          <div className="flex flex-col items-center text-center space-y-4">
            <h3 className="text-xl font-serif font-bold text-neutral-100">
              OIL PORTRAIT
            </h3>

            {loopCount === 1 && (
              <p className="text-sm text-neutral-300 font-serif">
                A dark Victorian oil painting depicting an empty corridor with a single illuminated door at the end.
              </p>
            )}

            {loopCount >= 2 && loopCount < 7 && (
              <div className="space-y-2">
                <p className="text-sm text-purple-300 font-serif">
                  "YOU KEEP LOOKING HERE."
                </p>
                <p className="text-xs text-neutral-400">
                  The corridor in the painting now features subtle chalk tally marks on the walls matching your loop count ({loopCount}).
                </p>
              </div>
            )}

            {loopCount === 7 && (
              <div className="w-full p-4 bg-purple-950/40 border border-purple-800/60 rounded-xl space-y-2 text-left">
                <span className="text-[10px] font-mono uppercase tracking-widest text-purple-400">
                  ROOM ANALYSIS MATRIX
                </span>
                <p className="text-xs font-mono text-neutral-300">
                  DOMINANT ARCHETYPE: <span className="text-cyan-400 font-bold">{behaviorProfile.dominantTrait.toUpperCase()}</span>
                </p>
                <p className="text-xs font-mono text-neutral-300">
                  PREDICTABILITY SCORE: <span className="text-rose-400 font-bold">{behaviorProfile.predictabilityScore}%</span>
                </p>
                <p className="text-[11px] font-sans text-neutral-400 pt-1">
                  The subject of the portrait is no longer a corridor—it is a silhouette of yourself staring at this canvas.
                </p>
              </div>
            )}

            {loopCount === 8 && (
              <p className="text-sm text-neutral-400 font-serif">
                The canvas is completely blank. The paint has run down the frame like melted wax.
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
