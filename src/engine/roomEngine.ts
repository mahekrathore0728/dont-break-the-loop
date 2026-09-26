import { ActionStats, BehaviorProfile, InventoryItem, InventoryItemId, PlayerActionRecord, RoomObjectKey, RoomState, TraitName } from '../types/game';
import { sound } from '../audio/soundEngine';

export const INITIAL_ROOM_STATE: RoomState = {
  lampOn: true,
  lampUV: false,
  drawerOpen: false,
  drawerUnlocked: true,
  deskUnlocked: false,
  tileLifted: false,
  paintingTilted: false,
  mirrorDelayed: false,
  mirrorDarkReflection: false,
  doorCode: '481',
  enteredDoorCode: '',
  doorUnlocked: false,
  doorMissingHandle: false,
  doorLockedByHabit: false,
  activeDecoyTriggered: false,
  clockHands: { hour: 4, minute: 8, second: 1 },
  clockSecretFound: false,
  deskPrismSlotFilled: false,
  loop4HabitNeutralized: false,
  loop6GlitchCount: 0,
  loop8WaitingSeconds: 0,
  loop8UniqueInteractions: [],
  loop8PatternBroken: false,
  loop8TrappedCount: 0,
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
};

export const INVENTORY_ITEMS_DEF: Record<InventoryItemId, InventoryItem> = {
  brass_key: {
    id: 'brass_key',
    name: 'Brass Key',
    description: 'A heavy, cold brass key stamped with Roman numeral I.',
    iconName: 'Key',
  },
  silver_key: {
    id: 'silver_key',
    name: 'Silver Key',
    description: 'A slender silver key recovered from beneath the floor.',
    iconName: 'KeyRound',
  },
  strange_note: {
    id: 'strange_note',
    name: 'Strange Note',
    description: 'Parchment paper with ink that seems to pulse faintly.',
    iconName: 'FileText',
  },
  ornate_dial: {
    id: 'ornate_dial',
    name: 'Ornate Dial',
    description: 'A gear-rimmed dial carved with astrological markings.',
    iconName: 'Compass',
  },
  decoy_key: {
    id: 'decoy_key',
    name: 'Gleaming Key (Decoy)',
    description: 'Too bright, too obvious. It vibrates with unstable energy.',
    iconName: 'Sparkles',
  },
  prism_token: {
    id: 'prism_token',
    name: 'Prism Token',
    description: 'A dark crystal prism found in the hidden floor cavity.',
    iconName: 'Gem',
  },
  architect_core: {
    id: 'architect_core',
    name: 'Architect\'s Core',
    description: 'A pulsating anomaly taken directly from your own reflection.',
    iconName: 'Eye',
  },
};

export function getAnomalyForLoop(loop: number): number {
  switch (loop) {
    case 1: return 10;
    case 2: return 25;
    case 3: return 40;
    case 4: return 55;
    case 5: return 70;
    case 6: return 82;
    case 7: return 92;
    case 8: return 100;
    default: return 100;
  }
}

export function getLoopClueText(loop: number, profile: BehaviorProfile): { title: string; body: string } {
  switch (loop) {
    case 1:
      return {
        title: 'FOLDED PARCHMENT',
        body: 'Escape should be simple. The code is written in the hours: 4 - 8 - 1.',
      };
    case 2:
      return {
        title: 'ALTERED NOTE',
        body: 'YOU HAVE BEEN HERE BEFORE. The drawer is hollow. What lies beneath your feet does not reset.',
      };
    case 3:
      return {
        title: 'LUMINESCENT INK',
        body: 'YOU ARE NOT THE ONLY ONE WATCHING. Shadows hold what light conceals. Align the gears where III meets IX.',
      };
    case 4:
      return {
        title: 'SCRAWLED OBSERVATION',
        body: `THE ROOM WATCHES YOUR HANDS. You have a habit: ${profile.dominantTrait.toUpperCase()}. Do not do what you always do.`,
      };
    case 5:
      return {
        title: 'WARNING NOTE',
        body: 'DO NOT TRUST WHAT YOU USUALLY DO. The obvious path is bait. Trust the mirror\'s shadow, not the gleaming key.',
      };
    case 6:
      return {
        title: 'GLITCHED NOTE',
        body: 'PREDICTION SYSTEM ONLINE. The room anticipates your 3-step sequence. Defy expectations to force an override.',
      };
    case 7:
      return {
        title: 'PSYCHOLOGICAL REVEAL',
        body: 'YOU WERE NEVER TRAPPED BY THE ROOM.\n\nYOU WERE TRAPPED BY YOUR PATTERN.\n\nTO ESCAPE... DO SOMETHING YOU WOULD NEVER DO.',
      };
    case 8:
      return {
        title: 'SYSTEM REVELATION',
        body: `FINAL TRIAL: Your profile is locked as ${profile.dominantTrait.toUpperCase()} (${profile[profile.dominantTrait]}% affinity). Break this pattern to terminate the loop.`,
      };
    default:
      return {
        title: 'INFINITE LOOP',
        body: 'The loop has swallowed time. You remain predictable forever.',
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
        subtext: 'You always sprint to the exit. Stand completely still in silence for 10 seconds while the clock chimes.',
        targetCount: 10,
      };
    case 'collector':
      return {
        instruction: 'EMPTY YOUR HANDS.',
        subtext: 'You hoard every object. You cannot leave with possessions. Place all items into the drawer or hollow tile.',
        targetCount: 0,
      };
    case 'repeater':
      return {
        instruction: 'NEVER REPEAT.',
        subtext: 'You incessantly repeat actions. Interact with 4 completely distinct objects in succession without repeating any.',
        targetCount: 4,
      };
    case 'explorer':
      return {
        instruction: 'CHOOSE SINGULARLY.',
        subtext: 'You inspect everything in sight. Resist the urge: interact with ONLY the Mirror and step through.',
        targetCount: 1,
      };
    case 'observer':
    case 'patternPlayer':
    case 'riskTaker':
    default:
      return {
        instruction: 'ACT WITH DECISIVE SPEED.',
        subtext: 'You endlessly study and calculate. Break your hesitation: take immediate action within 6 seconds.',
        targetCount: 6,
      };
  }
}
