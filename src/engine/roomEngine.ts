import { ActionStats, BehaviorProfile, InventoryItem, InventoryItemId, RoomObjectKey, RoomState, TraitName } from '../types/game';

export const INITIAL_ROOM_STATE: RoomState = {
  lampOn: true,
  lampUV: false,
  drawerOpen: false,
  drawerUnlocked: true,
  drawerBolted: false,
  deskUnlocked: false,
  tileLifted: false,
  paintingTilted: false,
  mirrorDelayed: false,
  mirrorDarkReflection: false,
  doorCode: '481',
  enteredDoorCode: '',
  doorUnlocked: false,
  doorOpen: false,
  doorMissingHandle: false,
  doorLockedByHabit: false,
  activeDecoyTriggered: false,
  clockHands: { hour: 4, minute: 8, second: 1 },
  clockSecretFound: false,
  clockStopped: false,
  deskPrismSlotFilled: false,
  loop4HabitNeutralized: false,
  loop6GlitchCount: 0,
  loop8WaitingSeconds: 0,
  loop8UniqueInteractions: [],
  loop8PatternBroken: false,
  loop8TrappedCount: 0,
  predictedNextObject: null,
};

export const INITIAL_ACTION_STATS: ActionStats = {
  doorAttempts: 0,
  clockChecks: 0,
  paintingChecks: 0,
  drawerChecks: 0,
  mirrorChecks: 0,
  lampInteractions: 0,
  noteInteractions: 0,
  tileInteractions: 0,
  waitingCount: 0,
  itemCollection: 0,
  clueUsage: 0,
  repeatedActions: 0,
  explorationCount: 0,
  recentActionSequence: [],
  loopFirstActions: {},
  rapidClickCount: 0,
  lastClickTimestamp: 0,
};

export const INVENTORY_ITEMS_DEF: Record<InventoryItemId, InventoryItem> = {
  brass_key: {
    id: 'brass_key',
    name: 'Brass Key',
    description: 'Cold, heavy brass with a worn bit. Stamped with Roman numeral I.',
    iconName: 'Key',
  },
  silver_key: {
    id: 'silver_key',
    name: 'Silver Key',
    description: 'A slender silver key recovered from the hollow floorboard.',
    iconName: 'KeyRound',
  },
  strange_note: {
    id: 'strange_note',
    name: 'Strange Note',
    description: 'Yellowed parchment. The handwriting looks uncomfortably familiar.',
    iconName: 'FileText',
  },
  ornate_dial: {
    id: 'ornate_dial',
    name: 'Ornate Brass Dial',
    description: 'A gear-rimmed dial carved with astrological markings.',
    iconName: 'Compass',
  },
  decoy_key: {
    id: 'decoy_key',
    name: 'Gleaming Key (Trap)',
    description: 'Too bright, too obvious. It vibrates with deceptive static.',
    iconName: 'Sparkles',
  },
  prism_token: {
    id: 'prism_token',
    name: 'Prism Token',
    description: 'A faceted dark crystal revealed from the mirror\'s angle.',
    iconName: 'Gem',
  },
  architect_core: {
    id: 'architect_core',
    name: 'Architect\'s Core',
    description: 'A pulsating anomaly taken directly from your own reflection\'s hand.',
    iconName: 'Eye',
  },
};

export function getAnomalyForLoop(loop: number): number {
  switch (loop) {
    case 1: return 0;
    case 2: return 20;
    case 3: return 40;
    case 4: return 55;
    case 5: return 70;
    case 6: return 85;
    case 7: return 95;
    case 8: return 100;
    default: return 100;
  }
}

export function getLoopClueText(loop: number, profile: BehaviorProfile): { title: string; body: string } {
  switch (loop) {
    case 1:
      return {
        title: 'STRANGE NOTE',
        body: 'Escape should be simple.\n\nThe code is written in the hours.\n\n4 - 8 - 1',
      };
    case 2:
      return {
        title: 'ALTERED NOTE',
        body: 'YOU HAVE BEEN HERE BEFORE.\n\nLook beneath what you tread upon. What lies in the floor does not reset.',
      };
    case 3:
      return {
        title: 'LUMINESCENT INK',
        body: 'YOU ARE NOT THE ONLY ONE WATCHING.\n\nShadows hold what light conceals. Align the gears where III meets IX.',
      };
    case 4:
      return {
        title: 'SCRAWLED OBSERVATION',
        body: `The room is watching your hands.\n\nStop doing what you did before. Break your habit: ${profile.dominantTrait.toUpperCase()}.`,
      };
    case 5:
      return {
        title: 'WARNING NOTE',
        body: 'THE ROOM CAN LIE.\n\nThe gleaming key is bait. Trust the mirror\'s hidden angle, not the obvious treasure.',
      };
    case 6:
      return {
        title: 'GLITCHED NOTE',
        body: 'PREDICTION SYSTEM ACTIVE.\n\nThe room knows your sequence. Defy expectations to trigger a system error.',
      };
    case 7:
      return {
        title: 'PSYCHOMETRIC REVEAL',
        body: `YOU CHECKED THE DOOR FIRST: ${profile.doorFirstCount} TIMES\nMOST VISITED: ${(profile.mostVisitedObject ?? 'unknown').toUpperCase()}\nMOST COMMON SEQUENCE: ${(profile.mostRepeatedSequence ?? 'none detected')}\n\nYOUR PATTERN: ${profile.dominantTrait.toUpperCase()} (${profile[profile.dominantTrait]}%)\n\nYOU WERE NEVER TRAPPED BY THE ROOM.\nYOU WERE TRAPPED BY YOUR PATTERN.\n\nTO ESCAPE... DO SOMETHING YOU WOULD NEVER DO.`,
      };
    case 8:
      return {
        title: 'FINAL TRIAL',
        body: `FINAL PATTERN BREAK: You are ${profile.dominantTrait.toUpperCase()}. The door will only open if you violate this instinct.`,
      };
    default:
      return {
        title: 'INFINITE LOOP',
        body: 'The room knows you better than you know yourself.',
      };
  }
}

export function getFinalPuzzleRequirement(trait: TraitName): {
  instruction: string;
  subtext: string;
  targetCount: number;
} {
  switch (trait) {
    case 'rusher':
      return {
        instruction: 'BE STILL. DO NOT RUSH.',
        subtext: 'You sprint to exits without pause. Stand completely still in silence for 10 seconds while the clock chimes.',
        targetCount: 10,
      };
    case 'collector':
      return {
        instruction: 'EMPTY YOUR HANDS.',
        subtext: 'You hoard every possession. You cannot leave while clinging to items. Return everything to the room.',
        targetCount: 0,
      };
    case 'repeater':
      return {
        instruction: 'NEVER REPEAT.',
        subtext: 'You compulsively click the same objects. Touch 4 completely different objects in succession with zero repeats.',
        targetCount: 4,
      };
    case 'explorer':
      return {
        instruction: 'ACT SINGULARLY.',
        subtext: 'You inspect everything in sight. Resist the urge: interact with ONLY the Mirror and step through.',
        targetCount: 1,
      };
    case 'observer':
    case 'patternPlayer':
    case 'riskTaker':
    default:
      return {
        instruction: 'ACT WITH DECISIVE SPEED.',
        subtext: 'You endlessly study and calculate. Break your hesitation: make an unhesitating choice within 6 seconds.',
        targetCount: 6,
      };
  }
}
