import { GameSaveState, GameRunStats } from '../types/game';
import { INITIAL_ACTION_STATS, INITIAL_ROOM_STATE } from './roomEngine';

const SAVE_KEY = 'dont_break_the_loop_saved_state_v1';
const HISTORY_KEY = 'dont_break_the_loop_run_history_v1';

export function getInitialGameState(): GameSaveState {
  return {
    version: 1,
    loopCount: 1,
    anomalyLevel: 10,
    actionStats: { ...INITIAL_ACTION_STATS, loopFirstActions: {}, recentActionSequence: [] },
    actionHistory: [],
    behaviorProfile: {
      rusher: 0,
      explorer: 30,
      repeater: 0,
      collector: 0,
      observer: 20,
      riskTaker: 0,
      patternPlayer: 0,
      dominantTrait: 'explorer',
      predictabilityScore: 10,
    },
    inventory: [],
    cluesFound: [],
    roomState: { ...INITIAL_ROOM_STATE, loop8UniqueInteractions: [] },
    gameStarted: false,
    gameCompleted: false,
    ending: null,
    secondRunUnlocked: false,
    totalRunsCompleted: 0,
  };
}

export function saveGameState(state: GameSaveState): void {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Failed to save game state to localStorage', e);
  }
}

export function loadGameState(): GameSaveState {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return getInitialGameState();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || parsed.version !== 1) {
      return getInitialGameState();
    }
    return parsed;
  } catch {
    return getInitialGameState();
  }
}

export function clearGameState(): void {
  try {
    localStorage.removeItem(SAVE_KEY);
  } catch (e) {
    console.warn('Failed to clear game state', e);
  }
}

export function saveRunHistory(run: GameRunStats): void {
  try {
    const history = getRunHistory();
    history.push(run);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.warn('Failed to save run history', e);
  }
}

export function getRunHistory(): GameRunStats[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    return JSON.parse(raw) || [];
  } catch {
    return [];
  }
}
