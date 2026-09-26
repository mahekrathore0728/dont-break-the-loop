import { ActionStats, BehaviorProfile, PlayerActionRecord, RoomObjectKey, TraitName } from '../types/game';

export function calculateBehaviorProfile(
  stats: ActionStats,
  history: PlayerActionRecord[],
  totalLoops: number
): BehaviorProfile {
  const totalActions = history.length || 1;

  // 1. First actions across loops
  const firstActions = Object.values(stats.loopFirstActions);
  const doorFirstCount = firstActions.filter(a => a === 'door').length;

  // 2. Visit counts per object
  const objectVisits: Record<RoomObjectKey, number> = {
    door: stats.doorAttempts,
    clock: stats.clockChecks,
    painting: stats.paintingChecks,
    desk: 0,
    drawer: stats.drawerChecks,
    lamp: stats.lampInteractions,
    mirror: stats.mirrorChecks,
    note: stats.noteInteractions,
    tile: stats.tileInteractions,
    keyItem: 0,
  };

  history.forEach(h => {
    if (h.target === 'desk') objectVisits.desk++;
    if (h.target === 'keyItem') objectVisits.keyItem++;
  });

  // Find most and least visited
  let mostVisitedObject: RoomObjectKey = 'door';
  let maxVisits = -1;
  let leastVisitedObject: RoomObjectKey = 'mirror';
  let minVisits = 999999;

  (Object.keys(objectVisits) as RoomObjectKey[]).forEach(key => {
    if (key === 'keyItem') return;
    const v = objectVisits[key];
    if (v > maxVisits) {
      maxVisits = v;
      mostVisitedObject = key;
    }
    if (v < minVisits) {
      minVisits = v;
      leastVisitedObject = key;
    }
  });

  // 3. Most repeated 3-step sequence
  const sequences: Record<string, number> = {};
  for (let i = 0; i <= history.length - 3; i++) {
    const s = `${capitalize(history[i].target)} → ${capitalize(history[i+1].target)} → ${capitalize(history[i+2].target)}`;
    sequences[s] = (sequences[s] || 0) + 1;
  }
  let mostRepeatedSequence = 'Door → Clock → Drawer';
  let maxSeqCount = 0;
  Object.keys(sequences).forEach(s => {
    if (sequences[s] > maxSeqCount) {
      maxSeqCount = sequences[s];
      mostRepeatedSequence = s;
    }
  });

  // 4. Rusher Score:
  const doorBias = stats.doorAttempts / totalActions;
  const fastDoorChecks = history.filter(
    h => h.target === 'door' && h.timeSinceLoopStartMs < 7000
  ).length;
  const rusher = Math.min(100, Math.round(
    (doorBias * 40) + (fastDoorChecks * 15) + ((doorFirstCount / Math.max(1, totalLoops)) * 35)
  ));

  // 5. Explorer Score:
  const uniqueTargets = new Set(history.map(h => h.target)).size;
  const explorer = Math.min(100, Math.round(
    (uniqueTargets / 10) * 55 + (stats.explorationCount / Math.max(1, totalActions)) * 45
  ));

  // 6. Repeater Score:
  let repeatStreak = 0;
  for (let i = 1; i < history.length; i++) {
    if (history[i].target === history[i - 1].target) {
      repeatStreak++;
    }
  }
  const repeater = Math.min(100, Math.round(
    (repeatStreak / Math.max(1, totalActions)) * 75 + (stats.repeatedActions * 6)
  ));

  // 7. Collector Score:
  const collector = Math.min(100, Math.round(
    (stats.itemCollection * 30) + ((stats.drawerChecks + stats.tileInteractions) / Math.max(1, totalActions)) * 45
  ));

  // 8. Observer Score:
  const observationCount = stats.clockChecks + stats.paintingChecks + stats.mirrorChecks + stats.noteInteractions + stats.waitingCount;
  const observer = Math.min(100, Math.round(
    (observationCount / Math.max(1, totalActions)) * 75 + (stats.waitingCount * 12)
  ));

  // 9. Risk Taker:
  const riskTaker = Math.min(100, Math.round(
    (stats.lampInteractions * 9) + (stats.mirrorChecks * 9) + (stats.tileInteractions * 9)
  ));

  // 10. Pattern Player:
  const patternPlayer = Math.min(100, Math.round(
    (maxSeqCount * 25) + ((doorFirstCount / Math.max(1, totalLoops)) * 40)
  ));

  const traitScores: Record<TraitName, number> = {
    rusher,
    explorer,
    repeater,
    collector,
    observer,
    riskTaker,
    patternPlayer,
  };

  let dominantTrait: TraitName = 'rusher';
  let highestScore = -1;
  (Object.keys(traitScores) as TraitName[]).forEach(t => {
    if (traitScores[t] > highestScore) {
      highestScore = traitScores[t];
      dominantTrait = t;
    }
  });

  const predictabilityScore = Math.min(100, Math.round(
    (patternPlayer * 0.35) + (repeater * 0.3) + ((doorFirstCount / Math.max(1, totalLoops)) * 35)
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
    doorFirstCount,
    mostVisitedObject,
    mostRepeatedSequence,
    leastVisitedObject,
    rapidClickWarnings: stats.rapidClickCount || 0,
  };
}

function capitalize(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
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
  if (dominantTrait === 'patternPlayer') {
    // If sequence is A -> B, predict C from history
    if (last === 'door') return 'clock';
    if (last === 'clock') return 'drawer';
    return 'door';
  }
  return null;
}
