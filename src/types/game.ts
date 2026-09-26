export type RoomObjectKey = 
  | 'door'
  | 'clock'
  | 'painting'
  | 'desk'
  | 'drawer'
  | 'lamp'
  | 'mirror'
  | 'note'
  | 'tile'
  | 'keyItem';

export type CameraFocus = RoomObjectKey | null;

export type ActionType = 
  | 'inspect'
  | 'use_item'
  | 'toggle_lamp'
  | 'open_drawer'
  | 'close_drawer'
  | 'lift_tile'
  | 'take_item'
  | 'enter_code'
  | 'wait'
  | 'touch_reflection';

export type InventoryItemId = 
  | 'brass_key'
  | 'silver_key'
  | 'strange_note'
  | 'ornate_dial'
  | 'decoy_key'
  | 'prism_token'
  | 'architect_core';

export interface InventoryItem {
  id: InventoryItemId;
  name: string;
  description: string;
  iconName: string;
}

export interface PlayerActionRecord {
  id: string;
  loop: number;
  target: RoomObjectKey;
  actionType: ActionType;
  timestamp: number;
  timeSinceLoopStartMs: number;
}

export type TraitName = 
  | 'rusher'
  | 'explorer'
  | 'repeater'
  | 'collector'
  | 'observer'
  | 'riskTaker'
  | 'patternPlayer';

export interface BehaviorProfile {
  rusher: number;          // 0 - 100
  explorer: number;        // 0 - 100
  repeater: number;        // 0 - 100
  collector: number;       // 0 - 100
  observer: number;        // 0 - 100
  riskTaker: number;       // 0 - 100
  patternPlayer: number;   // 0 - 100
  dominantTrait: TraitName;
  predictabilityScore: number; // 0 - 100
  
  // Real tracking specifics for Loop 7 reveal
  doorFirstCount: number;
  mostVisitedObject: RoomObjectKey | null;
  mostRepeatedSequence: string | null;
  leastVisitedObject: RoomObjectKey | null;
  rapidClickWarnings: number;
}

export interface ActionStats {
  doorAttempts: number;
  clockChecks: number;
  paintingChecks: number;
  drawerChecks: number;
  mirrorChecks: number;
  lampInteractions: number;
  noteInteractions: number;
  tileInteractions: number;
  waitingCount: number;
  itemCollection: number;
  clueUsage: number;
  repeatedActions: number;
  explorationCount: number;
  recentActionSequence: RoomObjectKey[];
  loopFirstActions: Record<number, RoomObjectKey>;
  rapidClickCount: number;
  lastClickTimestamp: number;
}

export interface RoomState {
  lampOn: boolean;
  lampUV: boolean;
  drawerOpen: boolean;
  drawerUnlocked: boolean;
  drawerBolted: boolean;
  deskUnlocked: boolean;
  tileLifted: boolean;
  paintingTilted: boolean;
  mirrorDelayed: boolean;
  mirrorDarkReflection: boolean;
  doorCode: string;
  enteredDoorCode: string;
  doorUnlocked: boolean;
  doorOpen: boolean;
  doorMissingHandle: boolean;
  doorLockedByHabit: boolean;
  activeDecoyTriggered: boolean;
  clockHands: { hour: number; minute: number; second: number };
  clockSecretFound: boolean;
  clockStopped: boolean;
  deskPrismSlotFilled: boolean;
  loop4HabitNeutralized: boolean;
  loop6GlitchCount: number;
  loop8WaitingSeconds: number;
  loop8UniqueInteractions: RoomObjectKey[];
  loop8PatternBroken: boolean;
  loop8TrappedCount: number;
  predictedNextObject: RoomObjectKey | null;
}

export type EndingType = 'escape' | 'trapped' | 'secret';

export interface GameRunStats {
  totalLoops: number;
  dominantTrait: TraitName;
  anomalyPeak: number;
  ending: EndingType;
  completedAt: string;
}

export interface GameSaveState {
  version: number;
  loopCount: number;
  anomalyLevel: number;
  actionStats: ActionStats;
  actionHistory: PlayerActionRecord[];
  behaviorProfile: BehaviorProfile;
  inventory: InventoryItem[];
  cluesFound: string[];
  roomState: RoomState;
  gameStarted: boolean;
  gameCompleted: boolean;
  ending: EndingType | null;
  secondRunUnlocked: boolean;
  totalRunsCompleted: number;
}
