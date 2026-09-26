import { ActionStats, BehaviorProfile, PlayerActionRecord, RoomObjectKey, TraitName } from '../types/game';

export function calculateBehaviorProfile(
  stats: ActionStats,
  history: PlayerActionRecord[],
  totalLoops: number
): BehaviorProfile {
  const totalActions = history.length || 1;

  // 1. Rusher: High door attempts early in loop, low total exploration actions per loop
  const doorBias = stats.doorAttempts / totalActions;
  const avgActionsPerLoop = totalActions / Math.max(1, totalLoops);
  const fastDoorChecks = history.filter(
    h => h.target === 'door' && h.timeSinceLoopStartMs < 8000
  ).length;
  const rusher = Math.min(100, Math.round(
    (doorBias * 45) + (fastDoorChecks * 12) + (avgActionsPerLoop < 4 ? 35 : 0)
  ));

  // 2. Explorer: Inspects many different objects thoroughly
  const uniqueTargets = new Set(history.map(h => h.target)).size;
  const explorer = Math.min(100, Math.round(
    (uniqueTargets / 10) * 60 + (stats.explorationCount / Math.max(1, totalActions)) * 40
  ));

  // 3. Repeater: Consecutive clicks on the same object
  let repeatStreak = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].target === history[i - 1].target) {
      repeatStreak++;
    }
  }
  const repeater = Math.min(100, Math.round(
    (repeatStreak / Math.max(1, totalActions)) * 80 + (stats.repeatedActions * 6)
  ));

  // 4. Collector: Picks up items immediately, checks containers multiple times
  const collector = Math.min(100, Math.round(
    (stats.itemCollection * 25) + ((stats.drawerChecks + stats.tileInteractions) / Math.max(1, totalActions)) * 50
  ));

  // 5. Observer: Spends time checking notes, clocks, mirrors, paintings, and waiting
  const observationCount = stats.clockChecks + stats.paintingChecks + stats.mirrorChecks + stats.noteInteractions + stats.waitingCount;
  const observer = Math.min(100, Math.round(
    (observationCount / Math.max(1, totalActions)) * 80 + (stats.waitingCount * 10)
  ));

  // 6. Risk Taker: Pokes anomalies, dark mirror, UV mode, unprompted unusual combinations
  const riskTaker = Math.min(100, Math.round(
    (stats.lampInteractions * 8) + (stats.mirrorChecks * 8) + (stats.tileInteractions * 8)
  ));

  // 7. Pattern Player: Identical first actions or repeating 3-gram sequences across loops
  const firstActions = Object.values(stats.loopFirstActions);
  const mostCommonFirst = firstActions.reduce((acc, curr) => {
    acc[curr] = (acc[curr] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  const maxFirstRepeat = Math.max(0, ...Object.values(mostCommonFirst));
  const patternPlayer = Math.min(100, Math.round(
    (maxFirstRepeat / Math.max(1, totalLoops)) * 60 + (repeatStreak > 3 ? 30 : 10)
  ));

  // Determine dominant trait
  const traitScores: Record<TraitName, number> = {
    rusher,
    explorer,
    repeater,
    collector,
    observer,
    riskTaker,
    patternPlayer,
  };

  let dominantTrait: TraitName = 'explorer';
  let maxScore = -1;
  (Object.keys(traitScores) as TraitName[]).forEach(trait => {
    if (traitScores[trait] > maxScore) {
      maxScore = traitScores[trait];
      dominantTrait = trait;
    }
  });

  // Predictability score increases with repeated first moves, high repeater, or patternPlayer
  const predictabilityScore = Math.min(100, Math.round(
    (patternPlayer * 0.4) + (repeater * 0.3) + ((maxFirstRepeat / Math.max(1, totalLoops)) * 30)
  ));

  return {
    rusher,
    explorer,
    repeater,
    collector,
    observer,
    riskTaker,
    patternPlayer,
    dominantTrait,
    predictabilityScore,
  };
}

export function predictNextPlayerAction(
  recentSequence: RoomObjectKey[],
  dominantTrait: TraitName
): RoomObjectKey | null {
  if (recentSequence.length < 2) return null;
  const last = recentSequence[recentSequence.length - 1];

  if (dominantTrait === 'rusher') {
    return 'door';
  }
  if (dominantTrait === 'collector') {
    return last === 'drawer' ? 'tile' : 'drawer';
  }
  if (dominantTrait === 'observer') {
    return last === 'clock' ? 'painting' : 'mirror';
  }
  if (dominantTrait === 'repeater') {
    return last;
  }
  return null;
}
