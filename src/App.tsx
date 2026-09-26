import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RoomObjectKey, 
  InventoryItem, 
  InventoryItemId, 
  PlayerActionRecord, 
  RoomState, 
  GameRunStats 
} from './types/game';
import { sound } from './audio/soundEngine';
import { calculateBehaviorProfile, predictNextPlayerAction } from './engine/behaviorEngine';
import { 
  INITIAL_ROOM_STATE, 
  INITIAL_ACTION_STATS, 
  INVENTORY_ITEMS_DEF, 
  getAnomalyForLoop 
} from './engine/roomEngine';
import { 
  loadGameState, 
  saveGameState, 
  saveRunHistory, 
  getRunHistory 
} from './engine/persistence';
import { HUD } from './components/HUD';
import { Toast } from './components/Toast';
import { InventoryBar } from './components/InventoryBar';
import { RoomCanvas } from './components/RoomCanvas';
import { InspectModal } from './components/InspectModal';
import { StartScreen } from './components/StartScreen';
import { Endings } from './components/Endings';
import { GlitchOverlay } from './components/GlitchOverlay';

export const App: React.FC = () => {
  const [gameState, setGameState] = useState(() => loadGameState());
  const [inspectTarget, setInspectTarget] = useState<RoomObjectKey | null>(null);
  const [inspectedItem, setInspectedItem] = useState<InventoryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [hoveredObject, setHoveredObject] = useState<RoomObjectKey | null>(null);
  const [toastMessage, setToastMessage] = useState('Find a way out. Search the desk drawer first.');
  const [toastGlitch, setToastGlitch] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLoop, setTransitionLoop] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [predictedNotice, setPredictedNotice] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<GameRunStats[]>(() => getRunHistory());

  const loopStartTimeRef = useRef(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  const showToast = useCallback((msg: string, isGlitch: boolean = false) => {
    setToastMessage(msg);
    setToastGlitch(isGlitch);
  }, []);

  const handleUpdateRoomState = useCallback((updater: (prev: RoomState) => RoomState) => {
    setGameState(prev => ({
      ...prev,
      roomState: updater(prev.roomState),
    }));
  }, []);

  const handleTakeItem = useCallback((itemId: InventoryItemId) => {
    const def = INVENTORY_ITEMS_DEF[itemId];
    if (!def) return;
    setGameState(prev => {
      if (prev.inventory.some(i => i.id === itemId)) return prev;
      const nextInv = [...prev.inventory, def];
      const nextStats = { ...prev.actionStats, itemCollection: prev.actionStats.itemCollection + 1 };
      const nextProfile = calculateBehaviorProfile(nextStats, prev.actionHistory, prev.loopCount);
      return {
        ...prev,
        inventory: nextInv,
        actionStats: nextStats,
        behaviorProfile: nextProfile,
      };
    });
  }, []);

  const handleRemoveItem = useCallback((itemId: InventoryItemId) => {
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== itemId),
    }));
    if (selectedItem?.id === itemId) setSelectedItem(null);
  }, [selectedItem]);

  const handleTriggerTrappedEnding = useCallback(() => {
    sound.playGlitch();
    const runStats: GameRunStats = {
      totalLoops: gameState.loopCount,
      dominantTrait: gameState.behaviorProfile.dominantTrait,
      anomalyPeak: 100,
      ending: 'trapped',
      completedAt: new Date().toISOString(),
    };
    saveRunHistory(runStats);
    setRunHistory(getRunHistory());

    setGameState(prev => ({
      ...prev,
      gameCompleted: true,
      ending: 'trapped',
      secondRunUnlocked: true,
      totalRunsCompleted: prev.totalRunsCompleted + 1,
    }));
  }, [gameState.loopCount, gameState.behaviorProfile.dominantTrait]);

  // Stillness counter in Loop 8 for RUSHER profile
  useEffect(() => {
    if (
      gameState.gameStarted && 
      gameState.loopCount === 8 && 
      gameState.behaviorProfile.dominantTrait === 'rusher' &&
      !gameState.roomState.loop8PatternBroken &&
      !isTransitioning
    ) {
      silenceTimerRef.current = setInterval(() => {
        handleUpdateRoomState(prev => {
          const nextSec = prev.loop8WaitingSeconds + 1;
          if (nextSec % 3 === 0 && nextSec <= 9) {
            sound.playChime(1);
          }
          if (nextSec >= 10) {
            sound.playChime(3);
            sound.playDoorOpen();
            showToast('The clock strikes three in absolute silence. PATTERN BROKEN: RUSHER.');
            return { ...prev, loop8WaitingSeconds: 10, loop8PatternBroken: true };
          }
          return { ...prev, loop8WaitingSeconds: nextSec };
        });
      }, 1000);
    }
    return () => {
      if (silenceTimerRef.current) clearInterval(silenceTimerRef.current);
    };
  }, [gameState.gameStarted, gameState.loopCount, gameState.behaviorProfile.dominantTrait, gameState.roomState.loop8PatternBroken, isTransitioning, handleUpdateRoomState, showToast]);

  // Wait / Observe action handler
  const handleWaitAction = useCallback(() => {
    sound.playTick();
    const now = Date.now();
    const timeSinceStart = now - loopStartTimeRef.current;

    const newRecord: PlayerActionRecord = {
      id: `wait_${now}`,
      loop: gameState.loopCount,
      target: 'clock',
      actionType: 'wait',
      timestamp: now,
      timeSinceLoopStartMs: timeSinceStart,
    };

    setGameState(prev => {
      const updatedStats = {
        ...prev.actionStats,
        waitingCount: prev.actionStats.waitingCount + 1,
      };
      const updatedHistory = [...prev.actionHistory, newRecord];
      const updatedProfile = calculateBehaviorProfile(updatedStats, updatedHistory, prev.loopCount);
      const updatedRoom = { ...prev.roomState };

      // Loop 8 observer pattern break
      if (prev.loopCount === 8 && (prev.behaviorProfile.dominantTrait === 'observer' || prev.behaviorProfile.dominantTrait === 'patternPlayer') && !updatedRoom.loop8PatternBroken) {
        if (updatedStats.waitingCount >= 3) {
          updatedRoom.loop8PatternBroken = true;
          sound.playDoorOpen();
          showToast('Deep contemplation acknowledged. PATTERN BROKEN: OBSERVER.');
        }
      }

      return {
        ...prev,
        actionStats: updatedStats,
        actionHistory: updatedHistory,
        behaviorProfile: updatedProfile,
        roomState: updatedRoom,
      };
    });

    if (gameState.loopCount === 8 && (gameState.behaviorProfile.dominantTrait === 'observer' || gameState.behaviorProfile.dominantTrait === 'patternPlayer')) {
      showToast('You close your eyes and listen deeply to the room\'s pendulum.');
    } else if (gameState.actionStats.waitingCount > 3) {
      showToast('Time freezes for an instant. Shadows stretch without movement.');
    } else {
      showToast('You stand still in the room, observing the ticking clock.');
    }
  }, [gameState.loopCount, gameState.actionStats.waitingCount, gameState.behaviorProfile.dominantTrait, showToast]);

  // Object Click handler & Behavioral Tracking
  const handleObjectClick = useCallback((target: RoomObjectKey) => {
    sound.playClick();
    const now = Date.now();
    const timeSinceStart = now - loopStartTimeRef.current;

    const newRecord: PlayerActionRecord = {
      id: `action_${now}`,
      loop: gameState.loopCount,
      target,
      actionType: 'inspect',
      timestamp: now,
      timeSinceLoopStartMs: timeSinceStart,
    };

    setGameState(prev => {
      const isFirst = !prev.actionStats.loopFirstActions[prev.loopCount];
      const firstActions = isFirst 
        ? { ...prev.actionStats.loopFirstActions, [prev.loopCount]: target }
        : prev.actionStats.loopFirstActions;

      const recentSeq = [...prev.actionStats.recentActionSequence, target].slice(-5);
      const lastAction = prev.actionHistory[prev.actionHistory.length - 1];
      const isRepeat = lastAction && lastAction.target === target;

      const updatedStats = {
        ...prev.actionStats,
        doorAttempts: prev.actionStats.doorAttempts + (target === 'door' ? 1 : 0),
        clockChecks: prev.actionStats.clockChecks + (target === 'clock' ? 1 : 0),
        paintingChecks: prev.actionStats.paintingChecks + (target === 'painting' ? 1 : 0),
        drawerChecks: prev.actionStats.drawerChecks + (target === 'drawer' ? 1 : 0),
        mirrorChecks: prev.actionStats.mirrorChecks + (target === 'mirror' ? 1 : 0),
        lampInteractions: prev.actionStats.lampInteractions + (target === 'lamp' ? 1 : 0),
        noteInteractions: prev.actionStats.noteInteractions + (target === 'note' ? 1 : 0),
        tileInteractions: prev.actionStats.tileInteractions + (target === 'tile' ? 1 : 0),
        explorationCount: prev.actionStats.explorationCount + 1,
        repeatedActions: prev.actionStats.repeatedActions + (isRepeat ? 1 : 0),
        recentActionSequence: recentSeq,
        loopFirstActions: firstActions,
      };

      const updatedHistory = [...prev.actionHistory, newRecord];
      const updatedProfile = calculateBehaviorProfile(updatedStats, updatedHistory, prev.loopCount);
      const updatedRoom = { ...prev.roomState };

      // Loop 1 natural guidance toasts if inspected out of order:
      if (prev.loopCount === 1) {
        if (target === 'door' && !updatedRoom.doorUnlocked) {
          showToast('The keypad requires 3 digits. Open the desk drawer to find a key.');
        } else if (target === 'desk' && !updatedRoom.deskUnlocked && !prev.inventory.some(i => i.id === 'brass_key')) {
          showToast('Locked. The brass keyhole requires the key from the desk drawer.');
        }
      }

      // Loop 4 player habit reaction:
      if (prev.loopCount === 4) {
        if (target === 'mirror' || target === 'lamp' || target === 'tile') {
          if (!updatedRoom.loop4HabitNeutralized) {
            updatedRoom.loop4HabitNeutralized = true;
            sound.playChime(1);
            showToast('HABIT NEUTRALIZED! The scalding handle has cooled down.');
          }
        }
      }

      // Loop 6: Prediction check
      if (prev.loopCount === 6) {
        const predicted = predictNextPlayerAction(recentSeq, updatedProfile.dominantTrait);
        if (predicted === target) {
          sound.playGlitch();
          showToast(`PREDICTION CONFIRMED: The room anticipated you checking ${target.toUpperCase()}!`, true);
        } else if (recentSeq.length >= 3) {
          updatedRoom.loop6GlitchCount += 1;
          sound.playChime(1);
          if (updatedRoom.loop6GlitchCount >= 3) {
            updatedRoom.doorUnlocked = true;
            sound.playDoorOpen();
            showToast('PREDICTION ENGINE OVERLOAD! 3 predictions defied. The door unlocks!');
          } else {
            showToast(`PREDICTION FAILED (${updatedRoom.loop6GlitchCount}/3)! You defied the room\'s prediction.`);
          }
        }
      }

      // Loop 8 dynamic checks
      if (prev.loopCount === 8) {
        if (updatedProfile.dominantTrait === 'rusher' && !updatedRoom.loop8PatternBroken) {
          updatedRoom.loop8WaitingSeconds = 0;
          showToast('Movement detected! Stillness timer reset to 0s.');
        }

        if (updatedProfile.dominantTrait === 'repeater' && !updatedRoom.loop8PatternBroken) {
          const prevInteractions = updatedRoom.loop8UniqueInteractions || [];
          if (!prevInteractions.includes(target)) {
            const nextList = [...prevInteractions, target];
            updatedRoom.loop8UniqueInteractions = nextList;
            if (nextList.length >= 4) {
              updatedRoom.loop8PatternBroken = true;
              sound.playDoorOpen();
              showToast('Four unique objects touched with zero repeats. PATTERN BROKEN: REPEATER!');
            } else {
              showToast(`Unique objects inspected: ${nextList.length} / 4`);
            }
          } else {
            updatedRoom.loop8UniqueInteractions = [target];
            showToast('Repetition detected! Pattern reset. Touch 4 distinct objects.');
          }
        }

        if (isRepeat) {
          updatedRoom.loop8TrappedCount = (updatedRoom.loop8TrappedCount || 0) + 1;
          if (updatedRoom.loop8TrappedCount >= 5) {
            handleTriggerTrappedEnding();
          }
        }
      }

      return {
        ...prev,
        actionStats: updatedStats,
        actionHistory: updatedHistory,
        behaviorProfile: updatedProfile,
        roomState: updatedRoom,
      };
    });

    const pred = predictNextPlayerAction(gameState.actionStats.recentActionSequence, gameState.behaviorProfile.dominantTrait);
    if (pred && gameState.loopCount >= 5) {
      setPredictedNotice(`ROOM PREDICTS: ${pred.toUpperCase()}`);
    } else {
      setPredictedNotice(null);
    }

    setInspectTarget(target);
    setInspectedItem(null);
  }, [gameState.loopCount, gameState.actionStats, gameState.actionHistory, gameState.behaviorProfile, showToast, handleTriggerTrappedEnding]);

  // Transition to next loop
  const handleTransitionToLoop = useCallback((nextLoop: number) => {
    setIsTransitioning(true);
    setInspectTarget(null);
    setInspectedItem(null);
    setSelectedItem(null);
    sound.playDoorRattle();

    setTimeout(() => {
      loopStartTimeRef.current = Date.now();
      const nextAnomaly = getAnomalyForLoop(nextLoop);
      sound.startAmbience(nextAnomaly);

      setGameState(prev => {
        const freshRoom: RoomState = {
          ...INITIAL_ROOM_STATE,
          loop8UniqueInteractions: [],
          doorMissingHandle: nextLoop === 4 && prev.behaviorProfile.dominantTrait === 'rusher',
        };

        const preservedInventory = prev.inventory.filter(i => i.id !== 'brass_key' && i.id !== 'decoy_key');

        return {
          ...prev,
          loopCount: nextLoop,
          anomalyLevel: nextAnomaly,
          roomState: freshRoom,
          inventory: preservedInventory,
        };
      });

      setIsTransitioning(false);

      if (nextLoop === 2) {
        showToast('LOOP 02. The key is gone. Desk scratches point down to the floor.');
      } else if (nextLoop === 3) {
        showToast('LOOP 03. Shadows flicker without wind. Test the UV blacklight.');
      } else if (nextLoop === 4) {
        showToast('LOOP 04. The room knows your habit. Touch an unvisited object to cool the handle.');
      } else if (nextLoop === 5) {
        showToast('LOOP 05. The gleaming key is bait. The mirror reflection points to the truth.');
      } else if (nextLoop === 6) {
        showToast('LOOP 06. Predictive system online. Defy 3 predicted moves to crash the lock.');
      } else if (nextLoop === 7) {
        showToast('LOOP 07. Inspect the Oil Portrait to reveal your psychological profile.');
      } else if (nextLoop === 8) {
        showToast('LOOP 08. FINAL TRIAL: Violate your dominant behavioral instinct to escape.');
      }
    }, 1800);
  }, [showToast]);

  const handleDoorEscapeAttempt = useCallback(() => {
    if (gameState.loopCount < 8) {
      handleTransitionToLoop(gameState.loopCount + 1);
    } else {
      handleTriggerEscapeEnding();
    }
  }, [gameState.loopCount, handleTransitionToLoop]);

  const handleTriggerEscapeEnding = useCallback(() => {
    const runStats: GameRunStats = {
      totalLoops: gameState.loopCount,
      dominantTrait: gameState.behaviorProfile.dominantTrait,
      anomalyPeak: gameState.anomalyLevel,
      ending: 'escape',
      completedAt: new Date().toISOString(),
    };
    saveRunHistory(runStats);
    setRunHistory(getRunHistory());

    setGameState(prev => ({
      ...prev,
      gameCompleted: true,
      ending: 'escape',
      secondRunUnlocked: true,
      totalRunsCompleted: prev.totalRunsCompleted + 1,
    }));
  }, [gameState.loopCount, gameState.behaviorProfile.dominantTrait, gameState.anomalyLevel]);

  const handleTriggerSecretEnding = useCallback(() => {
    const runStats: GameRunStats = {
      totalLoops: gameState.loopCount,
      dominantTrait: gameState.behaviorProfile.dominantTrait,
      anomalyPeak: 100,
      ending: 'secret',
      completedAt: new Date().toISOString(),
    };
    saveRunHistory(runStats);
    setRunHistory(getRunHistory());

    setGameState(prev => ({
      ...prev,
      gameCompleted: true,
      ending: 'secret',
      secondRunUnlocked: true,
      totalRunsCompleted: prev.totalRunsCompleted + 1,
    }));
  }, [gameState.loopCount, gameState.behaviorProfile.dominantTrait]);

  const handleStartGame = useCallback(() => {
    loopStartTimeRef.current = Date.now();
    setGameState(prev => ({
      ...prev,
      gameStarted: true,
      gameCompleted: false,
      ending: null,
      loopCount: 1,
      anomalyLevel: 10,
      inventory: [],
      roomState: { ...INITIAL_ROOM_STATE, loop8UniqueInteractions: [] },
      actionStats: { ...INITIAL_ACTION_STATS, loopFirstActions: {}, recentActionSequence: [] },
      actionHistory: [],
    }));
    showToast('Find a way out. Search the desk drawer first.');
  }, [showToast]);

  const handleToggleMute = useCallback(() => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  }, []);

  const handleResetLoop = useCallback(() => {
    sound.playClick();
    setGameState(prev => ({
      ...prev,
      roomState: { ...INITIAL_ROOM_STATE, loop8UniqueInteractions: [] },
    }));
    setInspectTarget(null);
    setInspectedItem(null);
    showToast('The current loop has been reset.');
  }, [showToast]);

  return (
    <main className="relative min-h-screen w-full bg-[#030407] text-neutral-100 flex flex-col items-center justify-center p-4 overflow-hidden select-none">
      <GlitchOverlay anomalyLevel={gameState.anomalyLevel} />

      {!gameState.gameStarted && (
        <StartScreen
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          secondRunUnlocked={gameState.secondRunUnlocked}
          runHistory={runHistory}
        />
      )}

      {gameState.gameStarted && !gameState.gameCompleted && (
        <div className="relative w-full max-w-5xl flex flex-col items-center justify-center space-y-4">
          <HUD
            loopCount={gameState.loopCount}
            anomalyLevel={gameState.anomalyLevel}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onResetLoop={handleResetLoop}
            onWaitAction={handleWaitAction}
            predictedActionNotice={predictedNotice}
          />

          <div className="relative w-full flex items-center justify-center pt-8 pb-12">
            <RoomCanvas
              loopCount={gameState.loopCount}
              anomalyLevel={gameState.anomalyLevel}
              roomState={gameState.roomState}
              behaviorProfile={gameState.behaviorProfile}
              inventory={gameState.inventory}
              onObjectClick={handleObjectClick}
              hoveredObject={hoveredObject}
              setHoveredObject={setHoveredObject}
            />
          </div>

          <InspectModal
            inspectTarget={inspectTarget}
            inspectedItem={inspectedItem}
            loopCount={gameState.loopCount}
            anomalyLevel={gameState.anomalyLevel}
            roomState={gameState.roomState}
            inventory={gameState.inventory}
            behaviorProfile={gameState.behaviorProfile}
            selectedItem={selectedItem}
            onClose={() => {
              setInspectTarget(null);
              setInspectedItem(null);
            }}
            onTakeItem={handleTakeItem}
            onRemoveItem={handleRemoveItem}
            onUpdateRoomState={handleUpdateRoomState}
            onDoorEscapeAttempt={handleDoorEscapeAttempt}
            onTriggerSecretEnding={handleTriggerSecretEnding}
            onTriggerTrappedEnding={handleTriggerTrappedEnding}
            onActionFeedback={showToast}
          />

          <Toast message={toastMessage} isGlitch={toastGlitch} />

          <InventoryBar
            inventory={gameState.inventory}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onExamineItem={item => setInspectedItem(item)}
          />
        </div>
      )}

      {gameState.gameCompleted && gameState.ending && (
        <Endings
          ending={gameState.ending}
          loopCount={gameState.loopCount}
          anomalyLevel={gameState.anomalyLevel}
          behaviorProfile={gameState.behaviorProfile}
          onPlayAgain={handleStartGame}
        />
      )}

      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center space-y-4 animate-fadeIn">
          <div className="w-8 h-8 rounded-full border-2 border-[#8a6030] border-t-transparent animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-[#c9a96e]">
            {`ENTERING LOOP 0${gameState.loopCount + 1}...`}
          </p>
        </div>
      )}
    </main>
  );
};
