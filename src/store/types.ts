// 集中定义 store 使用的数据状态、动作接口与状态迁移 patch 类型。
import type {
  BattleCooldownState,
  BattleLogEntry,
  BattleReward,
  BattleSkillId,
  BattleSkillModifier,
  BattleSkillRuntimeState,
  BattleSummary,
  BattleTacticCondition,
  BattleTacticSlot,
  Character,
  Enemy,
  GeneratedMap,
  ViewName,
} from '../types';

export interface GameState {
  currentView: ViewName;
  hero: Character;
  enemy: Enemy;
  generatedMap: GeneratedMap;
  battleLog: BattleLogEntry[];
  activeRoomId: string | null;
  pendingReward: BattleReward | null;
  battleSummary: BattleSummary | null;
  battleTactics: BattleTacticSlot[];
  unlockedBattleSkills: BattleSkillId[];
  battleSkillDropChance: number;
  battleCooldowns: BattleCooldownState;
  battleSkillRuntimeState: BattleSkillRuntimeState;
  setView: (view: ViewName) => void;
  resetRun: () => void;
  selectRoom: (roomId: string) => void;
  moveBattlePriority: (skillId: BattleSkillId, direction: 'up' | 'down') => void;
  reorderBattlePriority: (fromSkillId: BattleSkillId, toSkillId: BattleSkillId) => void;
  setBattleTacticCondition: (skillId: BattleSkillId, condition: BattleTacticCondition) => void;
  enableBattleSkill: (skillId: BattleSkillId) => void;
  disableBattleSkill: (skillId: BattleSkillId) => void;
  upgradeBattleSkill: (skillId: BattleSkillId, modifier: BattleSkillModifier) => void;
  runBattleRound: () => void;
  claimReward: (choiceId?: string) => void;
}

export type SelectRoomState = Pick<GameState, 'generatedMap' | 'hero'>;

export type BattleRoundState = Pick<
  GameState,
  | 'currentView'
  | 'activeRoomId'
  | 'pendingReward'
  | 'hero'
  | 'enemy'
  | 'generatedMap'
  | 'battleTactics'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
  | 'battleLog'
  | 'battleSummary'
  | 'unlockedBattleSkills'
  | 'battleSkillDropChance'
>;

export type BattleEntryPatch = Pick<
  GameState,
  | 'activeRoomId'
  | 'hero'
  | 'enemy'
  | 'battleSummary'
  | 'battleLog'
  | 'currentView'
  | 'pendingReward'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
>;

export type BattleOngoingPatch = Pick<
  GameState,
  'hero' | 'enemy' | 'battleSummary' | 'battleLog' | 'battleCooldowns'
>;

export type BattleVictoryPatch = Pick<
  GameState,
  | 'hero'
  | 'enemy'
  | 'battleLog'
  | 'battleSummary'
  | 'battleCooldowns'
  | 'battleSkillDropChance'
  | 'pendingReward'
  | 'currentView'
>;

export type BattleDefeatPatch = Pick<
  GameState,
  'hero' | 'enemy' | 'battleLog' | 'battleSummary' | 'battleCooldowns' | 'pendingReward' | 'currentView'
>;

export type BattleRoundPatch = BattleOngoingPatch | BattleVictoryPatch | BattleDefeatPatch;

export type ClaimRewardState = Pick<
  GameState,
  'pendingReward' | 'generatedMap' | 'hero' | 'unlockedBattleSkills' | 'battleTactics'
>;

export type RewardClaimPatch = Pick<
  GameState,
  | 'hero'
  | 'generatedMap'
  | 'activeRoomId'
  | 'pendingReward'
  | 'battleSummary'
  | 'currentView'
  | 'enemy'
  | 'battleTactics'
  | 'unlockedBattleSkills'
  | 'battleCooldowns'
  | 'battleSkillRuntimeState'
  | 'battleLog'
>;

