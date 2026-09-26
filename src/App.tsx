import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  RoomObjectKey, 
  InventoryItem, 
  InventoryItemId, 
  PlayerActionRecord, 
  EndingType, 
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
  const [toastMessage, setToastMessage] = useState('Find a way out.');
  const [toastGlitch, setToastGlitch] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [predictedNotice, setPredictedNotice] = useState<string | null>(null);
  const [runHistory, setRunHistory] = useState<GameRunStats[]>(() => getRunHistory());

  const loopStartTimeRef = useRef(Date.now());
  const silenceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-save on meaningful state changes
  useEffect(() => {
    saveGameState(gameState);
  }, [gameState]);

  // Handle toast notification
  const showToast = useCallback((msg: string, isGlitch: boolean = false) => {
    setToastMessage(msg);
    setToastGlitch(isGlitch);
  }, []);

  // Update room state helper
  const handleUpdateRoomState = useCallback((updater: (prev: RoomState) => RoomState) => {
    setGameState(prev => ({
      ...prev,
      roomState: updater(prev.roomState),
    }));
  }, []);

  // Add Item to inventory
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

  // Remove Item from inventory
  const handleRemoveItem = useCallback((itemId: InventoryItemId) => {
    setGameState(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== itemId),
    }));
    if (selectedItem?.id === itemId) setSelectedItem(null);
  }, [selectedItem]);

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
            sound.playDoor(true);
            showToast('The grandfather clock strikes three. The door recognizes your stillness. PATTERN BROKEN: RUSHER.');
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

  // Object Click handler & Behavioral Tracking
  const handleObjectClick = useCallback((target: RoomObjectKey) => {
    sound.playClick();
    const now = Date.now();
    const timeSinceStart = now - loopStartTimeRef.current;

    // Record action
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

      // Check repeats
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

      // Room State adaptations:
      const updatedRoom = { ...prev.roomState };

      // Loop 4 habit neutralizing:
      if (prev.loopCount === 4) {
        if (target === 'mirror' || target === 'lamp' || target === 'tile') {
          updatedRoom.loop4HabitNeutralized = true;
        }
      }

      // Loop 6: Prediction check
      if (prev.loopCount === 6) {
        const predicted = predictNextPlayerAction(recentSeq, updatedProfile.dominantTrait);
        if (predicted === target) {
          sound.playGlitch();
          showToast('PREDICTION CONFIRMED: Object temporarily resists your hand.', true);
        } else if (recentSeq.length >= 3) {
          updatedRoom.loop6GlitchCount += 1;
          if (updatedRoom.loop6GlitchCount >= 3) {
            updatedRoom.doorUnlocked = true;
            sound.playDoor(true);
            showToast('PREDICTION FAILED. System error. The door unlocks.');
          }
        }
      }

      // Loop 8 dynamic checks
      if (prev.loopCount === 8) {
        // If Rusher clicked an object: resets silence timer!
        if (updatedProfile.dominantTrait === 'rusher' && !updatedRoom.loop8PatternBroken) {
          updatedRoom.loop8WaitingSeconds = 0;
          showToast('Movement detected. Stillness countdown reset.');
        }

        // If Repeater: must click 4 distinct objects
        if (updatedProfile.dominantTrait === 'repeater' && !updatedRoom.loop8PatternBroken) {
          const prevInteractions = updatedRoom.loop8UniqueInteractions || [];
          if (!prevInteractions.includes(target)) {
            const nextList = [...prevInteractions, target];
            updatedRoom.loop8UniqueInteractions = nextList;
            if (nextList.length >= 4) {
              updatedRoom.loop8PatternBroken = true;
              sound.playDoor(true);
              showToast('Four unique interactions with zero repetition. PATTERN BROKEN: REPEATER.');
            } else {
              showToast(`Unique objects inspected: ${nextList.length} / 4`);
            }
          } else {
            updatedRoom.loop8UniqueInteractions = [target];
            showToast('Repetition detected! Pattern reset. You must touch 4 distinct objects.');
          }
        }

        // If user stubbornly repeats the same habit in Loop 8:
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

    // Check prediction whisper
    const pred = predictNextPlayerAction(gameState.actionStats.recentActionSequence, gameState.behaviorProfile.dominantTrait);
    if (pred && gameState.loopCount >= 5) {
      setPredictedNotice(`ROOM PREDICTS: ${pred.toUpperCase()}`);
    } else {
      setPredictedNotice(null);
    }

    // Open inspection modal
    setInspectTarget(target);
    setInspectedItem(null);
  }, [gameState.loopCount, gameState.actionStats, gameState.actionHistory, gameState.behaviorProfile, showToast]);

  // Transition to next loop
  const handleTransitionToLoop = useCallback((nextLoop: number) => {
    setIsTransitioning(true);
    setInspectTarget(null);
    setInspectedItem(null);
    setSelectedItem(null);
    sound.playDoor(false);

    setTimeout(() => {
      loopStartTimeRef.current = Date.now();
      const nextAnomaly = getAnomalyForLoop(nextLoop);
      sound.startAmbience(nextAnomaly);

      setGameState(prev => {
        // Reset room state for new loop but maintain persistent logic
        const freshRoom: RoomState = {
          ...INITIAL_ROOM_STATE,
          loop8UniqueInteractions: [],
          doorMissingHandle: nextLoop === 4 && prev.behaviorProfile.dominantTrait === 'rusher',
        };

        // Inventory management: in Loop 1 -> 2, silver key is in floor tile, player keeps note
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
        showToast('LOOP 02. The air feels colder. The key is not where it was.');
      } else if (nextLoop === 3) {
        showToast('LOOP 03. Shadows flicker without wind. The mirror is watching.');
      } else if (nextLoop === 4) {
        showToast('LOOP 04. The door handle feels scalding. The room knows your first move.');
      } else if (nextLoop === 5) {
        showToast('LOOP 05. The obvious clue is bait. Do not trust what you usually do.');
      } else if (nextLoop === 6) {
        showToast('LOOP 06. The room is predicting you. Defy the pattern.');
      } else if (nextLoop === 7) {
        showToast('LOOP 07. "YOU WERE NEVER TRAPPED BY THE ROOM. YOU WERE TRAPPED BY YOUR PATTERN."');
      } else if (nextLoop === 8) {
        showToast('LOOP 08. FINAL TRIAL: Stop playing like yourself.');
      }
    }, 1800);
  }, [showToast]);

  // Escape attempt through door
  const handleDoorEscapeAttempt = useCallback(() => {
    if (gameState.loopCount < 8) {
      handleTransitionToLoop(gameState.loopCount + 1);
    } else {
      // Loop 8 Escape
      handleTriggerEscapeEnding();
    }
  }, [gameState.loopCount, handleTransitionToLoop]);

  // ENDING 1: ESCAPE
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

  // ENDING 2: TRAPPED
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

  // ENDING 3: SECRET
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

  // Start new run / Play Again
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
    showToast('Find a way out.');
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
      {/* Glitch CRT Overlay */}
      <GlitchOverlay anomalyLevel={gameState.anomalyLevel} />

      {/* 1. START SCREEN */}
      {!gameState.gameStarted && (
        <StartScreen
          onStartGame={handleStartGame}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          secondRunUnlocked={gameState.secondRunUnlocked}
          runHistory={runHistory}
        />
      )}

      {/* 2. MAIN ACTIVE GAME VIEW */}
      {gameState.gameStarted && !gameState.gameCompleted && (
        <div className="relative w-full max-w-5xl flex flex-col items-center justify-center space-y-4">
          {/* Top HUD */}
          <HUD
            loopCount={gameState.loopCount}
            anomalyLevel={gameState.anomalyLevel}
            isMuted={isMuted}
            onToggleMute={handleToggleMute}
            onResetLoop={handleResetLoop}
            predictedActionNotice={predictedNotice}
          />

          {/* Interactive Room Canvas */}
          <div className="relative w-full flex items-center justify-center pt-8 pb-12">
            <RoomCanvas
              loopCount={gameState.loopCount}
              anomalyLevel={gameState.anomalyLevel}
              roomState={gameState.roomState}
              behaviorProfile={gameState.behaviorProfile}
              onObjectClick={handleObjectClick}
              hoveredObject={hoveredObject}
              setHoveredObject={setHoveredObject}
            />
          </div>

          {/* Inspection Modal */}
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

          {/* Narrative Toast Bar */}
          <Toast message={toastMessage} isGlitch={toastGlitch} />

          {/* Player Inventory Bar */}
          <InventoryBar
            inventory={gameState.inventory}
            selectedItem={selectedItem}
            onSelectItem={setSelectedItem}
            onExamineItem={item => setInspectedItem(item)}
          />
        </div>
      )}

      {/* 3. CINEMATIC ENDING SCREEN */}
      {gameState.gameCompleted && gameState.ending && (
        <Endings
          ending={gameState.ending}
          loopCount={gameState.loopCount}
          anomalyLevel={gameState.anomalyLevel}
          behaviorProfile={gameState.behaviorProfile}
          onPlayAgain={handleStartGame}
        />
      )}

      {/* 4. BLACKOUT FADE TRANSITION BETWEEN LOOPS */}
      {isTransitioning && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center space-y-4 animate-fadeIn">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-400 border-t-transparent animate-spin" />
          <p className="font-mono text-xs uppercase tracking-widest text-neutral-400">
            RESETTING SPATIAL ANCHORS...
          </p>
        </div>
      )}
    </main>
  );
};
